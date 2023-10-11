import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import {
  AnchorOpts,
  AnchorStatus,
  CommitType,
  Context,
  CreateOpts,
  DiagnosticsLogger,
  InternalOpts,
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
import { Observable, Subscription } from 'rxjs'
import { StateCache } from './state-cache.js'
import { SnapshotState } from './snapshot-state.js'
import { IKVStore } from '../store/ikv-store.js'
import { AnchorRequestStore } from '../store/anchor-request-store.js'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import { RepositoryInternals } from './repository-internals.js'
import { StreamLoader } from '../stream-loading/stream-loader.js'
import { OperationType } from './operation-type.js'
import { StreamUpdater } from '../stream-loading/stream-updater.js'
import { CID } from 'multiformats/cid'
import type { AnchorService } from '../anchor/anchor-service.js'
import type { AnchorRequestCarBuilder } from '../anchor/anchor-request-car-builder.js'

const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE, syncTimeoutSeconds: 3 }

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

export class Repository {
  /**
   * Serialize loading operations per streamId.
   */
  readonly loadingQ: ExecutionQueue

  /**
   * Serialize operations on state per streamId.
   */
  readonly executionQ: ExecutionQueue

  /**
   * In-memory cache of the currently running streams.
   */
  readonly inmemory: StateCache<RunningState>

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

  /**
   * Internal APIs
   */
  _internals: RepositoryInternals

