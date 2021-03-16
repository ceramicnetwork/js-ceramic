import { PinApi } from '@ceramicnetwork/common';
import DocID from '@ceramicnetwork/docid';
import { DiagnosticsLogger } from "@ceramicnetwork/logger";
import { Repository } from './state-management/repository';
import { RunningStateLike } from './state-management/running-state';

/**
 * PinApi for Ceramic core.
 */
export class LocalPinApi implements PinApi {
  constructor(
    private readonly repository: Repository,
    private readonly loadDoc: (docId: DocID) => Promise<RunningStateLike>,
    private readonly logger: DiagnosticsLogger,
  ) {}

  async add(docId: DocID): Promise<void> {
    const state$ = await this.loadDoc(docId);
    await this.repository.pin(state$);
    this.logger.verbose(`Pinned document ${docId.toString()}`)
  }

  async rm(docId: DocID): Promise<void> {
    await this.repository.unpin(docId);
    this.logger.verbose(`Unpinned document ${docId.toString()}`)
  }

  async ls(docId?: DocID): Promise<AsyncIterable<string>> {
    const docIds = await this.repository.listPinned(docId ? docId.baseID : null);
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
