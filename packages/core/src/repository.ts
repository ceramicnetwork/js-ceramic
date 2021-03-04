import { Document } from './document';
import DocID from '@ceramicnetwork/docid';

export class Repository {
  readonly #map: Map<string, Document> = new Map();

  /**
   * Stub for async loading of the document.
   */
  async get(docId: DocID): Promise<Document> {
    const found = this.#map.get(docId.toString());
    if (found) {
      return found;
    } else {
      throw new Error(`No document found for id ${docId}`);
    }
  }

  /**
   * Stub for adding the document.
   */
  add(document: Document): void {
    this.#map.set(document.id.toString(), document);
  }

  /**
   * The document is in memory or on disk to load.
   */
  async has(docId: DocID): Promise<boolean> {
    return this.#map.has(docId.toString());
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
