import { Context, DocState } from '@ceramicnetwork/common';
import { Document } from '../document';
import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { HandlersMap } from '../handlers-map';
import { RunningState } from './running-state';
import { StateValidation } from './state-validation';

export class DocumentFactory {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly pinStore: PinStore,
    private readonly context: Context,
    private readonly validateDocs: boolean,
    private readonly handlers: HandlersMap,
    private readonly stateValidation: StateValidation,
  ) {}

  async build(initialState: DocState) {
    const validate = this.validateDocs;
    const handler = this.handlers.get(initialState.doctype);
    const state$ = new RunningState(initialState);
    const document = new Document(state$, this.dispatcher, this.pinStore, validate, this.context, handler, false, this.stateValidation);
    if (validate) {
      await this.stateValidation.validate(document.state, document.content);
    }
    return document;
  }
}
