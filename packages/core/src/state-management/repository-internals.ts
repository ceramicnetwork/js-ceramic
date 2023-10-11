import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import {
  type AnchorEvent,
  AnchorStatus,
  CommitType,
  Context,
  type DiagnosticsLogger,
  StreamUtils,
  UnreachableCaseError,
} from '@ceramicnetwork/common'
import type { LocalIndexApi } from '@ceramicnetwork/indexing'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import type { CAR } from 'cartonne'
import type { CID } from 'multiformats/cid'
import {
  EMPTY,
  type Observable,
  Subject,
  type Subscription,
  catchError,
  concatMap,
  takeUntil,
} from 'rxjs'

import type { Dispatcher } from '../dispatcher.js'
import type { HandlersMap } from '../handlers-map.js'

import { AnchorRequestStore } from '../store/anchor-request-store.js'
import { PinStore } from '../store/pin-store.js'

import type { ExecutionQueue } from './execution-queue.js'
import { RunningState } from './running-state.js'
import type { StateCache } from './state-cache.js'
import { StreamLoader } from '../stream-loading/stream-loader.js'
import { StreamUpdater } from '../stream-loading/stream-updater.js'
import type { AnchorService } from '../anchor/anchor-service.js'

const APPLY_ANCHOR_COMMIT_ATTEMPTS = 3
const ANCHOR_POLL_COUNT = 'anchor_poll_count'

export type RepositoryInternalsParams = {
  anchorRequestStore: AnchorRequestStore
  anchorService: AnchorService
  context: Context
  dispatcher: Dispatcher
  executionQ: ExecutionQueue
  handlers: HandlersMap
  index: LocalIndexApi
  inmemory: StateCache<RunningState>
  loadingQ: ExecutionQueue
  logger: DiagnosticsLogger
  pinStore: PinStore
  streamLoader: StreamLoader
  streamUpdater: StreamUpdater
}

export class RepositoryInternals {
  #anchorRequestStore: AnchorRequestStore
  #anchorService: AnchorService
  #context: Context
  #dispatcher: Dispatcher
  #executionQ: ExecutionQueue
  #handlers: HandlersMap
  #index: LocalIndexApi
  #inmemory: StateCache<RunningState>
  #loadingQ: ExecutionQueue
  #logger: DiagnosticsLogger
  #pinStore: PinStore
  #streamLoader: StreamLoader
  #streamUpdater: StreamUpdater

  #numPendingAnchorSubscriptions = 0

  constructor(params: RepositoryInternalsParams) {
    this.#anchorRequestStore = params.anchorRequestStore
    this.#anchorService = params.anchorService
    this.#context = params.context
    this.#dispatcher = params.dispatcher
    this.#executionQ = params.executionQ
    this.#handlers = params.handlers
    this.#index = params.index
    this.#inmemory = params.inmemory
    this.#loadingQ = params.loadingQ
    this.#logger = params.logger
    this.#pinStore = params.pinStore
    this.#streamLoader = params.streamLoader
    this.#streamUpdater = params.streamUpdater
  }

  /**
   * Returns the number of background tasks that are polling for the status of a pending anchor.
   * There should generally only be one anchor polling subscription per Stream.
   */
  get numPendingAnchorSubscriptions(): number {
    return this.#numPendingAnchorSubscriptions
  }

  /**
   * Adds the stream's RunningState to the in-memory cache and subscribes the Repository's global feed$ to receive changes emitted by that RunningState
   */
  add(state$: RunningState): void {
    this.#inmemory.set(state$.id.toString(), state$)
  }

  /**
   * Helper function to add stream to db index if it has a 'model' in its metadata.
   * @public
   */
  async indexStreamIfNeeded(state$: RunningState): Promise<void> {
    if (!state$.value.metadata.model) {
      return
    }

    const asDate = (unixTimestamp: number | null | undefined) => {
      return unixTimestamp ? new Date(unixTimestamp * 1000) : null
    }

    // TODO(NET-1614) Test that the timestamps are correctly passed to the Index API.
    const lastAnchor = asDate(StreamUtils.anchorTimestampFromState(state$.value))
    const firstAnchor = asDate(
      state$.value.log.find((log) => log.type == CommitType.ANCHOR)?.timestamp
    )
    const streamContent = {
      model: state$.value.metadata.model,
      streamID: state$.id,
      controller: state$.value.metadata.controllers[0],
      streamContent: state$.value.content,
      tip: state$.tip,
      lastAnchor: lastAnchor,
      firstAnchor: firstAnchor,
    }

    await this.#index.indexStream(streamContent)
  }

