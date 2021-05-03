import { buildQueryMessage, MsgType, PubsubMessage, ResponseMessage } from './pubsub-message';
import { Observable, Subject, Subscription, SubscriptionLike, EMPTY } from 'rxjs';
import { filter, map, timeoutWith } from 'rxjs/operators';
import { StreamID } from '@ceramicnetwork/streamid';
import CID from 'cids';

export const MAX_RESPONSE_INTERVAL = 200; // milliseconds

/**
 * Multiplexing IPFS Pubsub.
 */
export class MessageBus extends Observable<PubsubMessage> implements SubscriptionLike {
  readonly outstandingQueries: Map<string, StreamID> = new Map();
  private readonly pubsubSubscription: Subscription;
  private readonly feed$: Subject<PubsubMessage> = new Subject<PubsubMessage>();

  constructor(readonly pubsub: Observable<PubsubMessage> & { next: (m: PubsubMessage) => Subscription }) {
    super((subscriber) => {
      this.feed$.subscribe(subscriber);
    });
    this.pubsubSubscription = this.pubsub.subscribe(this.feed$);
  }

  /**
   * Return true if stopped. Necessary for SubscriptionLike interface.
   */
  get closed() {
    return this.feed$.isStopped;
  }

  /**
   * Publish message to Pubsub. If closed, return empty subscription.
   */
  next(message: PubsubMessage): Subscription {
    if (this.closed) {
      return Subscription.EMPTY;
    } else {
      return this.pubsub.next(message);
    }
  }

  /**
   * Query network for tips of a stream.
   *
   * Sends query message to a network, adding the message id to outstandingQueries.
   * Returns CID of the tip based on response message.
   */
  queryNetwork(streamId: StreamID): Observable<CID> {
    const queryMessage = buildQueryMessage(streamId);
    this.next(queryMessage);
    this.outstandingQueries.set(queryMessage.id, streamId);
    return this.pipe(
      filter<PubsubMessage, ResponseMessage>(
        (message): message is ResponseMessage => message.typ === MsgType.RESPONSE && message.id === queryMessage.id,
      ),
      map((message) => message.tips.get(streamId.toString())),
      filter(tip => !!tip),
      timeoutWith(MAX_RESPONSE_INTERVAL, EMPTY),
    );
  }

  /**
   * Stop the message feed.
   */
  unsubscribe(): void {
    if (!this.pubsubSubscription.closed) this.pubsubSubscription.unsubscribe();
    this.feed$.complete();
  }
}
