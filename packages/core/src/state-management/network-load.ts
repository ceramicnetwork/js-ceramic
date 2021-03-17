import { Dispatcher } from '../dispatcher';
import { HandlersMap } from '../handlers-map';
import { DiagnosticsLogger } from '@ceramicnetwork/logger';
import { DocumentFactory } from './document-factory';
import { Context } from '@ceramicnetwork/common';
import { DocID } from '@ceramicnetwork/docid';
import { RunningState } from './running-state';

export class NetworkLoad {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly handlers: HandlersMap,
    private readonly context: Context,
    private readonly logger: DiagnosticsLogger,
    private readonly documentFactory: DocumentFactory,
  ) {}

  async load(docId: DocID): Promise<RunningState> {
    // Load the current version of the document
    const handler = this.handlers.get(docId.typeName);
    const genesisCid = docId.cid;
    const commit = await this.dispatcher.retrieveCommit(genesisCid);
    if (commit == null) {
      throw new Error(`No genesis commit found with CID ${genesisCid.toString()}`);
    }
    const state = await handler.applyCommit(commit, docId.cid, this.context);
    await this.documentFactory.stateValidation.validate(state, state.content);
    const runningState = new RunningState(state)
    this.logger.verbose(`Document ${docId.toString()} successfully loaded`);
    return runningState;
  }
}
