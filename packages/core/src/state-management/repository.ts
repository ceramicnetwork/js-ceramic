import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import {
  AnchorEvent,
  AnchorOpts,
  AnchorStatus,
  CommitType,
  Context,
  CreateOpts,
  DiagnosticsLogger,
  LoadOpts,
  PinningOpts,
  PublishOpts,
  StreamState,
  StreamUtils,
  SyncOptions,
  UnreachableCaseError,
  UpdateOpts,
} from '@ceramicnetwork/common'
import type { LocalIndexApi } from '@ceramicnetwork/indexing'
import { PinStore } from '../store/pin-store.js'
import { ExecutionQueue } from './execution-queue.js'
import { RunningState } from './running-state.js'
import type { Dispatcher } from '../dispatcher.js'
import type { HandlersMap } from '../handlers-map.js'
import { distinct, map, Observable } from 'rxjs'
import { StateCache } from './state-cache.js'
import { SnapshotState } from './snapshot-state.js'
import { IKVStore } from '../store/ikv-store.js'
import { AnchorRequestStore } from '../store/anchor-request-store.js'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import { StreamLoader } from '../stream-loading/stream-loader.js'
import { OperationType } from './operation-type.js'
import { StreamUpdater } from '../stream-loading/stream-updater.js'
import { CID } from 'multiformats/cid'
import type { AnchorLoopHandler, AnchorService } from '../anchor/anchor-service.js'
import type { AnchorRequestCarBuilder } from '../anchor/anchor-request-car-builder.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { CAR } from 'cartonne'
import { FeedDocument, type Feed } from '../feed.js'

const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE, syncTimeoutSeconds: 3 }
const APPLY_ANCHOR_COMMIT_ATTEMPTS = 3

const CACHE_EVICTED_MEMORY = 'cache_eviction_memory'
const CACHE_HIT_LOCAL = 'cache_hit_local'
const CACHE_HIT_MEMORY = 'cache_hit_memory'
const CACHE_HIT_REMOTE = 'cache_hit_remote'
const STREAM_SYNC = 'stream_sync'

export type RepositoryDependencies = {
  dispatcher: Dispatcher
  pinStore: PinStore
  keyValueStore: IKVStore
  anchorRequestStore: AnchorRequestStore
  context: Context
  handlers: HandlersMap
  anchorService: AnchorService
  indexing: LocalIndexApi
  streamLoader: StreamLoader
  streamUpdater: StreamUpdater
  anchorRequestCarBuilder: AnchorRequestCarBuilder
}

/**
 * Indicate if the stream should be indexed.
 */
function shouldIndex(state$: RunningState, index: LocalIndexApi): boolean {
  const model = state$.state?.metadata?.model
  if (!model) return false
  return index.shouldIndexStream(model)
}

function commitAtTime(state: StreamState, timestamp: number): CommitID {
  let commitCid: CID = state.log[0].cid
  for (const entry of state.log) {
    if (entry.type === CommitType.ANCHOR) {
      if (entry.timestamp <= timestamp) {
        commitCid = entry.cid
      } else {
        break
      }
    }
  }
  return CommitID.make(StreamUtils.streamIdFromState(state), commitCid)
}

/**
 * Whether a stream has been synced with the network (ie we've queried the network for the tip).
 * ALREADY_SYNCED means it was synced at some point in the past before the current load operation.
 * DID_SYNC means it was just synced as part of processing the current load operation.
 */
enum SyncStatus {
  NOT_SYNCED,
  ALREADY_SYNCED,
  DID_SYNC,
}

export class Repository {
  /**
   * Serialize loading operations per streamId.
   * All writes to the 'inmemory' cache must happen within the context of this queue.
   */
  readonly loadingQ: ExecutionQueue

  /**
   * Serialize operations on state per streamId.
   * All writes to the StateStore must happen within the context of this queue.
   */
  readonly executionQ: ExecutionQueue

  /**
   * In-memory cache of the currently running streams.
   */
  readonly inmemory: StateCache<RunningState>

  private readonly feed: Feed

  /**
   * Various dependencies.
   */
  #deps: RepositoryDependencies

  /**
   * Keeps track of every pinned StreamID that has had its state 'synced' (i.e. a query was sent to
   * pubsub requesting the current tip for that stream) since the start of this process. This set
   * only grows over time, in line with how many pinned streams get queried.
   * @private
   */
  #syncedPinnedStreams: Set<string> = new Set()

