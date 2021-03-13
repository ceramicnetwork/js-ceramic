import { Context, DocState } from '@ceramicnetwork/common';
import { Document } from '../document';
import { validateState } from '../validate-state';
import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { HandlersMap } from '../handlers-map';
import { RunningState } from './running-state';

export class DocumentFactory {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly pinStore: PinStore,
    private readonly context: Context,
    private readonly validateDocs: boolean,
    private readonly handlers: HandlersMap,
  ) {}

  async build(initialState: DocState) {
    const validate = this.validateDocs;
    const handler = this.handlers.get(initialState.doctype);
    const state$ = new RunningState(initialState)
    const document = new Document(state$, this.dispatcher, this.pinStore, validate, this.context, handler);
    if (validate) {
      await validateState(document.state, document.content, this.context.api.loadDocument.bind(this.context.api));
    }
    return document;
  }
}
