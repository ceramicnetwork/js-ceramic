import { Subscription } from 'rxjs'
import {
  StreamState,
  RunningStateLike,
  StreamStateSubject,
  SubscriptionSet,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import CID from 'cids'

export enum StateSource {
  STATESTORE,
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
      this.pinnedCommits = new Set(initial.log.map(({ cid }) => cid.toString()))
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
