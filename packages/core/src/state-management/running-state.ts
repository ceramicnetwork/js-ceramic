import { Subscription } from 'rxjs'
import {
  StreamState,
  RunningStateLike,
  StreamStateSubject,
  SubscriptionSet,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import CID from 'cids'

/**
 * Describes the source from which this RunningState was initialized with its StreamState
 */
export enum StateSource {
  /**
   * Indicates that the stream was pinned and its state was loaded from the StateStore. This will cause runningState to keep track of the stored commit CIDs.
   * The stored commit CIDs can be used to prevent commits from being stored again.
   */
  STATESTORE,
  /**
   * Indicates that the Stream was loaded from the network.
   * runningState does not keep track of the commit CID's of the state as they may not have been stored.
   */
  NETWORK,
}
export class RunningState extends StreamStateSubject implements RunningStateLike {
  readonly id: StreamID
  readonly subscriptionSet: SubscriptionSet = new SubscriptionSet()
  pinnedCommits?: Set<string>

  constructor(initial: StreamState, public stateSource: StateSource) {
    super(initial)
    this.id = new StreamID(initial.type, initial.log[0].cid)

    if (stateSource === StateSource.STATESTORE) {
      this.markAsPinned()
    }
  }

  get tip(): CID {
    return this.value.log[this.value.log.length - 1].cid
  }

  get state(): StreamState {
    return this.value
  }

  /**
   * Track related subscription.
   */
  add(subscription: Subscription) {
    this.subscriptionSet.add(subscription)
  }

  /**
   * Mark the RunningState complete, closed, and unsubscribe from related subscriptions in subscriptionSet.
   */
  complete() {
    this.subscriptionSet.unsubscribe()
    super.complete()
  }

  /**
   * Sets the pinned state to the current state by storing the CIDs
   */
  markAsPinned() {
    this.stateSource = StateSource.STATESTORE
    this.pinnedCommits = new Set(this.state.log.map(({ cid }) => cid.toString()))
  }
}
