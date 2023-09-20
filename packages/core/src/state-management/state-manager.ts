import { Dispatcher } from '../dispatcher.js'
import { ExecutionQueue } from './execution-queue.js'
import { ConflictResolution } from '../conflict-resolution.js'
import {
  AnchorOpts,
  AnchorService,
  AnchorStatus,
  CreateOpts,
  DiagnosticsLogger,
  GenesisCommit,
  StreamUtils,
  UpdateOpts,
} from '@ceramicnetwork/common'
import { RunningState } from './running-state.js'
import { CID } from 'multiformats/cid'
import type { Subscription } from 'rxjs'
import { StreamID } from '@ceramicnetwork/streamid'
import type { LocalIndexApi } from '@ceramicnetwork/indexing'
import { AnchorRequestStore } from '../store/anchor-request-store.js'
import { CAR, CARFactory } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'
import { RepositoryInternals } from './repository-internals.js'
import { OperationType } from './operation-type.js'

export class StateManager {
  private readonly carFactory = new CARFactory()

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
    private readonly internals: RepositoryInternals
  ) {
    this.carFactory.codecs.add(DAG_JOSE)
  }

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
   * Handles update. Update may come from the PubSub topic or from running a sync
   *
   * @param streamId
   * @param tip - Stream Tip CID
   * @param model - Model Stream ID
   */
  async handleUpdate(streamId: StreamID, tip: CID, model?: StreamID): Promise<void> {
    let state$ = await this.internals.fromMemoryOrStore(streamId)
    const shouldIndex = model && this._index.shouldIndexStream(model)
    if (!shouldIndex && !state$) {
      // stream isn't pinned or indexed, nothing to do
      return
    }

    if (!state$) {
      state$ = await this.internals.load(streamId)
    }
    this.executionQ.forStream(streamId).add(async () => {
      await this.internals.handleTip(state$, tip)
    })
    await this.internals.indexStreamIfNeeded(state$)
  }

  /**
   * Applies commit to the existing state
   *
   * @param streamId - Stream ID to update
   * @param commit - Commit data
   * @param opts - Stream initialization options (request anchor, wait, etc.)
   */
  async applyCommit(
    streamId: StreamID,
    commit: any,
    opts: CreateOpts | UpdateOpts
  ): Promise<RunningState> {
    this.logger.verbose(`StateManager apply commit to stream ${streamId.toString()}`)

    const state$ = await this.internals.load(streamId, opts)
    this.logger.verbose(`StateManager loaded state for stream ${streamId.toString()}`)

    return this.executionQ.forStream(streamId).run(async () => {
      const cid = await this.dispatcher.storeCommit(commit, streamId)
      this.logger.verbose(
        `StateManager stored commit for stream ${streamId.toString()}, CID: ${cid.toString()}`
      )

      await this.internals.handleTip(state$, cid, opts)
      this.logger.verbose(
        `StateManager handled tip for stream ${streamId.toString()}, CID: ${cid.toString()}`
      )
      return state$
    })
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

    const carFile = await this._buildAnchorRequestCARFile(state$.id, state$.tip)
    const genesisCID = state$.value.log[0].cid
    const genesisCommit = carFile.get(genesisCID)
    await this._saveAnchorRequestForState(state$, genesisCommit)

    const anchorStatus$ = await this.anchorService.requestAnchor(
      carFile,
      opts.waitForAnchorConfirmation
    )
    return this.internals.processAnchorResponse(state$, anchorStatus$)
  }

  private async _buildAnchorRequestCARFile(streamId: StreamID, tip: CID): Promise<CAR> {
    const car = this.carFactory.build()

    // Root block
    const timestampISO = new Date().toISOString()
    car.put(
      {
        timestamp: timestampISO,
        streamId: streamId.bytes,
        tip: tip,
      },
      { isRoot: true }
    )

    // Genesis block
    const genesisCid = streamId.cid
    car.blocks.put(await this.dispatcher.getIpfsBlock(genesisCid))

    // Tip block
    car.blocks.put(await this.dispatcher.getIpfsBlock(tip))

    // Genesis Link Block
    const genesisCommit = car.get(genesisCid)
    if (StreamUtils.isSignedCommit(genesisCommit)) {
      car.blocks.put(await this.dispatcher.getIpfsBlock(genesisCommit.link))
    }

    // Tip Link Block
    const tipCommit = car.get(tip)
    if (StreamUtils.isSignedCommit(tipCommit)) {
      car.blocks.put(await this.dispatcher.getIpfsBlock(tipCommit.link))
      // Tip CACAO Block
      const tipCacaoCid = StreamUtils.getCacaoCidFromCommit(tipCommit)
      if (tipCacaoCid) {
        car.blocks.put(await this.dispatcher.getIpfsBlock(tipCacaoCid))
      }
    }

    return car
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
