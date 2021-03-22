import DocID from '@ceramicnetwork/docid';
import { AnchorService, AnchorStatus, Context, DocOpts, DocState, DocStateHolder } from '@ceramicnetwork/common';
import { PinStore } from '../store/pin-store';
import { NamedTaskQueue } from './named-task-queue';
import { DiagnosticsLogger } from '@ceramicnetwork/common';
import { ExecutionQueue } from './execution-queue';
import { RunningState } from './running-state';
import { LRUMap } from 'lru_map';
import { StateManager } from './state-manager';
import type { Dispatcher } from '../dispatcher';
import type { ConflictResolution } from '../conflict-resolution';
import type { HandlersMap } from '../handlers-map';
import type { StateValidation } from './state-validation';
import { Subject } from 'rxjs';

export type RepositoryDependencies = {
  dispatcher: Dispatcher;
  pinStore: PinStore;
  context: Context;
  handlers: HandlersMap;
  anchorService: AnchorService;
  conflictResolution: ConflictResolution;
  stateValidation: StateValidation;
};

export class Repository {
  /**
   * Serialize loading operations per docId.
   */
  readonly loadingQ: NamedTaskQueue;

  /**
   * Serialize operations on state per docId.
   * Ensure that the task is run with a currently run state by abstracting over state loading.
   */
  readonly executionQ: ExecutionQueue;

  /**
   * In-memory cache of the currently running documents.
   */
  readonly inmemory: LRUMap<string, RunningState>;

  readonly feed$: Subject<DocState> = new Subject<DocState>();

  /**
   * Various dependencies.
   */
  #deps: RepositoryDependencies;

  /**
   * Instance of StateManager for performing operations on document state.
   */
  stateManager: StateManager;

  constructor(limit: number, private readonly logger: DiagnosticsLogger) {
    this.loadingQ = new NamedTaskQueue((error) => {
      logger.err(error);
    });
    this.executionQ = new ExecutionQueue(logger, (docId) => this.get(docId));
    this.inmemory = new LRUMap(limit);
    this.inmemory.shift = function () {
      const entry = LRUMap.prototype.shift.call(this);
      entry[1].complete();
      return entry;
    };
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
    );
  }

  private fromMemory(docId: DocID): RunningState | undefined {
    return this.inmemory.get(docId.toString());
  }

  private async fromStateStore(docId: DocID): Promise<RunningState | undefined> {
    const docState = await this.#deps.pinStore.stateStore.load(docId);
    if (docState) {
      const runningState = new RunningState(docState);
      this.add(runningState);
      const toRecover =
        runningState.value.anchorStatus === AnchorStatus.PENDING ||
        runningState.value.anchorStatus === AnchorStatus.PROCESSING;
      if (toRecover) {
        this.stateManager.anchor(runningState);
      }
      return runningState;
    } else {
      return undefined;
    }
  }

  private async fromNetwork(docId: DocID, opts: DocOpts = {}): Promise<RunningState> {
    const handler = this.#deps.handlers.get(docId.typeName);
    const genesisCid = docId.cid;
    const commit = await this.#deps.dispatcher.retrieveCommit(genesisCid);
    if (commit == null) {
      throw new Error(`No genesis commit found with CID ${genesisCid.toString()}`);
    }
    const state = await handler.applyCommit(commit, docId.cid, this.#deps.context);
    await this.#deps.stateValidation.validate(state, state.content);
    const state$ = new RunningState(state);
    this.add(state$);
    await this.stateManager.syncGenesis(state$, opts);
    this.logger.verbose(`Document ${docId.toString()} successfully loaded`);
    return state$;
  }

  /**
   * Returns a document from wherever we can get information about it.
   * Starts by checking if the document state is present in the in-memory cache, if not then then checks the state store, and finally loads the document from pubsub.
   */
  async load(docId: DocID, opts: DocOpts = {}): Promise<RunningState> {
    return this.loadingQ.run(docId.toString(), async () => {
      const fromMemory = this.fromMemory(docId);
      if (fromMemory) return fromMemory;
      const fromStateStore = await this.fromStateStore(docId);
      if (fromStateStore) return fromStateStore;
      return this.fromNetwork(docId, opts);
    });
  }

  /**
   * Return a document, either from cache or re-constructed from state store, but will not load from the network.
   * Adds the document to cache.
   */
  async get(docId: DocID): Promise<RunningState | undefined> {
    return this.loadingQ.run(docId.toString(), async () => {
      const fromMemory = this.fromMemory(docId);
      if (fromMemory) return fromMemory;
      return this.fromStateStore(docId);
    });
  }

  /**
   * Return a document state, either from cache or from state store.
   */
  async docState(docId: DocID): Promise<DocState | undefined> {
    const fromMemory = this.inmemory.get(docId.toString());
    if (fromMemory) {
      return fromMemory.state;
    } else {
      return this.#deps.pinStore.stateStore.load(docId);
    }
  }

  /**
   * Adds the document to the in-memory cache
   */
  add(state$: RunningState): void {
    state$.subscribe({
      next: this.feed$.next.bind(this.feed$),
    });
    this.inmemory.set(state$.id.toString(), state$);
  }

  pin(docStateHolder: DocStateHolder): Promise<void> {
    return this.#deps.pinStore.add(docStateHolder);
  }

  unpin(docId: DocID): Promise<void> {
    return this.#deps.pinStore.rm(docId);
  }

  /**
   * List pinned documents as array of DocID strings.
   * If `docId` is passed, indicate if it is pinned.
   */
  async listPinned(docId?: DocID): Promise<string[]> {
    return this.#deps.pinStore.ls(docId);
  }

  async close(): Promise<void> {
    await this.loadingQ.close();
    await this.executionQ.close();
    Array.from(this.inmemory).forEach(([id, document]) => {
      this.inmemory.delete(id);
      document.complete();
    });
    await this.#deps.pinStore.close();
  }
}
