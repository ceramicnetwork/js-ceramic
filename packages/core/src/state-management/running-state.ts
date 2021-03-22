import { BehaviorSubject, Subscription } from 'rxjs';
import { DocState, RunningStateLike, DoctypeUtils } from '@ceramicnetwork/common';
import { DocID } from '@ceramicnetwork/docid';
import { SubscriptionSet } from '../subscription-set';
import CID from 'cids';

export class RunningState extends BehaviorSubject<DocState> implements RunningStateLike {
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

  get tip(): CID {
    return this.value.log[this.value.log.length - 1].cid;
  }

  get state(): DocState {
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
  }
}