  #numPendingAnchorSubscriptions = 0

  /**
   * @param cacheLimit - Maximum number of streams to store in memory cache.
   * @param logger - Where we put diagnostics messages.
   * @param concurrencyLimit - Maximum number of concurrently running tasks on the streams.
   * @param feed - Feed to push StreamStates to.
   */
  constructor(
    cacheLimit: number,
    concurrencyLimit: number,
    feed: Feed,
    private readonly logger: DiagnosticsLogger
  ) {
    this.loadingQ = new ExecutionQueue('loading', concurrencyLimit, logger)
    this.executionQ = new ExecutionQueue('execution', concurrencyLimit, logger)
    this.feed = feed
    this.inmemory = new StateCache(cacheLimit, (state$) => {
      if (state$.subscriptionSet.size > 0) {
        logger.debug(`Stream ${state$.id} evicted from cache while having subscriptions`)
      }
      Metrics.count(CACHE_EVICTED_MEMORY, 1)
      state$.complete()
    })
    this.updates$ = this.updates$.bind(this)
  }

  /**
   * Sets the StateStore to use.
   * This must be called before init().
   * @param stateStore
   */
  async injectKeyValueStore(stateStore: IKVStore): Promise<void> {
    this.setDeps({
      ...this.#deps,
      keyValueStore: stateStore,
    })
  }

