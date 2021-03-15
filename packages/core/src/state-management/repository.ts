import { DEFAULT_LOAD_DOCOPTS, Document } from '../document';
import DocID from '@ceramicnetwork/docid';
import { AsyncLruMap } from './async-lru-map';
import { DocumentFactory } from './document-factory';
import { DocOpts, DocState, DocStateHolder } from '@ceramicnetwork/common';
import { PinStore } from '../store/pin-store';
import { NetworkLoad } from './network-load';
import { NamedTaskQueue } from './named-task-queue';
import { DiagnosticsLogger } from '@ceramicnetwork/logger';
import { ExecutionQueue } from './execution-queue';

export class Repository {
  readonly loadingQ: NamedTaskQueue = new NamedTaskQueue();
  readonly executionQ: ExecutionQueue;

  readonly #map: AsyncLruMap<Document>;
  #documentFactory?: DocumentFactory;
  pinStore?: PinStore;
  #networkLoad?: NetworkLoad;

  constructor(limit: number, logger: DiagnosticsLogger) {
    this.executionQ = new ExecutionQueue(logger, (docId) => this.get(docId).then((doc) => doc.state$));
    this.#map = new AsyncLruMap(limit, async (entry) => {
      entry.value.close();
      await this.executionQ.tasks.lanes.get(entry.value.id.toString()).onIdle();
    });
  }

  // Ideally this would be provided in the constructor, but circular dependencies in our initialization process make this necessary for now
  setDocumentFactory(documentFactory: DocumentFactory): void {
    this.#documentFactory = documentFactory;
  }

  // Ideally this would be provided in the constructor, but circular dependencies in our initialization process make this necessary for now
  setPinStore(pinStore: PinStore) {
    this.pinStore = pinStore;
  }

  setNetworkLoad(networkLoad: NetworkLoad) {
    this.#networkLoad = networkLoad;
  }

  async fromMemory(docId: DocID): Promise<Document | undefined> {
    return this.#map.get(docId.toString());
  }

  async fromStateStore(docId: DocID): Promise<Document | undefined> {
    if (this.pinStore && this.#documentFactory) {
      const docState = await this.pinStore.stateStore.load(docId);
      if (docState) {
        const document = await this.#documentFactory.build(docState);
        await this.add(document);
        return document;
      } else {
        return undefined;
      }
    }
  }

  async fromNetwork(docId: DocID, opts: DocOpts = {}): Promise<Document> {
    const document = await this.#networkLoad.load(docId);
    await this.add(document);
    await document._syncDocumentToCurrent(document.state$, { ...DEFAULT_LOAD_DOCOPTS, ...opts });
    return document;
  }

  /**
   * Returns a document from wherever we can get information about it.
   * Starts by checking if the document state is present in the in-memory cache, if not then then checks the state store, and finally loads the document from pubsub.
   */
  async load(docId: DocID, opts: DocOpts = {}): Promise<Document> {
    return this.loadingQ.run(docId.toString(), async () => {
      const fromMemory = await this.fromMemory(docId);
      if (fromMemory) return fromMemory;
      const fromStateStore = await this.fromStateStore(docId);
      if (fromStateStore) return fromStateStore;
      return this.fromNetwork(docId, opts);
    });
  }

  /**
   * Checks if we can get the document state without having to load it via pubsub (i.e. we have the document state in our in-memory cache or in the state store)
   */
  async has(docId: DocID): Promise<boolean> {
    const fromMemory = await this.fromMemory(docId);
    if (fromMemory) return true;
    const fromState = await this.pinStore.stateStore.load(docId);
    return Boolean(fromState);
  }

  /**
   * Return a document, either from cache or re-constructed from state store, but will not load from the network.
   * Adds the document to cache.
   */
  async get(docId: DocID): Promise<Document | undefined> {
    return this.loadingQ.run(docId.toString(), async () => {
      const fromMemory = await this.fromMemory(docId);
      if (fromMemory) return fromMemory;
      return this.fromStateStore(docId);
    });
  }

  /**
   * Return a document state, either from cache or from state store.
   */
  async docState(docId: DocID): Promise<DocState | undefined> {
    const fromMemory = await this.#map.get(docId.toString());
    if (fromMemory) {
      return fromMemory.state;
    } else {
      if (this.pinStore) {
        return this.pinStore.stateStore.load(docId);
      }
    }
  }

  /**
   * Stub for adding the document.
   */
  async add(document: Document): Promise<void> {
    await this.#map.set(document.id.toString(), document);
  }

  pin(docStateHolder: DocStateHolder): Promise<void> {
    return this.pinStore.add(docStateHolder);
  }

  unpin(docId: DocID): Promise<void> {
    return this.pinStore.rm(docId);
  }

  /**
   * List pinned documents as array of DocID strings.
   * If `docId` is passed, indicate if it is pinned.
   */
  async listPinned(docId?: DocID): Promise<string[]> {
    if (this.pinStore) {
      return this.pinStore.stateStore.list(docId);
    } else {
      return [];
    }
  }

  async close(): Promise<void> {
    await this.loadingQ.close();
    await this.executionQ.close();
    await Promise.all(
      Array.from(this.#map).map(async ([id, document]) => {
        await this.#map.delete(id);
        document.close();
      }),
    );
    await this.pinStore.close();
  }
}
