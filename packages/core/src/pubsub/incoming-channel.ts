import { interval, Observable } from 'rxjs';
import { Memoize } from 'typescript-memoize';
import { IpfsApi } from '@ceramicnetwork/common';
import { TaskQueue } from './task-queue';
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/logger';
import { pipe, MonoTypeOperatorFunction } from 'rxjs';
import { map, filter, concatMap } from 'rxjs/operators';

// Typestub for pubsub message.
// At some future time this type definition should be provided by IPFS.
export type IPFSPubsubMessage = {
  from: string;
  seqno: Uint8Array;
  data: Uint8Array;
  topicIDs: string[];
  signature: Uint8Array;
  key: Uint8Array;
};

async function resubscribe(
  ipfs: IpfsApi,
  topic: string,
  pubsubLogger: ServiceLogger,
  handler: (message: IPFSPubsubMessage) => void,
) {
  const listeningTopics = await ipfs.pubsub.ls();
  const isSubscribed = listeningTopics.includes(topic);
  if (!isSubscribed) {
    await ipfs.pubsub.unsubscribe(topic, handler);
    await ipfs.pubsub.subscribe(topic, handler);
    const ipfsId = await ipfs.id();
    const peerId = ipfsId.id;
    pubsubLogger.log({ peer: peerId, event: 'subscribed', topic: topic });
  }
}

/**
 * Incoming IPFS PubSub message stream as Observable.
 * Ensures that ipfs subscription to a topic is live by periodically re-subscribing.
 *
 * One could simplify this by removing periodic re-subscription and serialization via task-queue.
 * Unfortunately, we can end up with concurrency issues: trying to unsubscribe while (or right after) other instance tries to subscribe.
 * So, better keep it all together.
 */
export class IncomingChannel extends Observable<IPFSPubsubMessage> {
  constructor(
    ipfs: IpfsApi,
    topic: string,
    resubscribeEvery: number,
    pubsubLogger: ServiceLogger,
    readonly logger: DiagnosticsLogger,
  ) {
    super((subscriber) => {
      const handler = (message: IPFSPubsubMessage) => subscriber.next(message);

      this.tasks.add(() => resubscribe(ipfs, topic, pubsubLogger, handler));

      const ensureSubscribed = interval(resubscribeEvery).subscribe(() => {
        this.tasks.add(() => resubscribe(ipfs, topic, pubsubLogger, handler));
      });

      return () => {
        ensureSubscribed.unsubscribe();
        // Remove pending subscription attempts.
        this.tasks.clear();
        // Unsubscribe only after a currently running task is finished.
        this.tasks.add(() => {
          return ipfs.pubsub.unsubscribe(topic, handler);
        });
      };
    });
  }

  // We want all the tasks added to execute in FIFO order.
  // Subscription attempts must be sequential.
  // Last call to unsubscribe must execute after all the attempts are done,
  // and all the attempts yet inactive are cleared.
  @Memoize()
  get tasks() {
    return new TaskQueue((error, retry) => {
      if (error.message.includes('Already subscribed')) {
        this.logger.debug(error.message);
      } else if (error.message.includes('The user aborted a request')) {
        // For some reason the first call to pubsub.subscribe throws this error.
        retry();
      } else {
        this.logger.err(error.message);
      }
    });
  }
}

/**
 * Pass only messages from other IPFS nodes.
 * @param peerId$ - Own peer id.
 */
export function filterOuter(peerId$: Observable<string>): MonoTypeOperatorFunction<IPFSPubsubMessage> {
  return pipe(
    concatMap((data: IPFSPubsubMessage) => {
      return peerId$.pipe(map((peerId) => ({ isOuter: data.from !== peerId, entry: data })));
    }),
    // Filter the container object synchronously for the value in each data container object
    filter((data) => data.isOuter),
    // remove the data container object from the observable chain
    map((data) => data.entry),
  );
}
