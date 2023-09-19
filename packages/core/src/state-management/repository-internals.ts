import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import {
  type AnchorEvent,
  type AnchorService,
  AnchorStatus,
  CommitType,
  Context,
  type DiagnosticsLogger,
  type InternalOpts,
  type LoadOpts,
  StreamUtils,
  SyncOptions,
  UnreachableCaseError,
} from '@ceramicnetwork/common'
import type { LocalIndexApi } from '@ceramicnetwork/indexing'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CAR } from 'cartonne'
import type { CID } from 'multiformats/cid'
import {
  EMPTY,
  type Observable,
  Subject,
  type Subscription,
  catchError,
  concatMap,
  lastValueFrom,
  merge,
  of,
  takeUntil,
  timer,
} from 'rxjs'

import { ConflictResolution } from '../conflict-resolution.js'
import type { Dispatcher } from '../dispatcher.js'
import type { HandlersMap } from '../handlers-map.js'

import { AnchorRequestStore } from '../store/anchor-request-store.js'
import { PinStore } from '../store/pin-store.js'
import { Utils } from '../utils.js'

import type { ExecutionQueue } from './execution-queue.js'
import { RunningState } from './running-state.js'
import type { StateCache } from './state-cache.js'
import { StreamLoader } from '../stream-loading/stream-loader.js'
import { StreamUpdater } from '../stream-loading/stream-updater.js'

const APPLY_ANCHOR_COMMIT_ATTEMPTS = 3
const CACHE_HIT_LOCAL = 'cache_hit_local'
const CACHE_HIT_MEMORY = 'cache_hit_memory'
const CACHE_HIT_REMOTE = 'cache_hit_remote'
const ANCHOR_POLL_COUNT = 'anchor_poll_count'
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE, syncTimeoutSeconds: 3 }
const STREAM_SYNC = 'stream_sync'

