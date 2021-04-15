import { Subscription } from 'rxjs';
import { StreamState, RunningStateLike, StreamStateSubject } from '@ceramicnetwork/common';
import { StreamID } from '@ceramicnetwork/streamid';
import { SubscriptionSet } from '../subscription-set';
import CID from 'cids';

export class RunningState extends StreamStateSubject implements RunningStateLike {
  readonly id: StreamID;
  readonly subscriptionSet: SubscriptionSet = new SubscriptionSet();

  constructor(initial: StreamState) {
    super(initial);
    this.id = new StreamID(initial.doctype, initial.log[0].cid);
  }

  get tip(): CID {
    return this.value.log[this.value.log.length - 1].cid;
  }

  get state(): StreamState {
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
