import { Subscription } from 'rxjs';

/**
 * Track a set of active subscriptions. Unsubscribe them all at once.
 *
 * If a subscription gets unsubscribed, it auto-removes from the set.
 */
export class SubscriptionSet {
  constructor(readonly subscriptions: Set<Subscription> = new Set()) {}

  /**
   * Start tracking a subscription, so that it is closed with others on +close+.
   */
  add(subscription: Subscription) {
    subscription.add(() => {
      this.subscriptions.delete(subscription);
    });
    this.subscriptions.add(subscription);
  }

  /**
   * Unsubscribe all the subscriptions.
   */
  unsubscribe() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
