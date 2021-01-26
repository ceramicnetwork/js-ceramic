import { Subscription } from "rxjs";

/**
 * Track a set of active subscriptions. Unsubscribe from all at once.
 *
 * If a subscription gets unsubscribed, it auto-removes from the set.
 */
export class SubscriptionSet {
  constructor(readonly subscriptions: Set<Subscription> = new Set()) {}

  add(subscription: Subscription) {
    subscription.add(() => {
      this.subscriptions.delete(subscription);
    });
    this.subscriptions.add(subscription);
  }

  close() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
