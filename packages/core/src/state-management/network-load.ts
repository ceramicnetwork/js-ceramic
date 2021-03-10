import { Dispatcher } from '../dispatcher';
import { HandlersMap } from '../handlers-map';
import { DiagnosticsLogger } from '@ceramicnetwork/logger';
import { DocumentFactory } from './document-factory';
import { Document } from '../document';
import { DEFAULT_LOAD_DOCOPTS } from './loading-queue';
import { Context, DocOpts } from '@ceramicnetwork/common';
import { DocID } from '@ceramicnetwork/docid';

export class NetworkLoad {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly handlers: HandlersMap,
    private readonly context: Context,
    private readonly logger: DiagnosticsLogger,
    private readonly documentFactory: DocumentFactory,
  ) {}

  async load(docId: DocID, opts: DocOpts = {}): Promise<Document> {
    console.log('network.load.0', docId, opts)
    // Load the current version of the document
    const handler = this.handlers.get(docId.typeName);
    opts = { ...DEFAULT_LOAD_DOCOPTS, ...opts };
    const genesisCid = docId.cid;
    const commit = await this.dispatcher.retrieveCommit(genesisCid);
    if (commit == null) {
      throw new Error(`No genesis commit found with CID ${genesisCid.toString()}`);
    }
    const state = await handler.applyCommit(commit, docId.cid, this.context);
    const document = await this.documentFactory.build(state);
    console.log('network.load.1', new Date(), opts, document.state)
    await document._syncDocumentToCurrent(opts);
    console.log('network.load.2', new Date(), document.state)
    this.logger.verbose(`Document ${docId.toString()} successfully loaded`);
    return document;
  }
}
