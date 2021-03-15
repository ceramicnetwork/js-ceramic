import { BehaviorSubject, Subscription } from 'rxjs';
import { DocState, DocStateHolder, DoctypeUtils } from '@ceramicnetwork/common';
import { DocID } from '@ceramicnetwork/docid';
import { SubscriptionSet } from '../subscription-set';

export class RunningState extends BehaviorSubject<DocState> implements DocStateHolder {
  readonly id: DocID;
  readonly subscriptionSet: SubscriptionSet = new SubscriptionSet();

  constructor(initial: DocState) {
    super(initial);
    this.id = new DocID(initial.doctype, initial.log[0].cid);
  }

  next(next: DocState) {
    const current = this.value;
    if (!DoctypeUtils.statesEqual(current, next)) {
      super.next(next);
    }
  }

  get state() {
    return this.value;
  }

  /**
   * Track related subscription.
   */
  add(subscription: Subscription) {
    this.subscriptionSet.add(subscription);
  }

  /**
   * Mark the RunningState complete, closed, and unsubscribe from related subscriptions in subscriptionSet.
   */
  complete() {
    this.subscriptionSet.unsubscribe();
    super.complete();
    this.unsubscribe();
  }
}
