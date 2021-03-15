import { Context, DocState } from '@ceramicnetwork/common';
import { Document } from '../document';
import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { HandlersMap } from '../handlers-map';
import { RunningState } from './running-state';
import { StateValidation } from './state-validation';
import { ContextfulHandler } from './contextful-handler';
import { TaskQueue } from '../pubsub/task-queue';
import { ConflictResolution } from '../conflict-resolution';

export class DocumentFactory {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly pinStore: PinStore,
    private readonly context: Context,
    private readonly handlers: HandlersMap,
    private readonly stateValidation: StateValidation,
  ) {}

  async build(initialState: DocState) {
    const handler = new ContextfulHandler(this.context, this.handlers.get(initialState.doctype));
    const state$ = new RunningState(initialState);
    const anchorService = this.context.anchorService;
    const diagnosticsLogger = this.context.loggerProvider.getDiagnosticsLogger();
    const tasks = new TaskQueue((error) => {
      diagnosticsLogger.err(error);
    });
    const conflictResolution = new ConflictResolution(anchorService, this.stateValidation, this.dispatcher, handler);
    const document = new Document(
      state$,
      this.dispatcher,
      this.pinStore,
      tasks,
      anchorService,
      handler,
      conflictResolution,
    );
    await this.stateValidation.validate(document.state, document.content);
    return document;
  }
}
