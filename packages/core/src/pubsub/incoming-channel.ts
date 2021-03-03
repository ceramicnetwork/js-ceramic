import { interval, Observable } from 'rxjs';
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

function buildResubscribeQueue(logger: DiagnosticsLogger) {
  return new TaskQueue((error, retry) => {
    if (error.message.includes('Already subscribed')) {
      logger.debug(error.message);
    } else if (error.message.includes('The user aborted a request')) {
      // For some reason the first call to pubsub.subscribe throws this error.
      retry();
    } else {
      logger.err(error);
    }
  });
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
  // Subscription attempts must be sequential, in FIFO order.
  // Last call to unsubscribe must execute after all the attempts are done,
  // and all the attempts yet inactive are cleared.
  readonly tasks: TaskQueue;

  constructor(
    readonly ipfs: IpfsApi,
    readonly topic: string,
    readonly resubscribeEvery: number,
    readonly pubsubLogger: ServiceLogger,
    readonly logger: DiagnosticsLogger,
  ) {
    super((subscriber) => {
      const handler = (message: IPFSPubsubMessage) => subscriber.next(message);

      this.tasks.add(() => this.resubscribe(handler));

      const ensureSubscribed = interval(this.resubscribeEvery).subscribe(() => {
        this.tasks.add(() => this.resubscribe(handler));
      });

      return () => {
        // Stop single source of subscription attempts
        ensureSubscribed.unsubscribe();
        // Remove pending subscription attempts.
        this.tasks.clear();
        // Unsubscribe only after a currently running task is finished.
        this.tasks.add(async () => {
          await this.ipfs.pubsub.unsubscribe(this.topic, handler);
        });
      };
    });
    this.tasks = buildResubscribeQueue(logger);
  }

  private async resubscribe(handler: (message: IPFSPubsubMessage) => void): Promise<void> {
    const listeningTopics = await this.ipfs.pubsub.ls();
    const isSubscribed = listeningTopics.includes(this.topic);
    if (!isSubscribed) {
      await this.ipfs.pubsub.unsubscribe(this.topic, handler);
      await this.ipfs.pubsub.subscribe(this.topic, handler);
      const ipfsId = await this.ipfs.id();
      const peerId = ipfsId.id;
      this.pubsubLogger.log({ peer: peerId, event: 'subscribed', topic: this.topic });
    }
  }
}

/**
 * Pass only messages from other IPFS nodes.
 * @param ownPeerId$ - Own peer id.
 */
export function filterExternal(ownPeerId$: Observable<string>): MonoTypeOperatorFunction<IPFSPubsubMessage> {
  return pipe(
    concatMap((data: IPFSPubsubMessage) => {
      return ownPeerId$.pipe(map((peerId) => ({ isOuter: data.from !== peerId, entry: data })));
    }),
    // Filter the container object synchronously for the value in each data container object
    filter((data) => data.isOuter),
    // remove the data container object from the observable chain
    map((data) => data.entry),
  );
}