  async init(): Promise<void> {
    await this.#deps.keyValueStore.init()
    await this.pinStore.open(this.#deps.keyValueStore)
    await this.anchorRequestStore.open(this.#deps.keyValueStore) // Initialization hell
    await this.index.init()
  }

  get pinStore(): PinStore {
    return this.#deps.pinStore
  }

  private get streamLoader(): StreamLoader {
    return this.#deps.streamLoader
  }

  private get streamUpdater(): StreamUpdater {
    return this.#deps.streamUpdater
  }

  /**
   * Returns the number of streams with writes that are waiting to be anchored by the CAS.
   */
  get numPendingAnchors(): number {
    return this.#numPendingAnchorSubscriptions
  }

  private get anchorService(): AnchorService {
    return this.#deps.anchorService
  }

  private get dispatcher(): Dispatcher {
    return this.#deps.dispatcher
  }

  get anchorRequestStore(): AnchorRequestStore {
    return this.#deps.anchorRequestStore
  }

  get index(): LocalIndexApi {
    return this.#deps.indexing
  }

  // Ideally this would be provided in the constructor, but circular dependencies in our initialization process make this necessary for now
  setDeps(deps: RepositoryDependencies): void {
    this.#deps = deps
  }

  /**
   * Returns a stream from wherever we can get information about it.
   * Starts by checking if the stream state is present in the in-memory cache, if not then
   * checks the state store, and finally loads the stream from pubsub.
   */
  async load(
    streamId: StreamID,
    loadOptions: LoadOpts = {},
    checkCacaoExpiration = true
  ): Promise<RunningState> {
    const opts = { ...DEFAULT_LOAD_OPTS, ...loadOptions }

    const [state$, syncStatus] = await this.loadingQ.forStream(streamId).run(async () => {
      const [existingState$, alreadySynced] = await this._fromMemoryOrStoreWithSyncStatus(streamId)

      switch (opts.sync) {
        case SyncOptions.PREFER_CACHE:
        case SyncOptions.SYNC_ON_ERROR: {
          if (!existingState$) {
            return [
              await this._loadStreamFromNetwork(streamId, opts.syncTimeoutSeconds),
              SyncStatus.DID_SYNC,
            ]
          }

          if (alreadySynced == SyncStatus.ALREADY_SYNCED) {
            return [existingState$, SyncStatus.ALREADY_SYNCED]
          } else {
            await this._sync(existingState$, opts.syncTimeoutSeconds)
            return [existingState$, SyncStatus.DID_SYNC]
          }
        }
        case SyncOptions.NEVER_SYNC: {
          if (existingState$) {
            return [existingState$, alreadySynced]
          }
          // TODO(CDB-2761): Throw an error if stream isn't found in cache or state store.
          return [await this._genesisFromNetwork(streamId), SyncStatus.NOT_SYNCED]
        }
        case SyncOptions.SYNC_ALWAYS: {
          return [
            await this._resyncStreamFromNetwork(streamId, opts.syncTimeoutSeconds, existingState$),
            SyncStatus.DID_SYNC,
          ]
        }
        default:
          throw new UnreachableCaseError(opts.sync, 'Invalid sync option')
      }
    })

    if (checkCacaoExpiration) {
      StreamUtils.checkForCacaoExpiration(state$.state)
    }

    if (syncStatus != SyncStatus.ALREADY_SYNCED) {
      // Only update the pinned state if we actually did anything that might change it. If we just
      // loaded from the cache and didn't even query the network, there's no reason to bother
      // writing to the state store and index, since nothing could have changed.
      await this._updateStateIfPinned_safe(state$)
      if (syncStatus == SyncStatus.DID_SYNC && state$.isPinned) {
        this.markPinnedAndSynced(state$.id)
      }
    }
    return state$
  }

  /**
   * Helper for updating the state from within the ExecutionQueue, which protects all updates
   * to the state store.
   */
  private async _updateStateIfPinned_safe(state$: RunningState): Promise<void> {
    return this.executionQ.forStream(state$.id).run(() => {
      return this._updateStateIfPinned(state$)
    })
  }

  /**
   * Must be called from within the ExecutionQueue to be safe.
   */
  private async _updateStateIfPinned(state$: RunningState): Promise<void> {
    const isPinned = Boolean(await this.pinStore.stateStore.load(state$.id))
    // TODO (NET-1687): unify shouldIndex check into indexStreamIfNeeded
    const shouldIndex =
      state$.state.metadata.model && this.index.shouldIndexStream(state$.state.metadata.model)
    if (isPinned || shouldIndex) {
      await this.pinStore.add(state$)
    }
    await this._indexStreamIfNeeded(state$)
  }

  private _fromMemory(streamId: StreamID): RunningState | undefined {
    const state = this.inmemory.get(streamId.toString())
    if (state) {
      Metrics.count(CACHE_HIT_MEMORY, 1)
    }
    return state
  }

  private async _fromStreamStateStore(streamId: StreamID): Promise<RunningState | undefined> {
    const streamState = await this.pinStore.stateStore.load(streamId)
    if (streamState) {
      Metrics.count(CACHE_HIT_LOCAL, 1)
      const runningState = new RunningState(streamState, true)
      this._registerRunningState(runningState)
      return runningState
    } else {
      return undefined
    }
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
  private async _fromMemoryOrStoreWithSyncStatus(
    streamId: StreamID
  ): Promise<[RunningState | null, SyncStatus]> {
    let stream = this._fromMemory(streamId)
    if (stream) {
      // TODO(CAT-2818): A stream being in the cache doesn't necessarily mean it was synced
      return [stream, SyncStatus.ALREADY_SYNCED]
    }

    stream = await this._fromStreamStateStore(streamId)
    if (stream) {
      return [
        stream,
        this._wasPinnedStreamSynced(streamId) ? SyncStatus.ALREADY_SYNCED : SyncStatus.NOT_SYNCED,
      ]
    }
    return [null, SyncStatus.NOT_SYNCED]
  }

  /**
   * Loads a stream that the node has never seen before from the network for the first time.
   *
   * @param streamId
   * @param syncTimeoutSeconds - How much time do we wait for a response from the network.
   */
  private async _loadStreamFromNetwork(
    streamId: StreamID,
    syncTimeoutSeconds: number
  ): Promise<RunningState> {
    const state = await this.streamLoader.loadStream(streamId, syncTimeoutSeconds)
    Metrics.count(STREAM_SYNC, 1)
    const newState$ = new RunningState(state, false)
    this._registerRunningState(newState$)
    return newState$
  }

  private async _genesisFromNetwork(streamId: StreamID): Promise<RunningState> {
    const state = await this.streamLoader.loadGenesisState(streamId)
    Metrics.count(CACHE_HIT_REMOTE, 1)

    const state$ = new RunningState(state, false)
    this._registerRunningState(state$)
    this.logger.verbose(`Genesis commit for stream ${streamId.toString()} successfully loaded`)
    return state$
  }

  /**
   * Takes a stream state that might not contain the complete log (and might in fact contain only the
   * genesis commit) and kicks off the process to load and apply the most recent Tip to it.
   *
   * @param state$ - Current stream state.
   * @param syncTimeoutSeconds - How much time do we wait for a response from the network.
   */
  private async _sync(state$: RunningState, syncTimeoutSeconds: number): Promise<void> {
    const syncedState = await this.streamLoader.syncStream(state$.state, syncTimeoutSeconds)
    state$.next(syncedState)
    Metrics.count(STREAM_SYNC, 1)
  }

  /**
   * When SYNC_ALWAYS is provided, we want to reapply and re-validate
   * the stream state.  We effectively throw out our locally stored state
   * as it's possible that the commits that were used to construct that
   * state are no longer valid (for example if the CACAOs used to author them
   * have expired since they were first applied to the cached state object).
   * But if we were the only node on the network that knew about the most recent tip,
   * we don't want to totally forget about that, so we make sure to apply the previously
   * known about tip so that it can still be considered alongside whatever tip we learn
   * about from the network.
   * @param streamId
   * @param syncTimeoutSeconds
   * @param existingState$
   */
  private async _resyncStreamFromNetwork(
    streamId: StreamID,
    syncTimeoutSeconds: number,
    existingState$: RunningState | null
  ): Promise<RunningState> {
    const resyncedState = existingState$
      ? await this.streamLoader.resyncStream(streamId, existingState$.tip, syncTimeoutSeconds)
      : await this.streamLoader.loadStream(streamId, syncTimeoutSeconds)

    Metrics.count(STREAM_SYNC, 1)
    const newState$ = new RunningState(resyncedState, false)
    this._registerRunningState(newState$)
    return newState$
  }

  /**
   * Load the state for a stream at a specific CommitID.
   * @param commitId
   * @param opts
   */
  async loadAtCommit(commitId: CommitID, opts: LoadOpts): Promise<SnapshotState> {
    // Start by loading the current state of the stream. This might cause us to load more commits
    // for the stream than is ultimately necessary, but doing so increases the chances that we
    // detect that the CommitID specified is rejected by the conflict resolution rules due to
    // conflict with the stream's canonical branch of history.
    // We also skip CACAO expiration checking during this initial load as its possible
    // that the CommitID we are being asked to load may in fact be an anchor commit with
    // the timestamp information that will reveal to us that the CACAO didn't actually expire.
    const base$ = await this.load(commitId.baseID, opts, false)

    return this._atCommit(commitId, base$)
  }

  private async _atCommit(
    commitId: CommitID,
    existingState$: RunningState
  ): Promise<SnapshotState> {
    return this.executionQ.forStream(commitId).run(async () => {
      const stateAtCommit = await this.streamLoader.stateAtCommit(existingState$.state, commitId)

      // Since we skipped CACAO expiration checking earlier we need to make sure to do it here.
      StreamUtils.checkForCacaoExpiration(stateAtCommit)

      // If the provided CommitID is ahead of what we have in the cache, then we should update
      // the cache to include it.
      if (StreamUtils.isStateSupersetOf(stateAtCommit, existingState$.value)) {
        existingState$.next(stateAtCommit)
      }
      return new SnapshotState(stateAtCommit)
    })
  }

  /**
   * Load the state for a stream as it was at a specified wall clock time, based on the anchor
   * timestamps of AnchorCommits in the log.
   * @param streamId
   * @param opts - must contain an 'atTime' parameter
   */
  async loadAtTime(streamId: StreamID, opts: LoadOpts): Promise<SnapshotState> {
    const base$ = await this.load(streamId.baseID, opts)
    const commitId = commitAtTime(base$.state, opts.atTime)
    return this._atCommit(commitId, base$)
  }

  /**
   * Applies commit to the existing state
   *
   * @param streamId - Stream ID to update
   * @param commit - Commit data
   * @param opts - Stream initialization options (request anchor, wait, etc.)
   */
  async applyCommit(streamId: StreamID, commit: any, opts: UpdateOpts): Promise<RunningState> {
    this.logger.verbose(`Repository apply commit to stream ${streamId.toString()}`)

    const state$ = await this.load(streamId)
    this.logger.verbose(`Repository loaded state for stream ${streamId.toString()}`)

    return this.executionQ.forStream(streamId).run(async () => {
      const originalState = state$.state
      const updatedState = await this.streamUpdater.applyCommitFromUser(originalState, commit)
      if (StreamUtils.tipFromState(updatedState).equals(StreamUtils.tipFromState(originalState))) {
        return state$ // nothing changed
      }

      state$.next(updatedState) // emit the new state

      await this._updateStateIfPinned(state$)
      await this._applyWriteOpts(state$, opts, OperationType.UPDATE)
      this.logger.verbose(`Stream ${state$.id} successfully updated to tip ${state$.tip}`)

      return state$
    })
  }

  /**
   * Handles update. Update may come from the PubSub topic or from running a sync
   *
   * @param streamId
   * @param tip - Stream Tip CID
   * @param model - Model Stream ID
   */
  async handleUpdateFromNetwork(streamId: StreamID, tip: CID, model?: StreamID): Promise<void> {
    // TODO: It isn't safe to load the RunningState from the state store outside of the LoadingQueue
    // as we do here.  We risk a race condition where we can wind up with multiple RunnigStates
    // coexisting for the same Stream.  Doing this simple fix of just using the LoadingQueue here
    // risks introducing a big performance degradation. The right thing to do would be to do this
    // load in two phases, first check the cache and state store for the streamid (but without
    // creating or registering a RunningState), and then only if there actually is something in the
    // state store, then load it again but from within the LoadingQueue.  Given that pubsub is about
    // to be removed though, instead of doing that work now, we're leaving this as-is even though
    // there's a race condition here, understanding that this code will be removed very soon anyway.
    let state$ = await this.fromMemoryOrStore_UNSAFE(streamId)
    const shouldIndex = model && this.index.shouldIndexStream(model)
    if (!shouldIndex && !state$) {
      // stream isn't pinned or indexed, nothing to do
      return
    }

    if (!state$) {
      state$ = await this.load(streamId)
    }

    await this._handleTip(state$, tip)
  }

  /**
   * Applies the given tip CID as a new commit to the given running state.
   * NOTE: Must be called from inside the ExecutionQueue!
   * @param state$ - State to apply tip to
   * @param cid - tip CID
   * @returns boolean - whether or not the tip was actually applied
   */
  private async _handleTip(state$: RunningState, cid: CID): Promise<boolean> {
    return this.executionQ.forStream(state$.id).run(async () => {
      this.logger.verbose(`Learned of new tip ${cid} for stream ${state$.id}`)
      const next = await this.streamUpdater.applyTipFromNetwork(state$.state, cid)
      if (next) {
        state$.next(next)
        await this._updateStateIfPinned(state$)
        this.logger.verbose(`Stream ${state$.id} successfully updated to tip ${cid}`)
        return true
      } else {
        return false
      }
    })
  }

  /**
   * Request anchor for the latest stream state
   */
  async anchor(state$: RunningState, opts: AnchorOpts): Promise<void> {
    if (!this.anchorService) {
      throw new Error(`Anchor requested for stream ${state$.id} but anchoring is disabled`)
    }
    if (state$.value.anchorStatus == AnchorStatus.ANCHORED) {
      return
    }

    const carFile = await this.#deps.anchorRequestCarBuilder.build(state$.id, state$.tip)
    const anchorEvent = await this.anchorService.requestAnchor(carFile)
    // Don't wait on handling the anchor event, let that happen in the background.
    void this.handleAnchorEvent(state$, anchorEvent)
  }

  /**
   * Handle AnchorEvent and update state$.
   * Used in two places:
   * 1. When handling the first AnchorEvent from CAS when requesting an anchor => anchorEvent is for tip
   * 2. When handling a response from CAS => anchorEvent is for what is stored in AnchorRequestStore.
   *
   * It always stores just the most recently requested commit.
   * We assume CAS issues a REPLACED status when getting a request for a previous commit.
   *
   * @param state$ - RunningState instance to update.
   * @param anchorEvent - response from CAS.
   * @return boolean - `true` if polling should stop, i.e. we reached a terminal state, `false` if polling continues.
   */
  async handleAnchorEvent(state$: RunningState, anchorEvent: AnchorEvent): Promise<boolean> {
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
        if (!anchorEvent.cid.equals(state$.tip)) return false
        if (state$.state.anchorStatus === AnchorStatus.PENDING) return false
        const next = {
          ...state$.value,
          anchorStatus: AnchorStatus.PENDING,
        }
        state$.next(next)
        await this._updateStateIfPinned_safe(state$)
        return false
      }
      case AnchorRequestStatusName.PROCESSING: {
        if (!anchorEvent.cid.equals(state$.tip)) return false
        if (state$.state.anchorStatus === AnchorStatus.PROCESSING) return false
        state$.next({ ...state$.value, anchorStatus: AnchorStatus.PROCESSING })
        await this._updateStateIfPinned_safe(state$)
        return false
      }
      case AnchorRequestStatusName.COMPLETED: {
        await this._handleAnchorCommit(state$, anchorEvent.cid, anchorEvent.witnessCar)
        return true
      }
      case AnchorRequestStatusName.FAILED: {
        this.logger.warn(
          `Anchor failed for commit ${anchorEvent.cid} of stream ${anchorEvent.streamId}: ${anchorEvent.message}`
        )

        // if this is the anchor response for the tip update the state
        if (anchorEvent.cid.equals(state$.tip)) {
          state$.next({ ...state$.value, anchorStatus: AnchorStatus.FAILED })
          return true
        }
        return true
      }
      case AnchorRequestStatusName.REPLACED: {
        this.logger.verbose(
          `Anchor request for commit ${anchorEvent.cid} of stream ${anchorEvent.streamId} is replaced`
        )

        // If this is the tip and the node received a REPLACED response for it the node has gotten into a weird state.
        // Hopefully this should resolve through updates that will be received shortly or through syncing the stream.
        return true
      }
      default:
        throw new UnreachableCaseError(status, 'Unknown anchoring state')
    }
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
  private async _handleAnchorCommit(
    state$: RunningState,
    tip: CID,
    witnessCAR: CAR | undefined
  ): Promise<void> {
    const streamId = StreamUtils.streamIdFromState(state$.state)
    const anchorCommitCID = witnessCAR.roots[0]
    if (!anchorCommitCID) throw new Error(`No anchor commit CID as root`)

    this.logger.verbose(`Handling anchor commit for ${streamId} with CID ${anchorCommitCID}`)

    for (
      let remainingRetries = APPLY_ANCHOR_COMMIT_ATTEMPTS - 1;
      remainingRetries >= 0;
      remainingRetries--
    ) {
      try {
        if (witnessCAR) {
          await this.dispatcher.importCAR(witnessCAR)
          this.logger.verbose(`successfully imported CAR file for ${streamId}`)
        }

        const applied = await this._handleTip(state$, anchorCommitCID)
        if (applied) {
          // We hadn't already heard about the AnchorCommit via pubsub, so it's possible
          // other nodes didn't hear about it via pubsub either, so we rebroadcast it to pubsub now.
          this._publishTip(state$)

          if (remainingRetries < APPLY_ANCHOR_COMMIT_ATTEMPTS - 1) {
            // If we failed to apply the commit at least once, then it's worth logging when
            // we are able to do so successfully on the retry.
            this.logger.imp(
              `Successfully applied anchor commit ${anchorCommitCID} for stream ${
                state$.id
              } after ${APPLY_ANCHOR_COMMIT_ATTEMPTS - remainingRetries} attempts`
            )
          } else {
            this.logger.verbose(
              `Successfully applied anchor commit ${anchorCommitCID} for stream ${state$.id}`
            )
          }
        }
        return
      } catch (error) {
        this.logger.warn(
          `Error while applying anchor commit ${anchorCommitCID} for stream ${state$.id}, ${remainingRetries} retries remain. ${error}`
        )

        if (remainingRetries == 0) {
          this.logger.err(`Anchor failed for commit ${tip} of stream ${state$.id}: ${error}`)

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
   * Apply options relating to authoring a new commit.
   *
   * Must be called within the ExecutionQueue to be safe.
   *
   * @param state$ - Running State
   * @param opts - Initialization options (request anchor, publish to pubsub, etc.)
   * @param opType - If we load, create or update a stream
   * @private
   */
  private async _applyWriteOpts(
    state$: RunningState,
    opts: CreateOpts | UpdateOpts,
    opType: OperationType
  ) {
    const anchor = opts.anchor
    const publish = opts.publish
    if (anchor) {
      await this.anchor(state$, opts)
    }
    if (publish && opType !== OperationType.LOAD) {
      this._publishTip(state$)
    }

    await this._handlePinOpts(state$, opts as PinningOpts, opType)
  }

  private _publishTip(state$: RunningState): void {
    this.dispatcher.publishTip(state$.id, state$.tip, state$.state.metadata.model)
  }

  /**
   * Applies the given PinningOpts that the user provided to pin or unpin the stream.
   * Unpinning streams isn't allowed through the CRUD API, so if unpin is false this will
   * generally throw an Error.  The one exception is for creates.  When creating a brand
   * new stream it is okay to set that stream to not be pinned. To unpin an existing stream
   * one must use the AdminAPI.
   * @param state$
   * @param opts
   * @param opType - what type of operation is being performed
   */
  private async _handlePinOpts(
    state$: RunningState,
    opts: PinningOpts,
    opType: OperationType
  ): Promise<void> {
    if (opts.pin !== undefined && opType !== OperationType.CREATE) {
      const pinStr = opts.pin ? 'pin' : 'unpin'
      const opStr = opType == OperationType.UPDATE ? 'update' : 'load'
      //TODO(CDB-2314): An error should be thrown once fully deprecated
      this.logger.warn(
        `Cannot pin or unpin streams through the CRUD APIs. To change stream pin state use the admin.pin API with an authenticated admin DID. Attempting to ${pinStr} stream ${StreamUtils.streamIdFromState(
          state$.state
        ).toString()} as part of a ${opStr} operation`
      )
      return
    }

    if (
      opts.pin ||
      (opts.pin === undefined && shouldIndex(state$, this.index)) ||
      (opts.pin === undefined && opType == OperationType.CREATE)
    ) {
      await this._pin_UNSAFE(state$)
    } else if (opts.pin === false) {
      await this.unpin(state$)
    }
  }

  /**
   * Handles new stream creation by loading genesis commit into memory and then handling the given
   * CreateOpts for the genesis commit.
   * @param streamId
   * @param opts
   */
  async applyCreateOpts(streamId: StreamID, opts: CreateOpts): Promise<RunningState> {
    const state = await this.load(streamId, opts)

    // Create operations can actually be load operations when using deterministic streams, so we
    // ensure that the stream only has a single commit in its log to properly consider it a create.
    const opType = state.state.log.length == 1 ? OperationType.CREATE : OperationType.LOAD

    return this.executionQ.forStream(streamId).run(async () => {
      await this._applyWriteOpts(state, opts, opType)
      return state
    })
  }

  /**
   * Return a stream, either from cache or re-constructed from state store, but will not load from the network.
   * Adds the stream to cache.
   * Must be called from within the LoadingQueue (or else there's a race condition where it can
   * override the RunningState from the cache).
   */
  async fromMemoryOrStore(streamId: StreamID): Promise<RunningState | undefined> {
    return this.loadingQ.forStream(streamId).run(() => {
      return this.fromMemoryOrStore_UNSAFE(streamId)
    })
  }

  /**
   * Return a stream, either from cache or re-constructed from state store, but will not load from the network.
   * Adds the stream to cache.
   * "unsafe" because calling this outside of the LoadingQueue might create a duplicate instance of
   * RunningState for the same StreamId. Must be called from inside the LoadingQueue to be used safely.
   */
  async fromMemoryOrStore_UNSAFE(streamId: StreamID): Promise<RunningState | undefined> {
    const fromMemory = this._fromMemory(streamId)
    if (fromMemory) return fromMemory
    return this._fromStreamStateStore(streamId)
  }

  /**
   * Return a stream state, either from cache or from state store. Bypasses the stream cache
   * and loading queue, use with caution.
   */
  async streamState(streamId: StreamID): Promise<StreamState | undefined> {
    const fromMemory = this.inmemory.get(streamId.toString())
    if (fromMemory) {
      return fromMemory.state
    } else {
      return this.#deps.pinStore.stateStore.load(streamId)
    }
  }

  /**
   * Adds the stream's RunningState to the in-memory cache and subscribes the Repository's global feed$ to receive changes emitted by that RunningState
   */
  private _registerRunningState(state$: RunningState): void {
    state$
      .pipe(
        distinct((s) => s.log[s.log.length - 1].cid.toString()), // Distinct if the tip changes
        map(FeedDocument.fromStreamState)
      )
      .subscribe(this.feed.aggregation.documents)
    this.inmemory.set(state$.id.toString(), state$)
  }

  pin(state$: RunningState, force?: boolean): Promise<void> {
    return this.executionQ.forStream(state$.id).run(async () => {
      return this._pin_UNSAFE(state$, force)
    })
  }

  /**
   * Only safe to call from within the ExecutionQueue
   */
  private async _pin_UNSAFE(state$: RunningState, force?: boolean): Promise<void> {
    return this.pinStore.add(state$, force)
  }

  async unpin(state$: RunningState, opts?: PublishOpts): Promise<void> {
    if (shouldIndex(state$, this.index)) {
      throw new Error(
        `Cannot unpin actively indexed stream (${state$.id.toString()}) with model: ${
          state$.state.metadata.model
        }`
      )
    }

    if (opts?.publish) {
      this._publishTip(state$)
    }

    this.markUnpinned(state$.id)
    return this.#deps.pinStore.rm(state$)
  }

  /**
   * List pinned streams as array of StreamID strings.
   * If `streamId` is passed, indicate if it is pinned.
   */
  async listPinned(streamId?: StreamID): Promise<string[]> {
    return this.#deps.pinStore.ls(streamId)
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
  private _wasPinnedStreamSynced(streamId: StreamID): boolean {
    return this.#syncedPinnedStreams.has(streamId.toString())
  }

  /**
   * Returns the StreamState of a random pinned stream from the state store
   */
  async randomPinnedStreamState(): Promise<StreamState | null> {
    // First get a random streamID from the state store.
    const res = await this.#deps.pinStore.stateStore.listStoredStreamIDs(null, 1)
    if (res.length == 0) {
      return null
    }
    if (res.length > 1) {
      // This should be impossible and indicates a programming error with how the state store
      // listStoredStreamIDs() call is enforcing the limit argument.
      throw new Error(
        `Expected a single streamID from the state store, but got ${res.length} streamIDs instead`
      )
    }

    const [streamID] = res
    return this.#deps.pinStore.stateStore.load(StreamID.fromString(streamID))
  }

  /**
   * Helper function to add stream to db index if it has a 'model' in its metadata.
   * @private
   */
  private async _indexStreamIfNeeded(state$: RunningState): Promise<void> {
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

    await this.index.indexStream(streamContent)
  }

  /**
   * Updates for the StreamState, even if a (pinned or not pinned) stream has already been evicted.
   * Marks the stream as durable, that is not subject to cache eviction.
   *
   * First, we try to get the running state from memory or state store. If found, it is used as a source
   * of updates. If not found, we use StreamState passed as `init` param as a future source of updates.
   * Anyway, we mark it as unevictable.
   *
   * When a subscription to the observable stops, we check if there are other subscriptions to the same
   * RunningState. We only consider the RunningState free, if there are no more subscriptions.
   * This RunningState is subject to future cache eviction.
   *
   * @param init
   */
  updates$(init: StreamState): Observable<StreamState> {
    return new Observable<StreamState>((subscriber) => {
      const id = new StreamID(init.type, init.log[0].cid)
      this.fromMemoryOrStore(id)
        .then((found) => {
          const state$ = found || new RunningState(init, false)
          if (!found) {
            this._registerRunningState(state$)
          }
          this.inmemory.endure(id.toString(), state$)
          const subscription = state$.subscribe(subscriber)
          state$.add(subscription)
          subscription.add(() => {
            if (state$.subscriptionSet.size === 0) {
              this.inmemory.free(id.toString())
            }
          })
        })
        .catch((error) => {
          this.logger.err(`An error occurred in updates$ for StreamID ${id}: ${error}`)
          // propagate the error to the subscriber
          subscriber.error(error)
        })
    })
  }

  anchorLoopHandler(): AnchorLoopHandler {
    const carBuilder = this.#deps.anchorRequestCarBuilder
    const fromMemoryOrStoreSafe = this.fromMemoryOrStore.bind(this)
    const handleAnchorEvent = this.handleAnchorEvent.bind(this)
    return {
      buildRequestCar(streamId: StreamID, tip: CID): Promise<CAR> {
        return carBuilder.build(streamId, tip)
      },
      async handle(event: AnchorEvent): Promise<boolean> {
        const state$ = await fromMemoryOrStoreSafe(event.streamId)
        if (!state$) return true
        return handleAnchorEvent(state$, event)
      },
    }
  }

  async close(): Promise<void> {
    await this.loadingQ.close()
    await this.executionQ.close()
    Array.from(this.inmemory).forEach(([id, stream]) => {
      this.inmemory.delete(id)
      stream.complete()
    })
    await this.#deps.pinStore.close()
    await this.#deps.anchorRequestStore.close()
    await this.index.close()
  }
}
