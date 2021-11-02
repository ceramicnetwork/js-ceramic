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
 * Describes the source of the state
 */
export enum StateSource {
  /**
   * Source of the state is form a state store. This will cause runningState to keep track of the stored commit CIDs.
   * The stored commit CIDs can be used to prevent commits from being stored again.
   */
  STATESTORE,
  /**
   * Source of the state is the network.
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
      this.setPinnedState(initial)
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
   * Sets the pinned state to the given state by storing the CIDs
   * @param newState state of the stream to be pinned
   */
  setPinnedState(newState: StreamState) {
    this.stateSource = StateSource.STATESTORE
    this.pinnedCommits = new Set(newState.log.map(({ cid }) => cid.toString()))
  }
}
