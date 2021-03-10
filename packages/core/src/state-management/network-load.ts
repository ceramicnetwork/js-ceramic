import { Dispatcher } from '../dispatcher';
import { HandlersMap } from '../handlers-map';
import { DiagnosticsLogger } from '@ceramicnetwork/logger';
import { DocumentFactory } from './document-factory';
import { Document } from '../document';
import { Context } from '@ceramicnetwork/common';
import { DocID } from '@ceramicnetwork/docid';

export class NetworkLoad {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly handlers: HandlersMap,
    private readonly context: Context,
    private readonly logger: DiagnosticsLogger,
    private readonly documentFactory: DocumentFactory,
  ) {}

  async load(docId: DocID): Promise<Document> {
    // Load the current version of the document
    const handler = this.handlers.get(docId.typeName);
    const genesisCid = docId.cid;
    const commit = await this.dispatcher.retrieveCommit(genesisCid);
    if (commit == null) {
      throw new Error(`No genesis commit found with CID ${genesisCid.toString()}`);
    }
    const state = await handler.applyCommit(commit, docId.cid, this.context);
    const document = await this.documentFactory.build(state);
    this.logger.verbose(`Document ${docId.toString()} successfully loaded`);
    return document;
  }
}
