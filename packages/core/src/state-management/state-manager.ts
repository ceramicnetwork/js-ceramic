import { Dispatcher } from '../dispatcher.js'
import { ExecutionQueue } from './execution-queue.js'
import {
  AnchorOpts,
  AnchorStatus,
  CreateOpts,
  DiagnosticsLogger,
  GenesisCommit,
  UpdateOpts,
} from '@ceramicnetwork/common'
import { RunningState } from './running-state.js'
import type { Subscription } from 'rxjs'
import type { LocalIndexApi } from '@ceramicnetwork/indexing'
import { AnchorRequestStore } from '../store/anchor-request-store.js'
import type { RepositoryInternals } from './repository-internals.js'
import { OperationType } from './operation-type.js'
import type { AnchorService } from '../anchor/anchor-service.js'
import type { AnchorRequestCarBuilder } from '../anchor/anchor-request-car-builder.js'

export class StateManager {
  /**
   * @param dispatcher - currently used instance of Dispatcher
   * @param executionQ - currently used instance of ExecutionQueue
   * @param anchorService - currently used instance of AnchorService
   * @param logger - Logger
   * @param fromMemoryOrStore - load RunningState from in-memory cache or from state store, see `Repository#fromMemoryOrStore`.
   * @param load - `Repository#load`
   * @param indexStreamIfNeeded - `Repository#indexStreamIfNeeded`
   */
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly anchorRequestStore: AnchorRequestStore,
    private readonly executionQ: ExecutionQueue,
    public anchorService: AnchorService,
    private readonly logger: DiagnosticsLogger,
    private readonly _index: LocalIndexApi,
    private readonly internals: RepositoryInternals,
    private readonly anchorRequestCarBuilder: AnchorRequestCarBuilder
  ) {}
}
