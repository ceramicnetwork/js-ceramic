import { Context } from '@ceramicnetwork/common';
import { Document } from '../document';
import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { RunningState } from './running-state';
import { StateValidation } from './state-validation';
import { ConflictResolution } from '../conflict-resolution';
import { ExecutionQueue } from './execution-queue';
import { DocID } from '@ceramicnetwork/docid';

export class DocumentFactory {
  constructor(
    readonly dispatcher: Dispatcher,
    readonly pinStore: PinStore,
    readonly context: Context,
    readonly conflictResolution: ConflictResolution,
    readonly stateValidation: StateValidation,
    readonly executionQ: ExecutionQueue,
  ) {}

  async build(state$: RunningState) {
    const anchorService = this.context.anchorService;
    const docId = new DocID(state$.value.doctype, state$.value.log[0].cid);
    const document = new Document(
      state$,
      this.dispatcher,
      this.pinStore,
      this.executionQ.forDocument(docId),
      anchorService,
      this.conflictResolution,
    );
    await this.stateValidation.validate(document.state, document.content);
    return document;
  }
}
