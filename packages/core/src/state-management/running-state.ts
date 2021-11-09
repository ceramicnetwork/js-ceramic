import { Subscription } from 'rxjs'
import {
  StreamState,
  RunningStateLike,
  StreamStateSubject,
  SubscriptionSet,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import CID from 'cids'

export class RunningState extends StreamStateSubject implements RunningStateLike {
  readonly id: StreamID
  readonly subscriptionSet: SubscriptionSet = new SubscriptionSet()
  private _pinnedCommits?: Set<string>

  constructor(initial: StreamState, private pinned: boolean) {
    super(initial)
    this.id = new StreamID(initial.type, initial.log[0].cid)

    if (pinned) {
      this.markAsPinned()
    }
  }

  get tip(): CID {
    return this.value.log[this.value.log.length - 1].cid
  }

  get state(): StreamState {
    return this.value
  }

  get pinnedCommits(): Set<string> {
    return this._pinnedCommits
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
    this.pinned = true
    this._pinnedCommits = new Set(this.state.log.map(({ cid }) => cid.toString()))
  }

  /**
   * Clears the pinned state.
   */
  markAsUnpinned() {
    this.pinned = false
    this._pinnedCommits = null
  }
}
