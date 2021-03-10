import { PubsubMessage } from './pubsub-message';
import { Observable, Subject, Subscription, SubscriptionLike } from 'rxjs';
import { Pubsub } from './pubsub';

/**
 * Multiplexing IPFS Pubsub.
 */
export class MessageBus extends Observable<PubsubMessage> implements SubscriptionLike {
  readonly pubsubSubscription: Subscription;
  readonly feed$: Subject<PubsubMessage> = new Subject<PubsubMessage>();

  constructor(readonly pubsub: Pubsub) {
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
   * Stop the message feed.
   */
  unsubscribe(): void {
    this.pubsubSubscription.unsubscribe();
    this.feed$.complete();
    this.feed$.unsubscribe();
  }
}
