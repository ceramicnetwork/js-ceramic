import { Document } from './document';
import DocID from '@ceramicnetwork/docid';

export class Repository {
  readonly #map: Map<string, Document> = new Map();

  /**
   * Async loading of the document stored on disk or running in memory.
   */
  async get(docId: DocID): Promise<Document | null> {
    return this.#map.get(docId.toString());
  }

  /**
   * Stub for adding the document.
   */
  async add(document: Document): Promise<void> {
    this.#map.set(document.id.toString(), document);
  }

  /**
   * Remove from memory. Stub.
   * @param docId
   */
  delete(docId: DocID) {
    this.#map.delete(docId.toString());
  }

  async close(): Promise<void> {
    for (const document of this.#map.values()) {
      await document.close();
    }
  }
}
