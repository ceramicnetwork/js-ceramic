import { Observable, EMPTY, pipe, of } from 'rxjs';
import { deserialize, PubsubMessage } from './pubsub-message';
import { IpfsApi } from '@ceramicnetwork/common';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { IncomingChannel, filterOuter } from './incoming-channel';
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/logger';

// Internal observable that does not emit if error happens.
const ipfsToPubsub = pipe(
  mergeMap((message) =>
    of(message).pipe(
      map(deserialize),
      catchError(() => EMPTY),
    ),
  ),
);

export class Pubsub extends Observable<PubsubMessage> {
  constructor(
    private readonly ipfs: IpfsApi,
    private readonly topic: string,
    private readonly resubscribeEvery: number,
    pubsubLogger: ServiceLogger,
    logger: DiagnosticsLogger,
  ) {
    super((subscriber) => {
      const incoming$ = new IncomingChannel(ipfs, topic, resubscribeEvery, pubsubLogger, logger);
      incoming$.pipe(filterOuter(ipfs), ipfsToPubsub).subscribe(subscriber);
    });
  }

  publish(message: PubsubMessage) {
    throw new Error(`Not Implemented`);
  }
}