export type RepositoryInternalsParams = {
  anchorRequestStore: AnchorRequestStore
  anchorService: AnchorService
  conflictResolution: ConflictResolution
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
  #conflictResolution: ConflictResolution
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

  /**
   * Keeps track of every pinned StreamID that has had its state 'synced' (i.e. a query was sent to
   * pubsub requesting the current tip for that stream) since the start of this process. This set
   * only grows over time, in line with how many pinned streams get queried.
   * @private
   */
  #syncedPinnedStreams: Set<string> = new Set()

  #numPendingAnchorSubscriptions = 0

  constructor(params: RepositoryInternalsParams) {
    this.#anchorRequestStore = params.anchorRequestStore
    this.#anchorService = params.anchorService
    this.#conflictResolution = params.conflictResolution
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

  // From Repository, injected in StateManager
  async fromStreamStateStore(streamId: StreamID): Promise<RunningState | undefined> {
    const streamState = await this.#pinStore.stateStore.load(streamId)
    if (streamState) {
      Metrics.count(CACHE_HIT_LOCAL, 1)
      const runningState = new RunningState(streamState, true)
      this.add(runningState)
      const storedRequest = await this.#anchorRequestStore.load(streamId)
      if (storedRequest !== null && this.#anchorService) {
        this.confirmAnchorResponse(runningState, storedRequest.cid)
      }
      return runningState
    } else {
      return undefined
    }
  }
  /**
   * Returns a stream from wherever we can get information about it.
   * Starts by checking if the stream state is present in the in-memory cache, if not then
   * checks the state store, and finally loads the stream from pubsub.
   */
  async load(streamId: StreamID, options: LoadOpts & InternalOpts = {}): Promise<RunningState> {
    const opts = { ...DEFAULT_LOAD_OPTS, ...options }

    const [state$, synced] = await this.#loadingQ.forStream(streamId).run(async () => {
      const [existingState$, alreadySynced] = await this._fromMemoryOrStoreWithSyncStatus(streamId)

      switch (opts.sync) {
        case SyncOptions.PREFER_CACHE:
        case SyncOptions.SYNC_ON_ERROR: {
          if (!existingState$) {
            return [await this._loadStreamFromNetwork(streamId, opts.syncTimeoutSeconds), true]
          }

          if (alreadySynced) {
            return [existingState$, alreadySynced]
          } else {
            await this._sync(existingState$, opts.syncTimeoutSeconds)
            return [existingState$, true]
          }
        }
        case SyncOptions.NEVER_SYNC: {
          if (existingState$) {
            return [existingState$, alreadySynced]
          }
          // TODO(CDB-2761): Throw an error if stream isn't found in cache or state store.
          return [await this._genesisFromNetwork(streamId), false]
        }
        case SyncOptions.SYNC_ALWAYS: {
          // TODO: Restore optimization to sync alongside applying existing tip
          // When SYNC_ALWAYS is provided, we want to reapply and re-validate
          // the stream state.  We effectively throw out our locally stored state
          // as it's possible that the commits that were used to construct that
          // state are no longer valid (for example if the CACAOs used to author them
          // have expired since they were first applied to the cached state object).
          let resyncedState = await this.#streamLoader.loadStream(streamId, opts.syncTimeoutSeconds)
          Metrics.count(STREAM_SYNC, 1)
          // If we were the only node on the network that knew about the most recent tip, we don't
          // want to totally forget about that, so apply the previously known about tip so that
          // it can still be considered alongside whatever tip we learn about from the network.
          if (existingState$) {
            resyncedState = await this.#streamUpdater.applyTipFromNetwork(
              resyncedState,
              existingState$.tip
            )
          }
          const newState$ = new RunningState(resyncedState, false)
          this.add(newState$)
          return [newState$, true]
        }
        default:
          throw new UnreachableCaseError(opts.sync, 'Invalid sync option')
      }
    })

    if (!opts.skipCacaoExpirationChecks) {
      StreamUtils.checkForCacaoExpiration(state$.state)
    }

    await this._updateStateIfPinned(state$)
    if (synced && state$.isPinned) {
      this.markPinnedAndSynced(state$.id)
    }

    return state$
  }

  /**
   * Helper function for loading the state for a stream from either the in-memory cache
   * or the state store, while also returning information about whether or not the state needs
   * to be synced.
   * WARNING: This should only be called from within a thread in the loadingQ!!!
   *
   * @param streamId
   * @returns a tuple whose first element is the state that was loaded, and whose second element
   *   is a boolean representing whether we believe that state should be the most update-to-date
   *   state for that stream, or whether it could be behind the current tip and needs to be synced.
   */
  async _fromMemoryOrStoreWithSyncStatus(
    streamId: StreamID
  ): Promise<[RunningState | null, boolean]> {
    let stream = this._fromMemory(streamId)
    if (stream) {
      return [stream, true]
    }

    stream = await this.fromStreamStateStore(streamId)
    if (stream) {
      return [stream, this.wasPinnedStreamSynced(streamId)]
    }
    return [null, false]
  }

  _fromMemory(streamId: StreamID): RunningState | undefined {
    const state = this.#inmemory.get(streamId.toString())
    if (state) {
      Metrics.count(CACHE_HIT_MEMORY, 1)
    }
    return state
  }

  async _genesisFromNetwork(streamId: StreamID): Promise<RunningState> {
    const state = await this.#streamLoader.loadGenesisState(streamId)
    Metrics.count(CACHE_HIT_REMOTE, 1)

    const state$ = new RunningState(state, false)
    this.add(state$)
    this.#logger.verbose(`Genesis commit for stream ${streamId.toString()} successfully loaded`)
    return state$
  }

  /**
   * Return a stream, either from cache or re-constructed from state store, but will not load from the network.
   * Adds the stream to cache.
   */
  async fromMemoryOrStore(streamId: StreamID): Promise<RunningState | undefined> {
    const fromMemory = this._fromMemory(streamId)
    if (fromMemory) return fromMemory
    return this.fromStreamStateStore(streamId)
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

  // From StateManager, called by Repository

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

  /**
   * Takes a stream state that might not contain the complete log (and might in fact contain only the
   * genesis commit) and kicks off the process to load and apply the most recent Tip to it.
   *
   * @param state$ - Current stream state.
   * @param syncTimeoutSeconds - How much time do we wait for a response from the network.
   */
  async _sync(state$: RunningState, syncTimeoutSeconds: number): Promise<void> {
    const syncedState = await this.#streamLoader.syncStream(state$.state, syncTimeoutSeconds)
    state$.next(syncedState)
    Metrics.count(STREAM_SYNC, 1)
  }

  /**
   * Loads a stream that the node has never seen before from the network for the first time.
   *
   * @param streamId
   * @param syncTimeoutSeconds - How much time do we wait for a response from the network.
   */
  async _loadStreamFromNetwork(
    streamId: StreamID,
    syncTimeoutSeconds: number
  ): Promise<RunningState> {
    const state = await this.#streamLoader.loadStream(streamId, syncTimeoutSeconds)
    Metrics.count(STREAM_SYNC, 1)
    const newState$ = new RunningState(state, false)
    this.add(newState$)
    return newState$
  }

  publishTip(state$: RunningState): void {
    this.#dispatcher.publishTip(state$.id, state$.tip, state$.state.metadata.model)
  }

  /**
   * Applies the given tip CID as a new commit to the given running state.
   * @param state$ - State to apply tip to
   * @param cid - tip CID
   * @param opts - options that control the behavior when applying the commit
   * @returns boolean - whether or not the tip was actually applied
   */
  async handleTip(state$: RunningState, cid: CID, opts: InternalOpts = {}): Promise<boolean> {
    // by default swallow and log errors applying commits
    opts.throwOnInvalidCommit = opts.throwOnInvalidCommit ?? false
    this.#logger.verbose(`Learned of new tip ${cid} for stream ${state$.id}`)
    const next = await this.#conflictResolution.applyTip(state$.value, cid, opts)
    if (next) {
      state$.next(next)
      this.#logger.verbose(`Stream ${state$.id} successfully updated to tip ${cid}`)
      await this._updateStateIfPinned(state$)
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

  markPinnedAndSynced(streamId: StreamID): void {
    this.#syncedPinnedStreams.add(streamId.toString())
  }

  markUnpinned(streamId: StreamID): void {
    this.#syncedPinnedStreams.delete(streamId.toString())
  }

  /**
   * Returns whether the given StreamID corresponds to a pinned stream that has been synced at least
   * once during the lifetime of this process. As long as it's been synced once, it's guaranteed to
   * be up to date since we keep streams in the state store up to date when we hear pubsub messages
   * about updates to them.
   * @param streamId
   */
  wasPinnedStreamSynced(streamId: StreamID): boolean {
    return this.#syncedPinnedStreams.has(streamId.toString())
  }
}
