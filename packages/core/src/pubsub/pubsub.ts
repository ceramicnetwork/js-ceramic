import { Observable, EMPTY, pipe, of, from, Subscription, UnaryFunction } from 'rxjs';
import { deserialize, PubsubMessage, serialize } from './pubsub-message';
import { IpfsApi } from '@ceramicnetwork/common';
import { map, catchError, mergeMap, withLatestFrom } from 'rxjs/operators';
import { IncomingChannel, filterOuter, IPFSPubsubMessage } from './incoming-channel';
import { DiagnosticsLogger, ServiceLogger } from '@ceramicnetwork/logger';
import { Memoize } from 'typescript-memoize';

/**
 * Deserialize incoming message in an internal observable that does not emit if error happens.
 * Log a successfully deserialized message.
 *
 * @param peerId$ - own IPFS node peer id
 * @param pubsubLogger - logger that dumps a successfully deserialized message
 * @param topic - IPFS pubsub topic we listen
 */
function ipfsToPubsub(
  peerId$: Observable<string>,
  pubsubLogger: ServiceLogger,
  topic: string,
): UnaryFunction<Observable<IPFSPubsubMessage>, Observable<PubsubMessage>> {
  return pipe(
    withLatestFrom(peerId$),
    mergeMap(([incoming, peerId]) =>
      of(incoming).pipe(
        map((incoming) => {
          const message = deserialize(incoming);
          const logMessage = { ...incoming, data: message };
          delete logMessage.key;
          delete logMessage.signature;
          pubsubLogger.log({ peer: peerId, event: 'received', topic: topic, message: logMessage });
          return message;
        }),
        catchError(() => EMPTY),
      ),
    ),
  );
}

/**
 * Receive and publish messages to IPFS pubsub.
 */
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

      incoming$
        .pipe(filterOuter(this.peerId$), ipfsToPubsub(this.peerId$, pubsubLogger, topic))
        .subscribe(subscriber);
    });
  }

  @Memoize()
  private get peerId$() {
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
