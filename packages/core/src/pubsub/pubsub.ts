import { Observable, EMPTY, pipe } from 'rxjs';
import { deserialize, PubsubMessage } from './pubsub-message';
import { IpfsApi } from '@ceramicnetwork/common';
import { PubsubIncoming } from './pubsub-incoming';
import { map, catchError } from 'rxjs/operators';
import { IPFSPubsubMessage, Resubscribe } from './resubscribe';
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/logger';
import { TaskQueue } from './task-queue';

const ipfsToPubsub = pipe(
  map<IPFSPubsubMessage, PubsubMessage>((message) => deserialize(message)),
  catchError(() => EMPTY),
);

export class Pubsub extends Observable<PubsubMessage> {
  constructor(
    private readonly ipfs: IpfsApi,
    private readonly topic: string,
    private readonly resubscribeEvery: number,
    pubsubLogger: ServiceLogger,
    logger: DiagnosticsLogger,
    taskQueue?: TaskQueue,
  ) {
    super((subscriber) => {
      const incoming$Factory = (peerId: string) =>
        new Resubscribe(ipfs, topic, resubscribeEvery, peerId, pubsubLogger, logger, taskQueue);
      const incoming$ = new PubsubIncoming(ipfs, incoming$Factory);
      incoming$.pipe(ipfsToPubsub).subscribe(subscriber);
    });
  }

  publish(message: PubsubMessage) {
    throw new Error(`Not Implemented`);
  }
}
