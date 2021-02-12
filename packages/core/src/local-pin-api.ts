import { DocCache, PinApi } from '@ceramicnetwork/common';
import DocID from '@ceramicnetwork/docid';
import Document from './document';
import { PinStore } from './store/pin-store';

/**
 * PinApi for Ceramic core.
 */
export class LocalPinApi implements PinApi {
  constructor(
    private readonly pinStore: PinStore,
    private readonly docCache: DocCache,
    private readonly loadDoc: (docId: DocID) => Promise<Document>,
  ) {}

  async add(docId: DocID): Promise<void> {
    const document = await this.loadDoc(docId);
    await this.pinStore.add(document.doctype);
    this.docCache.pin(document);
  }

  async rm(docId: DocID): Promise<void> {
    await this.pinStore.rm(docId);
    this.docCache.unpin(docId);
  }

  async ls(docId?: DocID): Promise<AsyncIterable<string>> {
    const docIds = await this.pinStore.ls(docId ? docId.baseID : null);
    return {
      [Symbol.asyncIterator](): any {
        let index = 0;
        return {
          next(): any {
            if (index === docIds.length) {
              return Promise.resolve({ value: null, done: true });
            }
            return Promise.resolve({ value: docIds[index++], done: false });
          },
        };
      },
    };
  }
}
