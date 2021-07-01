import StreamID, {CommitID} from '@ceramicnetwork/streamid';
import {
  AnchorService,
  AnchorStatus,
  Context, CreateOpts,
  StreamState,
  StreamStateHolder,
  LoadOpts,
  SyncOptions,
} from '@ceramicnetwork/common';
import { PinStore } from '../store/pin-store';
import { DiagnosticsLogger } from '@ceramicnetwork/common';
import { ExecutionQueue } from './execution-queue';
import { RunningState } from './running-state';
import { StateManager } from './state-manager';
import type { Dispatcher } from '../dispatcher';
import type { ConflictResolution } from '../conflict-resolution';
import type { HandlersMap } from '../handlers-map';
import type { StateValidation } from './state-validation';
import { Observable } from 'rxjs';
import { StateCache } from './state-cache';
import { SnapshotState } from "./snapshot-state";

export type RepositoryDependencies = {
  dispatcher: Dispatcher;
  pinStore: PinStore;
  context: Context;
  handlers: HandlersMap;
  anchorService: AnchorService;
  conflictResolution: ConflictResolution;
  stateValidation: StateValidation;
};

const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE, syncTimeoutSeconds: 3 }

export class Repository {
  /**
   * Serialize loading operations per streamId.
   */
  readonly loadingQ: ExecutionQueue;

  /**
   * Serialize operations on state per streamId.
   */
  readonly executionQ: ExecutionQueue;

  /**
   * In-memory cache of the currently running streams.
   */
  readonly inmemory: StateCache<RunningState>;

  /**
   * Various dependencies.
   */
  #deps: RepositoryDependencies;

  /**
   * Instance of StateManager for performing operations on stream state.
   */
  stateManager: StateManager;

  /**
   * @param cacheLimit - Maximum number of streams to store in memory cache.
   * @param logger - Where we put diagnostics messages.
   * @param concurrencyLimit - Maximum number of concurrently running tasks on the streams.
   */
  constructor(cacheLimit: number, concurrencyLimit: number, private readonly logger: DiagnosticsLogger) {
    this.loadingQ = new ExecutionQueue(concurrencyLimit, logger);
    this.executionQ = new ExecutionQueue(concurrencyLimit, logger);
    this.inmemory = new StateCache(cacheLimit, (state$) => state$.complete());
    this.updates$ = this.updates$.bind(this);
  }

  // Ideally this would be provided in the constructor, but circular dependencies in our initialization process make this necessary for now
  setDeps(deps: RepositoryDependencies): void {
    this.#deps = deps;
    this.stateManager = new StateManager(
      deps.dispatcher,
      deps.pinStore,
      this.executionQ,
      deps.anchorService,
      deps.conflictResolution,
      this.logger,
      (streamId) => this.get(streamId),
      (streamId, opts) => this.load(streamId, opts),
    );
  }

  private fromMemory(streamId: StreamID): RunningState | undefined {
    return this.inmemory.get(streamId.toString());
  }

  private async fromStateStore(streamId: StreamID): Promise<RunningState | undefined> {
    const streamState = await this.#deps.pinStore.stateStore.load(streamId);
    if (streamState) {
      const runningState = new RunningState(streamState);
      this.add(runningState);
      const toRecover =
        runningState.value.anchorStatus === AnchorStatus.PENDING ||
        runningState.value.anchorStatus === AnchorStatus.PROCESSING;
      if (toRecover && this.stateManager.anchorService) {
        this.stateManager.confirmAnchorResponse(runningState);
      }
      return runningState;
    } else {
      return undefined;
    }
  }

  private async fromNetwork(streamId: StreamID): Promise<RunningState> {
    const handler = this.#deps.handlers.get(streamId.typeName);
    const genesisCid = streamId.cid;
    const commit = await this.#deps.dispatcher.retrieveCommit(genesisCid, streamId);
    if (commit == null) {
      throw new Error(`No genesis commit found with CID ${genesisCid.toString()}`);
    }
    // Do not check timestamp here
    const state = await handler.applyCommit(commit, {cid: streamId.cid, timestamp: null}, this.#deps.context);
    await this.#deps.stateValidation.validate(state, state.content);
    const state$ = new RunningState(state);
    this.add(state$);
    this.logger.verbose(`Genesis commit for stream ${streamId.toString()} successfully loaded`);
    return state$;
  }

  /**
   * Returns a stream from wherever we can get information about it.
   * Starts by checking if the stream state is present in the in-memory cache, if not then
   * checks the state store, and finally loads the stream from pubsub.
   */
  async load(streamId: StreamID, opts: LoadOpts): Promise<RunningState> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts }

