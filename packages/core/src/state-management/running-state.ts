import { Subscription } from 'rxjs';
import { DocState, RunningStateLike, DocStateSubject } from '@ceramicnetwork/common';
import { StreamID } from '@ceramicnetwork/streamid';
import { SubscriptionSet } from '../subscription-set';
import CID from 'cids';

export class RunningState extends DocStateSubject implements RunningStateLike {
  readonly id: StreamID;
  readonly subscriptionSet: SubscriptionSet = new SubscriptionSet();

  constructor(initial: DocState) {
    super(initial);
    this.id = new StreamID(initial.type, initial.log[0].cid);
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
