import { Context } from '@ceramicnetwork/common';
import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { StateValidation } from './state-validation';
import { ConflictResolution } from '../conflict-resolution';
import { ExecutionQueue } from './execution-queue';

export class DocumentFactory {
  constructor(
    readonly dispatcher: Dispatcher,
    readonly pinStore: PinStore,
    readonly context: Context,
    readonly conflictResolution: ConflictResolution,
    readonly stateValidation: StateValidation,
    readonly executionQ: ExecutionQueue,
  ) {}
}
