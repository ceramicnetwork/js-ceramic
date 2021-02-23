import { Observable, EMPTY, pipe, of, from, Subscription } from 'rxjs';
import { deserialize, PubsubMessage, serialize } from './pubsub-message';
import { IpfsApi } from '@ceramicnetwork/common';
import { map, catchError, mergeMap } from 'rxjs/operators';
import { IncomingChannel, filterOuter } from './incoming-channel';
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/logger';
import { Memoize } from 'typescript-memoize';

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
    private readonly pubsubLogger: ServiceLogger,
    private readonly logger: DiagnosticsLogger,
  ) {
    super((subscriber) => {
      const incoming$ = new IncomingChannel(ipfs, topic, resubscribeEvery, pubsubLogger, logger);
      incoming$.pipe(filterOuter(this.peerId$), ipfsToPubsub).subscribe(subscriber);
    });
  }

  @Memoize()
  get peerId$() {
    return from<Promise<string>>(this.ipfs.id().then((_) => _.id));
  }

  /**
   * Publish message to IPFS Pubsub as a "fire and forget" command.
   * Returned Subscription is free to ignore.
   */
  publish(message: PubsubMessage): Subscription {
    return this.peerId$
      .pipe(
        mergeMap(async (peerId) => {
          await this.ipfs.pubsub.publish(this.topic, serialize(message));
          return peerId;
        }),
      )
      .subscribe({
        next: (peerId) => {
          this.pubsubLogger.log({ peer: peerId, event: 'published', topic: this.topic, message: message });
        },
        error: (error) => {
          this.logger.err(error.message);
        },
      });
  }
}
