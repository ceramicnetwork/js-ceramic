import { Observable } from 'rxjs';
import { IpfsApi } from '@ceramicnetwork/common';
import { TaskQueue } from './task-queue';
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/logger';

// Typestub for pubsub message.
// At some future time this type definition should be provided by IPFS.
export type IPFSPubsubMessage = {
  from: string;
  seqno: Uint8Array;
  data: Uint8Array;
  topicIDs: string[];
};

async function resubscribe(
  ipfs: IpfsApi,
  topic: string,
  peerId: string,
  pubsubLogger: ServiceLogger,
  handler: (message: IPFSPubsubMessage) => void,
) {
  const listeningTopics = await ipfs.pubsub.ls();
  const isSubscribed = listeningTopics.includes(topic);
  if (!isSubscribed) {
    await ipfs.pubsub.unsubscribe(topic, handler);
    await ipfs.pubsub.subscribe(topic, handler);
    pubsubLogger.log({ peer: peerId, event: 'subscribed', topic: topic });
  }
}

/**
 * Incoming IPFS PubSub message stream as Observable.
 * Ensures that ipfs subscription to a topic is established by periodically re-subscribing.
 */
export class PubsubIncoming extends Observable<IPFSPubsubMessage> {
  constructor(
    ipfs: IpfsApi,
    topic: string,
    resubscribeEvery: number,
    peerId: string,
    pubsubLogger: ServiceLogger,
    logger: DiagnosticsLogger,
    taskQueue?: TaskQueue,
  ) {
    super((subscriber) => {
      // We want all the tasks added to execute in FIFO order.
      // Subscription attempts must be sequential.
      // Last call to unsubscribe must execute after all the attempts are done,
      // and all the attempts yet inactive are cleared.
      const tasks =
        taskQueue ||
        new TaskQueue((error, retry) => {
          if (error.message.includes('Already subscribed')) {
            logger.debug(error.message);
          } else if (error.message.includes('The user aborted a request')) {
            // For some reason the first call to pubsub.subscribe throws this error.
            retry();
          } else {
            logger.err(error.message);
          }
        });

      const handler = (message: IPFSPubsubMessage) => {
        subscriber.next(message);
      };

      tasks.add(() => resubscribe(ipfs, topic, peerId, pubsubLogger, handler));

      const ensureSubscribed = setInterval(async () => {
        tasks.add(() => resubscribe(ipfs, topic, peerId, pubsubLogger, handler));
      }, resubscribeEvery);

      return () => {
        clearInterval(ensureSubscribed);
        tasks.clear();
        // Unsubscribe only after a currently running task is finished.
        tasks.add(() => {
          return ipfs.pubsub.unsubscribe(topic, handler);
        });
      };
    });
  }
}