  /**
   * A collection of private helper functions used by the stream loading code
   * @private
   */
  readonly _loadHelpers = new (class {
    constructor(readonly parentRepository: Repository) {}

    _fromMemory(streamId: StreamID): RunningState | undefined {
      const state = this.parentRepository.inmemory.get(streamId.toString())
      if (state) {
        Metrics.count(CACHE_HIT_MEMORY, 1)
      }
      return state
    }

    async _fromStreamStateStore(streamId: StreamID): Promise<RunningState | undefined> {
      const streamState = await this.parentRepository.pinStore.stateStore.load(streamId)
      if (streamState) {
        Metrics.count(CACHE_HIT_LOCAL, 1)
        const runningState = new RunningState(streamState, true)
        this.parentRepository._internals.add(runningState)
        const storedRequest = await this.parentRepository.anchorRequestStore.load(streamId)
        if (storedRequest !== null && this.parentRepository.anchorService) {
          this.parentRepository._internals.confirmAnchorResponse(runningState, storedRequest.cid)
        }
        return runningState
      } else {
        return undefined
      }
    }

    /**
     * Return a stream, either from cache or re-constructed from state store, but will not load from the network.
     * Adds the stream to cache.
     */
    async _fromMemoryOrStore(streamId: StreamID): Promise<RunningState | undefined> {
      const fromMemory = this._fromMemory(streamId)
      if (fromMemory) return fromMemory
      return this._fromStreamStateStore(streamId)
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

      stream = await this._fromStreamStateStore(streamId)
      if (stream) {
        return [stream, this.parentRepository.wasPinnedStreamSynced(streamId)]
      }
      return [null, false]
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
      const state = await this.parentRepository.streamLoader.loadStream(
        streamId,
        syncTimeoutSeconds
      )
      Metrics.count(STREAM_SYNC, 1)
      const newState$ = new RunningState(state, false)
      this.parentRepository._internals.add(newState$)
      return newState$
    }

    async _genesisFromNetwork(streamId: StreamID): Promise<RunningState> {
      const state = await this.parentRepository.streamLoader.loadGenesisState(streamId)
      Metrics.count(CACHE_HIT_REMOTE, 1)

      const state$ = new RunningState(state, false)
      this.parentRepository._internals.add(state$)
      this.parentRepository.logger.verbose(
        `Genesis commit for stream ${streamId.toString()} successfully loaded`
      )
      return state$
    }

    /**
     * Takes a stream state that might not contain the complete log (and might in fact contain only the
     * genesis commit) and kicks off the process to load and apply the most recent Tip to it.
     *
     * @param state$ - Current stream state.
     * @param syncTimeoutSeconds - How much time do we wait for a response from the network.
     */
    async _sync(state$: RunningState, syncTimeoutSeconds: number): Promise<void> {
      const syncedState = await this.parentRepository.streamLoader.syncStream(
        state$.state,
        syncTimeoutSeconds
      )
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
    async _resyncStreamFromNetwork(
      streamId: StreamID,
      syncTimeoutSeconds: number,
      existingState$: RunningState | null
    ): Promise<RunningState> {
      const resyncedState = existingState$
        ? await this.parentRepository.streamLoader.resyncStream(
            streamId,
            existingState$.tip,
            syncTimeoutSeconds
          )
        : await this.parentRepository.streamLoader.loadStream(streamId, syncTimeoutSeconds)

      Metrics.count(STREAM_SYNC, 1)
      const newState$ = new RunningState(resyncedState, false)
      this.parentRepository._internals.add(newState$)
      return newState$
    }
  })(this)

  /**
   * @param cacheLimit - Maximum number of streams to store in memory cache.
   * @param logger - Where we put diagnostics messages.
   * @param concurrencyLimit - Maximum number of concurrently running tasks on the streams.
   */
  constructor(
    cacheLimit: number,
    concurrencyLimit: number,
    private readonly logger: DiagnosticsLogger
  ) {
    this.loadingQ = new ExecutionQueue('loading', concurrencyLimit, logger)
    this.executionQ = new ExecutionQueue('execution', concurrencyLimit, logger)
    this.inmemory = new StateCache(cacheLimit, (state$) => {
      if (state$.subscriptionSet.size > 0) {
        logger.debug(`Stream ${state$.id} evicted from cache while having subscriptions`)
      }
      Metrics.count(CACHE_EVICTED_MEMORY, 1)
      state$.complete()
    })
    this.updates$ = this.updates$.bind(this)
  }

  async injectKeyValueStore(stateStore: IKVStore): Promise<void> {
    this.setDeps({
      ...this.#deps,
      keyValueStore: stateStore,
    })
    await this.init()
  }

  async init(): Promise<void> {
    await this.pinStore.open(this.#deps.keyValueStore)
    await this.anchorRequestStore.open(this.#deps.keyValueStore)
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
    return this._internals.numPendingAnchorSubscriptions
  }

  private get anchorService(): AnchorService {
    return this.#deps.anchorService
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
    this._internals = new RepositoryInternals({
      anchorRequestStore: deps.anchorRequestStore,
      anchorService: deps.anchorService,
      context: deps.context,
      dispatcher: deps.dispatcher,
      executionQ: this.executionQ,
      handlers: deps.handlers,
      index: deps.indexing,
      inmemory: this.inmemory,
      loadingQ: this.loadingQ,
      logger: this.logger,
      pinStore: this.pinStore,
      streamLoader: deps.streamLoader,
      streamUpdater: deps.streamUpdater,
    })
  }

  /**
   * Returns a stream from wherever we can get information about it.
   * Starts by checking if the stream state is present in the in-memory cache, if not then
   * checks the state store, and finally loads the stream from pubsub.
   */
  async load(streamId: StreamID, loadOptions: LoadOpts & InternalOpts = {}): Promise<RunningState> {
    const opts = { ...DEFAULT_LOAD_OPTS, ...loadOptions }

    const [state$, synced] = await this.loadingQ.forStream(streamId).run(async () => {
      const [existingState$, alreadySynced] =
        await this._loadHelpers._fromMemoryOrStoreWithSyncStatus(streamId)

      switch (opts.sync) {
        case SyncOptions.PREFER_CACHE:
        case SyncOptions.SYNC_ON_ERROR: {
          if (!existingState$) {
            return [
              await this._loadHelpers._loadStreamFromNetwork(streamId, opts.syncTimeoutSeconds),
              true,
            ]
          }

          if (alreadySynced) {
            return [existingState$, alreadySynced]
          } else {
            await this._loadHelpers._sync(existingState$, opts.syncTimeoutSeconds)
            return [existingState$, true]
          }
        }
        case SyncOptions.NEVER_SYNC: {
          if (existingState$) {
            return [existingState$, alreadySynced]
          }
          // TODO(CDB-2761): Throw an error if stream isn't found in cache or state store.
          return [await this._loadHelpers._genesisFromNetwork(streamId), false]
        }
        case SyncOptions.SYNC_ALWAYS: {
          return [
            await this._loadHelpers._resyncStreamFromNetwork(
              streamId,
              opts.syncTimeoutSeconds,
              existingState$
            ),
            true,
          ]
        }
        default:
          throw new UnreachableCaseError(opts.sync, 'Invalid sync option')
      }
    })

    if (!opts.skipCacaoExpirationChecks) {
      StreamUtils.checkForCacaoExpiration(state$.state)
    }

    // TODO(WS1-1269): No need to update state if we loaded from the cache or state store
    await this._internals._updateStateIfPinned(state$)
    if (synced && state$.isPinned) {
      this.markPinnedAndSynced(state$.id)
    }

    return state$
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
    const optsSkippingCACAOChecks = { ...opts, skipCacaoExpirationChecks: true }
    const base$ = await this.load(commitId.baseID, optsSkippingCACAOChecks)

    return this._atCommit(commitId, base$)
  }

  async _atCommit(commitId: CommitID, existingState$: RunningState): Promise<SnapshotState> {
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
  async applyCommit(
    streamId: StreamID,
    commit: any,
    opts: CreateOpts | UpdateOpts
  ): Promise<RunningState> {
    this.logger.verbose(`Repository apply commit to stream ${streamId.toString()}`)

    const state$ = await this.load(streamId, opts)
    this.logger.verbose(`Repository loaded state for stream ${streamId.toString()}`)

    return this.executionQ.forStream(streamId).run(async () => {
      const originalState = state$.state
      const updatedState = await this.streamUpdater.applyCommitFromUser(originalState, commit)
      if (StreamUtils.tipFromState(updatedState).equals(StreamUtils.tipFromState(originalState))) {
        return state$ // nothing changed
      }

      state$.next(updatedState) // emit the new state

      await this._internals._updateStateIfPinned(state$)
      await this.applyWriteOpts(state$, opts, OperationType.UPDATE)
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
  async handleUpdate(streamId: StreamID, tip: CID, model?: StreamID): Promise<void> {
    let state$ = await this._loadHelpers._fromMemoryOrStore(streamId)
    const shouldIndex = model && this.index.shouldIndexStream(model)
    if (!shouldIndex && !state$) {
      // stream isn't pinned or indexed, nothing to do
      return
    }

    if (!state$) {
      state$ = await this.load(streamId)
    }
    this.executionQ.forStream(streamId).add(async () => {
      await this._internals.handleTip(state$, tip)
    })
  }

  /**
   * Request anchor for the latest stream state
   */
  async anchor(state$: RunningState, opts: AnchorOpts): Promise<Subscription> {
    if (!this.anchorService) {
      throw new Error(`Anchor requested for stream ${state$.id} but anchoring is disabled`)
    }
    if (state$.value.anchorStatus == AnchorStatus.ANCHORED) {
      return
    }

    const carFile = await this.#deps.anchorRequestCarBuilder.build(state$.id, state$.tip)
    const genesisCID = state$.value.log[0].cid
    const genesisCommit = carFile.get(genesisCID)
    await this.anchorRequestStore.save(state$.id, {
      cid: state$.tip,
      timestamp: Date.now(),
      genesis: genesisCommit,
    })

    const anchorStatus$ = await this.anchorService.requestAnchor(
      carFile,
      opts.waitForAnchorConfirmation
    )
    return this._internals.processAnchorResponse(state$, anchorStatus$)
  }

  /**
   * Apply options relating to authoring a new commit
   *
   * @param state$ - Running State
   * @param opts - Initialization options (request anchor, publish to pubsub, etc.)
   * @param opType - If we load, create or update a stream
   * @private
   */
  async applyWriteOpts(state$: RunningState, opts: CreateOpts | UpdateOpts, opType: OperationType) {
    const anchor = opts.anchor
    const publish = opts.publish
    if (anchor) {
      await this.anchor(state$, opts)
    }
    if (publish && opType !== OperationType.LOAD) {
      this._internals.publishTip(state$)
    }

    await this.handlePinOpts(state$, opts as PinningOpts, opType)
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
  async handlePinOpts(
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
      await this.pin(state$)
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
    await this.applyWriteOpts(state, opts, opType)
    return state
  }

  /**
   * Return a stream, either from cache or re-constructed from state store, but will not load from the network.
   * Adds the stream to cache.
   */
  async fromMemoryOrStore(streamId: StreamID): Promise<RunningState | undefined> {
    return await this._loadHelpers._fromMemoryOrStore(streamId)
  }

  /**
   * Return a stream state, either from cache or from state store.
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
  add(state$: RunningState): void {
    this._internals.add(state$)
  }

  pin(state$: RunningState, force?: boolean): Promise<void> {
    return this.#deps.pinStore.add(state$, force)
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
      this._internals.publishTip(state$)
    }

    this.markUnpinned(state$.id)
    return this.#deps.pinStore.rm(state$)
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

  /**
   * List pinned streams as array of StreamID strings.
   * If `streamId` is passed, indicate if it is pinned.
   */
  async listPinned(streamId?: StreamID): Promise<string[]> {
    return this.#deps.pinStore.ls(streamId)
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
   * @public
   */
  public async indexStreamIfNeeded(state$: RunningState): Promise<void> {
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
      this.fromMemoryOrStore(id).then((found) => {
        const state$ = found || new RunningState(init, false)
        this.inmemory.endure(id.toString(), state$)
        state$.subscribe(subscriber).add(() => {
          if (state$.observers.length === 0) {
            this.inmemory.free(id.toString())
          }
        })
      })
    })
  }

  async close(): Promise<void> {
    await this.loadingQ.close()
    await this.executionQ.close()
    Array.from(this.inmemory).forEach(([id, stream]) => {
      this.inmemory.delete(id)
      stream.complete()
    })
    await this.#deps.pinStore.close()
    await this.index.close()
  }
}
