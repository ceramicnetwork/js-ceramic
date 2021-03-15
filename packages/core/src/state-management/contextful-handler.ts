import CID from 'cids';
import { CeramicCommit, Context, DocState, Doctype, DoctypeHandler } from '@ceramicnetwork/common';

/**
 * Wrap Doctype handler so that operations do not need Context passed.
 * This class contains Context.
 */
export class ContextfulHandler<T extends Doctype = Doctype> {
  constructor(private readonly context: Context, private readonly handler: DoctypeHandler<T>) {}

  /**
   * Instantiate doctype.
   */
  doctype(state: DocState): T {
    return new this.handler.doctype(state, this.context);
  }

  /**
   * Applies commit to the document (genesis|signed|anchored)
   * @param commit - Commit instance
   * @param cid - Record CID
   * @param state - Document state
   */
  applyCommit(commit: CeramicCommit, cid: CID, state?: DocState): Promise<DocState> {
    return this.handler.applyCommit(commit, cid, this.context, state);
  }
}
