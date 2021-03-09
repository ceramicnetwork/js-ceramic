import { Document } from '../document';
import DocID from '@ceramicnetwork/docid';
import { AsyncLruMap } from './async-lru-map';
import { StateStore } from '../store/state-store';
import { DocumentFactory } from './document-factory';
import { DocState } from '@ceramicnetwork/common';
import { PinStore } from '../store/pin-store';

export class Repository {
  readonly #map: AsyncLruMap<Document>;
  #documentFactory?: DocumentFactory;
  #pinStore?: PinStore

  constructor(limit: number) {
    this.#map = new AsyncLruMap(limit, async (entry) => {
      await entry.value.close();
    });
  }

  // Ideally this would be provided in the constructor, but circular dependencies in our initialization process make this necessary for now
  setDocumentFactory(documentFactory: DocumentFactory): void {
    this.#documentFactory = documentFactory;
  }

  // Ideally this would be provided in the constructor, but circular dependencies in our initialization process make this necessary for now
  setPinStore(pinStore: PinStore) {
    this.#pinStore = pinStore
  }

  /**
   * Return a document, either from cache or re-constructed from state store.
   * Adds the document to cache.
   */
  async get(docId: DocID): Promise<Document | undefined> {
    const fromMemory = await this.#map.get(docId.toString());
    if (fromMemory) {
      return fromMemory;
    } else {
      if (this.#pinStore && this.#documentFactory) {
        const docState = await this.#pinStore.stateStore.load(docId);
        if (docState) {
          const document = await this.#documentFactory.build(docState);
          await this.#map.set(docId.toString(), document)
          return document
        } else {
          return undefined;
        }
      }
    }
  }

  /**
   * Return a document state, either from cache or from state store.
   */
  async docState(docId: DocID): Promise<DocState | undefined> {
    const fromMemory = await this.#map.get(docId.toString());
    if (fromMemory) {
      return fromMemory.state;
    } else {
      if (this.#pinStore && this.#documentFactory) {
        return this.#pinStore.stateStore.load(docId);
      }
    }
  }

  /**
   * Stub for adding the document.
   */
  async add(document: Document): Promise<void> {
    await this.#map.set(document.id.toString(), document);
  }

  /**
   * Removes the document from the cache
   * @param docId
   */
  async delete(docId: DocID): Promise<void> {
    await this.#map.delete(docId.toString());
  }

  async list(): Promise<string[]> {
    if (this.#pinStore) {
      return this.#pinStore.stateStore.list()
    } else {
      return []
    }
  }

  async close(): Promise<void> {
    for (const [, document] of this.#map) {
      await document.close();
    }
    await this.#pinStore.close()
  }
}
