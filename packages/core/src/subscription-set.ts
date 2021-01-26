import { Subscription } from "rxjs";

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