    return this.loadingQ.forStream(streamId).run(async () => {
      let fromStateStore = false
      let stream = this.fromMemory(streamId);
      if (!stream) {
        stream = await this.fromStateStore(streamId);
        if (stream) {
          fromStateStore = true
        }
      }

      if (stream && opts.sync == SyncOptions.PREFER_CACHE) {
        if (!fromStateStore || this.stateManager.wasPinnedStreamSynced(streamId)) {
          // If the stream was from the in-memory cache we know it's up to date, so no need to sync.
          // If the stream from the state store then we check if we've already synced the stream at
          // least once in the lifetime of this process: if so we know the state is up to date, so
          // no need to sync. If not, then it could be out of date due to updates made while the
          // node was offline, in which case we fall through to calling `stateManager.sync()` below.
          return stream
        }
      }

      if (!stream) {
        stream = await this.fromNetwork(streamId);
      }

      if (opts.sync == SyncOptions.NEVER_SYNC) {
        return stream
      }

      await this.stateManager.sync(stream, opts.syncTimeoutSeconds * 1000, fromStateStore);
      return stream
    });
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
    const base$ = await this.load(commitId.baseID, opts);
    return this.stateManager.atCommit(base$, commitId)
  }

  /**
   * Load the state for a stream as it was at a specified wall clock time, based on the anchor
   * timestamps of AnchorCommits in the log.
   * @param streamId
   * @param opts - must contain an 'atTime' parameter
   */
  async loadAtTime(streamId: StreamID, opts: LoadOpts): Promise<SnapshotState> {
    const base$ = await this.load(streamId.baseID, opts);
    return this.stateManager.atTime(base$, opts.atTime);
  }

  /**
   * Handles new stream creation by loading genesis commit into memory and then handling the given
   * CreateOpts for the genesis commit.
   * @param streamId
   * @param opts
   */
  async applyCreateOpts(streamId: StreamID, opts: CreateOpts): Promise<RunningState> {
    const state = await this.load(streamId, opts)
    this.stateManager.applyWriteOpts(state, opts)
    return state
  }

  /**
   * Return a stream, either from cache or re-constructed from state store, but will not load from the network.
   * Adds the stream to cache.
   */
  async get(streamId: StreamID): Promise<RunningState | undefined> {
    return this.loadingQ.forStream(streamId).run(async () => {
      const fromMemory = this.fromMemory(streamId);
      if (fromMemory) return fromMemory;
      return this.fromStateStore(streamId);
    });
  }

  /**
   * Return a stream state, either from cache or from state store.
   */
  async streamState(streamId: StreamID): Promise<StreamState | undefined> {
    const fromMemory = this.inmemory.get(streamId.toString());
    if (fromMemory) {
      return fromMemory.state;
    } else {
      return this.#deps.pinStore.stateStore.load(streamId);
    }
  }

  /**
   * Adds the stream's RunningState to the in-memory cache and subscribes the Repository's global feed$ to receive changes emitted by that RunningState
   */
  add(state$: RunningState): void {
    this.inmemory.set(state$.id.toString(), state$);
  }

  pin(streamStateHolder: StreamStateHolder): Promise<void> {
    return this.#deps.pinStore.add(streamStateHolder);
  }

  unpin(streamId: StreamID): Promise<void> {
    return this.#deps.pinStore.rm(streamId);
  }

  /**
   * List pinned streams as array of StreamID strings.
   * If `streamId` is passed, indicate if it is pinned.
   */
  async listPinned(streamId?: StreamID): Promise<string[]> {
    return this.#deps.pinStore.ls(streamId);
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
      const id = new StreamID(init.type, init.log[0].cid);
      this.get(id).then((found) => {
        const state$ = found || new RunningState(init);
        this.inmemory.endure(id.toString(), state$);
        state$.subscribe(subscriber).add(() => {
          if (state$.observers.length === 0) {
            this.inmemory.free(id.toString());
          }
        });
      });
    });
  }

  async close(): Promise<void> {
    await this.loadingQ.close();
    await this.executionQ.close();
    Array.from(this.inmemory).forEach(([id, stream]) => {
      this.inmemory.delete(id);
      stream.complete();
    });
    await this.#deps.pinStore.close();
  }
}
