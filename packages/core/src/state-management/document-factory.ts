import { Context } from '@ceramicnetwork/common';
import { Document } from '../document';
import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { HandlersMap } from '../handlers-map';
import { RunningState } from './running-state';
import { StateValidation } from './state-validation';
import { ContextfulHandler } from './contextful-handler';
import { ConflictResolution } from '../conflict-resolution';
import { ExecutionQueue } from './execution-queue';
import { DocID } from '@ceramicnetwork/docid';

export class DocumentFactory {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly pinStore: PinStore,
    private readonly context: Context,
    private readonly handlers: HandlersMap,
    private readonly stateValidation: StateValidation,
    private readonly executionQ: ExecutionQueue,
  ) {}

  async build(state$: RunningState) {
    const handler = new ContextfulHandler(this.context, this.handlers.get(state$.value.doctype));
    const anchorService = this.context.anchorService;
    const conflictResolution = new ConflictResolution(anchorService, this.stateValidation, this.dispatcher, handler);
    const docId = new DocID(state$.value.doctype, state$.value.log[0].cid);
    const document = new Document(
      state$,
      this.dispatcher,
      this.pinStore,
      this.executionQ.forDocument(docId),
      anchorService,
      conflictResolution,
    );
    await this.stateValidation.validate(document.state, document.content);
    return document;
  }
}
