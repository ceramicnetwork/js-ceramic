import { CASResponse, AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import {
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
import { LocalIndexApi } from '../indexing/local-index-api.js'
import { AnchorRequestStore } from '../store/anchor-request-store.js'
import { PinStore } from '../store/pin-store.js'
import { Utils } from '../utils.js'

import type { ExecutionQueue } from './execution-queue.js'
import { RunningState } from './running-state.js'
import type { StateCache } from './state-cache.js'

// TODO: extract Repository methods called by StateManager + StateManager methods used by Repository
// New relations:
// - Repository can call RepositoryInternals and StateManager methods
// - StateManager can call RepositoryInternals methods but NO ACCESS to Repository methods
// - RepositoryInternals has NO ACCESS to Repository and StateManager methods
// Logic flow:
// - Repository instantiates RepositoryInternals
// - Repository instantiates StateManager, injects RepositoryInternals
// - Repository proxies needed methods to RepositoryInternals

const APPLY_ANCHOR_COMMIT_ATTEMPTS = 3
const CACHE_HIT_LOCAL = 'cache_hit_local'
const CACHE_HIT_MEMORY = 'cache_hit_memory'
const CACHE_HIT_REMOTE = 'cache_hit_remote'
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
  /**
   * Keeps track of every pinned StreamID that has had its state 'synced' (i.e. a query was sent to
   * pubsub requesting the current tip for that stream) since the start of this process. This set
   * only grows over time, in line with how many pinned streams get queried.
   * @private
   */
  #syncedPinnedStreams: Set<string> = new Set()

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
      switch (opts.sync) {
        case SyncOptions.PREFER_CACHE:
        case SyncOptions.SYNC_ON_ERROR: {
          const [streamState$, alreadySynced] = await this._loadGenesis(streamId)
          if (alreadySynced) {
            return [streamState$, alreadySynced]
          } else {
            await this.sync(streamState$, opts.syncTimeoutSeconds * 1000)
            Metrics.count(STREAM_SYNC, 1)
            return [streamState$, true]
          }
        }
        case SyncOptions.NEVER_SYNC: {
          return this._loadGenesis(streamId)
        }
        case SyncOptions.SYNC_ALWAYS: {
          // When SYNC_ALWAYS is provided, we want to reapply and re-validate
          // the stream state.  We effectively throw out our locally stored state
          // as its possible that the commits that were used to construct that
          // state are no longer valid (for example if the CACAOs used to author them
          // have expired since they were first applied to the cached state object).
          // But if we were the only node on the network that knew about the most
          // recent tip, we don't want to totally forget about that, so we pass the tip in
          // to `sync` so that it gets considered alongside whatever tip we learn
          // about from the network.
          const [fromNetwork$, fromMemoryOrStore] = await Promise.all([
            this._fromNetwork(streamId),
            this.fromMemoryOrStore(streamId),
          ])
          await this.sync(fromNetwork$, opts.syncTimeoutSeconds * 1000, fromMemoryOrStore?.tip)
          Metrics.count(STREAM_SYNC, 1)
          return [fromNetwork$, true]
        }
        default:
          throw new UnreachableCaseError(opts.sync, 'Invalid sync option')
      }
    })

    if (!opts.skipCacaoExpirationChecks) {
      StreamUtils.checkForCacaoExpiration(state$.state)
    }

    if (synced && state$.isPinned) {
      this.markPinnedAndSynced(state$.id)
    }

    return state$
  }

  /**
   * Helper function for loading at least the genesis commit state for a stream.
   * WARNING: This should only be called from within a thread in the loadingQ!!!
   *
   * @param streamId
   * @returns a tuple whose first element is the state that was loaded, and whose second element
   *   is a boolean representing whether we believe that state should be the most update-to-date
   *   state for that stream, or whether it could be behind the current tip and needs to be synced.
   */
  async _loadGenesis(streamId: StreamID): Promise<[RunningState, boolean]> {
    let stream = this._fromMemory(streamId)
    if (stream) {
      return [stream, true]
    }

    stream = await this.fromStreamStateStore(streamId)
    if (stream) {
      return [stream, this.wasPinnedStreamSynced(streamId)]
    }

    stream = await this._fromNetwork(streamId)
    return [stream, false]
  }

  _fromMemory(streamId: StreamID): RunningState | undefined {
    const state = this.#inmemory.get(streamId.toString())
    if (state) {
      Metrics.count(CACHE_HIT_MEMORY, 1)
    }
    return state
  }

  async _fromNetwork(streamId: StreamID): Promise<RunningState> {
    const handler = this.#handlers.get(streamId.typeName)
    const genesisCid = streamId.cid
    const commitData = await Utils.getCommitData(this.#dispatcher, genesisCid, streamId)
    if (commitData == null) {
      throw new Error(`No genesis commit found with CID ${genesisCid.toString()}`)
    }
    Metrics.count(CACHE_HIT_REMOTE, 1)
    // Do not check for possible key revocation here, as we will do so later after loading the tip
    // (or learning that the genesis commit *is* the current tip), when we will have timestamp
    // information for when the genesis commit was anchored.
    commitData.disableTimecheck = true
    const state = await handler.applyCommit(commitData, this.#context)
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

  processAnchorResponse(
    state$: RunningState,
    anchorStatus$: Observable<CASResponse>
  ): Subscription {
    const stopSignal = new Subject<void>()
    const subscription = anchorStatus$
      .pipe(
        takeUntil(stopSignal),
        concatMap(async (asr) => {
          // We don't want to change a stream's state due to changes to the anchor
          // status of a commit that is no longer the tip of the stream, so we early return
          // in most cases when receiving a response to an old anchor request.
          // The one exception is if the CASResponse indicates that the old commit
          // is now anchored, in which case we still want to try to process the anchor commit
          // and let the stream's conflict resolution mechanism decide whether or not to update
          // the stream's state.
          const status = asr.status
          switch (status) {
            case AnchorRequestStatusName.READY:
            case AnchorRequestStatusName.PENDING: {
              if (!asr.cid.equals(state$.tip)) return
              const next = {
                ...state$.value,
                anchorStatus: AnchorStatus.PENDING,
              }
              state$.next(next)
              await this._updateStateIfPinned(state$)
              return
            }
            case AnchorRequestStatusName.PROCESSING: {
              if (!asr.cid.equals(state$.tip)) return
              state$.next({ ...state$.value, anchorStatus: AnchorStatus.PROCESSING })
              await this._updateStateIfPinned(state$)
              return
            }
            case AnchorRequestStatusName.COMPLETED: {
              if (asr.cid.equals(state$.tip)) {
                await this.#anchorRequestStore.remove(state$.id)
              }

              await this._handleAnchorCommit(state$, asr.cid, asr.anchorCommit.cid, asr.witnessCar)

              stopSignal.next()
              return
            }
            case AnchorRequestStatusName.FAILED: {
              this.#logger.warn(
                `Anchor failed for commit ${asr.cid} of stream ${asr.streamId}: ${asr.message}`
              )

              // if this is the anchor response for the tip update the state
              if (asr.cid.equals(state$.tip)) {
                state$.next({ ...state$.value, anchorStatus: AnchorStatus.FAILED })
                await this.#anchorRequestStore.remove(state$.id)
              }
              // we stop the polling as this is a terminal state
              stopSignal.next()
              return
            }
            case AnchorRequestStatusName.REPLACED: {
              this.#logger.verbose(
                `Anchor request for commit ${asr.cid} of stream ${asr.streamId} is replaced`
              )

              // If this is the tip and the node received a REPLACED response for it the node has gotten into a weird state.
              // Hopefully this should resolve through updates that will be received shortly or through syncing the stream.
              if (asr.cid.equals(state$.tip)) {
                await this.#anchorRequestStore.remove(state$.id)
              }

              stopSignal.next()
              return
            }
            default:
              throw new UnreachableCaseError(status, 'Unknown anchoring state')
          }
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
      .subscribe()
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
   * @param anchorCommit - cid of the anchor commit
   * @param witnessCAR - CAR file with all the IPLD objects needed to apply and verify the anchor commit
   * @private
   */
  async _handleAnchorCommit(
    state$: RunningState,
    tip: CID,
    anchorCommit: CID,
    witnessCAR: CAR | undefined
  ): Promise<void> {
    for (
      let remainingRetries = APPLY_ANCHOR_COMMIT_ATTEMPTS - 1;
      remainingRetries >= 0;
      remainingRetries--
    ) {
      try {
        if (witnessCAR) {
          await this.#dispatcher.importCAR(witnessCAR)
        }

        await this.#executionQ.forStream(state$.id).run(async () => {
          const applied = await this.handleTip(state$, anchorCommit)
          if (applied) {
            // We hadn't already heard about the AnchorCommit via pubsub, so it's possible
            // other nodes didn't hear about it via pubsub either, so we rebroadcast it to pubsub now.
            this.publishTip(state$)

            if (remainingRetries < APPLY_ANCHOR_COMMIT_ATTEMPTS - 1) {
              // If we failed to apply the commit at least once, then it's worth logging when
              // we are able to do so successfully on the retry.
              this.#logger.imp(
                `Successfully applied anchor commit ${anchorCommit} for stream ${state$.id}`
              )
            }
          }
        })
        return
      } catch (error) {
        this.#logger.warn(
          `Error while applying anchor commit ${anchorCommit} for stream ${state$.id}, ${remainingRetries} retries remain. ${error}`
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
   * @param timeoutMillis - How much time do we wait for a response from the network.
   * @param hint - Tip to try while we are waiting for the network to respond.
   */
  async sync(state$: RunningState, timeoutMillis: number, hint?: CID): Promise<void> {
    // Begin querying the network for the tip immediately.
    const tip$ = this.#dispatcher.messageBus.queryNetwork(state$.id)
    // If a 'hint' is provided we can work on applying it while the tip is
    // fetched from the network
    const tipSource$ = hint ? merge(tip$, of(hint)) : tip$
    // We do not expect this promise to return anything, so set `defaultValue` to `undefined`
    await lastValueFrom(
      tipSource$.pipe(
        takeUntil(timer(timeoutMillis)),
        concatMap((tip) => this.handleTip(state$, tip))
      ),
      { defaultValue: undefined }
    )
    if (state$.isPinned) {
      this.markPinnedAndSynced(state$.id)
    }
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
