import { buildQueryMessage, MsgType, PubsubMessage, ResponseMessage } from './pubsub-message';
import { Observable, Subject, Subscription, SubscriptionLike } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { DocID } from '@ceramicnetwork/docid';
import CID from 'cids';

/**
 * Multiplexing IPFS Pubsub.
 */
export class MessageBus extends Observable<PubsubMessage> implements SubscriptionLike {
  readonly outstandingQueries: Map<string, DocID> = new Map();
  private readonly pubsubSubscription: Subscription;
  private readonly feed$: Subject<PubsubMessage> = new Subject<PubsubMessage>();

  constructor(
    readonly pubsub: Observable<PubsubMessage> & { next: (m: PubsubMessage) => Subscription },
  ) {
    super((subscriber) => {
      this.feed$.subscribe(subscriber);
    });
    this.pubsubSubscription = this.pubsub.subscribe(this.feed$);
  }

  /**
   * Return true if stopped. Necessary for SubscriptionLike interface.
   */
  get closed() {
    return this.feed$.closed;
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
   * Query network for tips of document.
   *
   * Sends query message to a network, adding the message id to outstandingQueries.
   * Returns CID of the tip based on response message.
   */
  queryNetwork(docId: DocID): Observable<CID> {
    const queryMessage = buildQueryMessage(docId);
    this.next(queryMessage);
    this.outstandingQueries.set(queryMessage.id, docId);
    return this.pipe(
      filter<PubsubMessage, ResponseMessage>(
        (message): message is ResponseMessage => message.typ === MsgType.RESPONSE && message.id === queryMessage.id,
      ),
      map((message) => message.tips.get(docId.toString())),
      take(1),
    );
  }

  /**
   * Stop the message feed.
   */
  unsubscribe(): void {
    if (!this.pubsubSubscription.closed) this.pubsubSubscription.unsubscribe();
    if (!this.feed$.closed) {
      this.feed$.complete();
      this.feed$.unsubscribe();
    }
  }
}