  /**
   * Restart polling and handle response for a previously submitted anchor request
   */
  confirmAnchorResponse(state$: RunningState, cid: CID): Subscription {
    const anchorStatus$ = this.#anchorService.pollForAnchorResponse(state$.id, cid)
    return this.processAnchorResponse(state$, anchorStatus$)
  }

  /**
   * Handle AnchorEvent and update state$.
   *
   * @param state$ - RunningState instance to update.
   * @param anchorEvent - response from CAS.
   * @return boolean - `true` if polling should stop, `false` if polling continues
   */
  async handleAnchorResponse(state$: RunningState, anchorEvent: AnchorEvent): Promise<boolean> {
    // We don't want to change a stream's state due to changes to the anchor
    // status of a commit that is no longer the tip of the stream, so we early return
    // in most cases when receiving a response to an old anchor request.
    // The one exception is if the AnchorEvent indicates that the old commit
    // is now anchored, in which case we still want to try to process the anchor commit
    // and let the stream's conflict resolution mechanism decide whether or not to update
    // the stream's state.
    const status = anchorEvent.status
    switch (status) {
      case AnchorRequestStatusName.READY:
      case AnchorRequestStatusName.PENDING: {
        if (!anchorEvent.cid.equals(state$.tip)) return
        const next = {
          ...state$.value,
          anchorStatus: AnchorStatus.PENDING,
        }
        state$.next(next)
        await this._updateStateIfPinned(state$)
        return false
      }
      case AnchorRequestStatusName.PROCESSING: {
        if (!anchorEvent.cid.equals(state$.tip)) return
        state$.next({ ...state$.value, anchorStatus: AnchorStatus.PROCESSING })
        await this._updateStateIfPinned(state$)
        return false
      }
      case AnchorRequestStatusName.COMPLETED: {
        if (anchorEvent.cid.equals(state$.tip)) {
          await this.#anchorRequestStore.remove(state$.id)
        }
        await this._handleAnchorCommit(state$, anchorEvent.cid, anchorEvent.witnessCar)
        return true
      }
      case AnchorRequestStatusName.FAILED: {
        this.#logger.warn(
          `Anchor failed for commit ${anchorEvent.cid} of stream ${anchorEvent.streamId}: ${anchorEvent.message}`
        )

        // if this is the anchor response for the tip update the state
        if (anchorEvent.cid.equals(state$.tip)) {
          state$.next({ ...state$.value, anchorStatus: AnchorStatus.FAILED })
          await this.#anchorRequestStore.remove(state$.id)
        }
        // we stop the polling as this is a terminal state
        return true
      }
      case AnchorRequestStatusName.REPLACED: {
        this.#logger.verbose(
          `Anchor request for commit ${anchorEvent.cid} of stream ${anchorEvent.streamId} is replaced`
        )

        // If this is the tip and the node received a REPLACED response for it the node has gotten into a weird state.
        // Hopefully this should resolve through updates that will be received shortly or through syncing the stream.
        if (anchorEvent.cid.equals(state$.tip)) {
          await this.#anchorRequestStore.remove(state$.id)
        }

        return true
      }
      default:
        throw new UnreachableCaseError(status, 'Unknown anchoring state')
    }
  }

  processAnchorResponse(
    state$: RunningState,
    anchorStatus$: Observable<AnchorEvent>
  ): Subscription {
    const stopSignal = new Subject<void>()
    this.#numPendingAnchorSubscriptions++
    Metrics.observe(ANCHOR_POLL_COUNT, this.#numPendingAnchorSubscriptions)
    const subscription = anchorStatus$
      .pipe(
        takeUntil(stopSignal),
        concatMap(async (anchorEvent) => {
          const shouldStop = await this.handleAnchorResponse(state$, anchorEvent)
          if (shouldStop) stopSignal.next()
        }),
        catchError((error) => {
          // TODO: Combine these two log statements into one line so that they can't get split up in the
          // log output.
          this.#logger.warn(`Error while anchoring stream ${state$.id}:${error}`)
          this.#logger.warn(error) // Log stack trace

          // TODO: This can leave a stream with AnchorStatus PENDING or PROCESSING indefinitely.
          // We should distinguish whether the error is transient or permanent, and either transition
          // to AnchorStatus FAILED or keep retrying.
          return EMPTY
        })
      )
      .subscribe(
        null,
        (err) => {
          this.#numPendingAnchorSubscriptions--
          Metrics.observe(ANCHOR_POLL_COUNT, this.#numPendingAnchorSubscriptions)
          throw err
        },
        () => {
          this.#numPendingAnchorSubscriptions--
          Metrics.observe(ANCHOR_POLL_COUNT, this.#numPendingAnchorSubscriptions)
        }
      )
    state$.add(subscription)
    return subscription
  }

  /**
   * Takes the CID of an anchor commit received from an anchor service and applies it. Runs the
   * work of loading and applying the commit on the execution queue so it gets serialized alongside
   * any other updates to the same stream. Includes logic to retry up to a total of 3 attempts to
   * handle transient failures of loading the anchor commit from IPFS.
   *
   * Note that most of the time this will be a no-op because we'll have already heard about the
   * AnchorCommit via a pubsub message from the Ceramic node used by the CAS.  Since we have to poll
   * the CAS anyway in order to learn if our anchor request failed, it seems prudent not to throw
   * away information if we do wind up learning of the AnchorCommit via polling and haven't
   * heard about it already via pubsub (given that pubsub is an unreliable channel).
   * @param state$ - state of the stream being anchored
   * @param tip - The tip that anchorCommit is anchoring
   * @param witnessCAR - CAR file with all the IPLD objects needed to apply and verify the anchor commit
   * @private
   */
  async _handleAnchorCommit(state$: RunningState, tip: CID, witnessCAR: CAR): Promise<void> {
    const anchorCommitCID = witnessCAR.roots[0]
    if (!anchorCommitCID) throw new Error(`No anchor commit CID as root`)
    for (
      let remainingRetries = APPLY_ANCHOR_COMMIT_ATTEMPTS - 1;
      remainingRetries >= 0;
      remainingRetries--
    ) {
      try {
        await this.#dispatcher.importCAR(witnessCAR)

        await this.#executionQ.forStream(state$.id).run(async () => {
          const applied = await this.handleTip(state$, anchorCommitCID)
          if (applied) {
            // We hadn't already heard about the AnchorCommit via pubsub, so it's possible
            // other nodes didn't hear about it via pubsub either, so we rebroadcast it to pubsub now.
            this.publishTip(state$)

            if (remainingRetries < APPLY_ANCHOR_COMMIT_ATTEMPTS - 1) {
              // If we failed to apply the commit at least once, then it's worth logging when
              // we are able to do so successfully on the retry.
              this.#logger.imp(
                `Successfully applied anchor commit ${anchorCommitCID} for stream ${state$.id}`
              )
            }
          }
        })
        return
      } catch (error) {
        this.#logger.warn(
          `Error while applying anchor commit ${anchorCommitCID} for stream ${state$.id}, ${remainingRetries} retries remain. ${error}`
        )

        if (remainingRetries == 0) {
          this.#logger.err(`Anchor failed for commit ${tip} of stream ${state$.id}: ${error}`)

          // Don't update stream's state if the commit that failed to be anchored is no longer the
          // tip of that stream.
          if (tip.equals(state$.tip)) {
            state$.next({ ...state$.value, anchorStatus: AnchorStatus.FAILED })
          }
        }
      }
    }
  }

  publishTip(state$: RunningState): void {
    this.#dispatcher.publishTip(state$.id, state$.tip, state$.state.metadata.model)
  }

  /**
   * Applies the given tip CID as a new commit to the given running state.
   * @param state$ - State to apply tip to
   * @param cid - tip CID
   * @returns boolean - whether or not the tip was actually applied
   */
  async handleTip(state$: RunningState, cid: CID): Promise<boolean> {
    this.#logger.verbose(`Learned of new tip ${cid} for stream ${state$.id}`)
    const next = await this.#streamUpdater.applyTipFromNetwork(state$.state, cid)
    if (next) {
      await this._updateStateIfPinned(state$)
      state$.next(next)
      this.#logger.verbose(`Stream ${state$.id} successfully updated to tip ${cid}`)
      return true
    } else {
      return false
    }
  }

  async _updateStateIfPinned(state$: RunningState): Promise<void> {
    const isPinned = Boolean(await this.#pinStore.stateStore.load(state$.id))
    // TODO (NET-1687): unify shouldIndex check into indexStreamIfNeeded
    const shouldIndex =
      state$.state.metadata.model && this.#index.shouldIndexStream(state$.state.metadata.model)
    if (isPinned || shouldIndex) {
      await this.#pinStore.add(state$)
    }
    await this.indexStreamIfNeeded(state$)
  }
}
