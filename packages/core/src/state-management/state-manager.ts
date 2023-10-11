import { Dispatcher } from '../dispatcher.js'
import { ExecutionQueue } from './execution-queue.js'
import { ConflictResolution } from '../conflict-resolution.js'
import {
  AnchorOpts,
  AnchorStatus,
  CreateOpts,
  DiagnosticsLogger,
  GenesisCommit,
  UpdateOpts,
} from '@ceramicnetwork/common'
import { RunningState } from './running-state.js'
import { CID } from 'multiformats/cid'
import type { Subscription } from 'rxjs'
import { StreamID } from '@ceramicnetwork/streamid'
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
   * @param conflictResolution - currently used instance of ConflictResolution
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
    public conflictResolution: ConflictResolution,
    private readonly logger: DiagnosticsLogger,
    private readonly _index: LocalIndexApi,
    private readonly internals: RepositoryInternals,
    private readonly anchorRequestCarBuilder: AnchorRequestCarBuilder
  ) {}

  /**
   * Apply options relating to authoring a new commit
   *
   * @param state$ - Running State
   * @param opts - Initialization options (request anchor, publish to pubsub, etc.)
   * @param opType - If we load, create or update a stream
   * @private
   */
  async applyWriteOpts(
    state$: RunningState,
    opts: CreateOpts | UpdateOpts,
    opType: OperationType
  ): Promise<void> {
    const anchor = (opts as any).anchor
    const publish = (opts as any).publish
    if (anchor) {
      await this.anchor(state$, opts)
    }
    if (publish && opType !== OperationType.LOAD) {
      this.internals.publishTip(state$)
    }
  }

  /**
   * Request anchor for the latest stream state
   */
  async anchor(state$: RunningState, opts: AnchorOpts): Promise<Subscription> {
    if (!this.anchorService) {
      throw new Error(`Anchor requested for stream ${state$.id} but anchoring is disabled`)
    }
    if (state$.value.anchorStatus == AnchorStatus.ANCHORED) {
      return
    }

    const carFile = await this.anchorRequestCarBuilder.build(state$.id, state$.tip)
    const genesisCID = state$.value.log[0].cid
    const genesisCommit = carFile.get(genesisCID)
    await this._saveAnchorRequestForState(state$, genesisCommit)

    const anchorStatus$ = await this.anchorService.requestAnchor(
      carFile,
      opts.waitForAnchorConfirmation
    )
    return this.internals.processAnchorResponse(state$, anchorStatus$)
  }

  private async _saveAnchorRequestForState(
    state$: RunningState,
    genesisCommit: GenesisCommit
  ): Promise<void> {
    await this.anchorRequestStore.save(state$.id, {
      cid: state$.tip,
      timestamp: Date.now(),
      genesis: genesisCommit,
    })
  }
}
