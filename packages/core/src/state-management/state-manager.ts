import { Dispatcher } from '../dispatcher.js'
import { ExecutionQueue } from './execution-queue.js'
import { commitAtTime, ConflictResolution } from '../conflict-resolution.js'
import {
  AnchorService,
  AnchorStatus,
  CreateOpts,
  UpdateOpts,
  RunningStateLike,
  DiagnosticsLogger,
  StreamUtils,
  GenesisCommit,
  AnchorOpts,
} from '@ceramicnetwork/common'
import { RunningState } from './running-state.js'
import { CID } from 'multiformats/cid'
import type { Subscription } from 'rxjs'
import { SnapshotState } from './snapshot-state.js'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import type { LocalIndexApi } from '@ceramicnetwork/indexing'
import { AnchorRequestStore } from '../store/anchor-request-store.js'
import { CAR, CarBlock, CARFactory } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'
import { RepositoryInternals } from './repository-internals.js'

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

  markPinnedAndSynced(streamId: StreamID): void {
    this.internals.markPinnedAndSynced(streamId)
  }

  /**
   * Take the version of a stream state and a specific commit and returns a snapshot of a state
   * at the requested commit. If the requested commit is for a branch of history that conflicts with the
   * known commits, throw an error. If the requested commit is ahead of the currently known state
   * for this stream, emit the new state.
   *
   * @param state$ - Currently known state of the stream.
   * @param commitId - Requested commit.
   */
  async atCommit(state$: RunningStateLike, commitId: CommitID): Promise<SnapshotState> {
    return this.executionQ.forStream(commitId).run(async () => {
      const snapshot = await this.conflictResolution.snapshotAtCommit(state$.value, commitId)

      // If the provided CommitID is ahead of what we have in the cache, then we should update
      // the cache to include it.
      if (StreamUtils.isStateSupersetOf(snapshot, state$.value)) {
        state$.next(snapshot)
      }

      return new SnapshotState(snapshot)
    })
  }

  /**
   * Find the relevant AnchorCommit given a particular timestamp.
   * Will return an AnchorCommit whose timestamp is earlier to or
   * equal the requested timestamp.
   *
   * @param state$
   * @param timestamp - unix timestamp
   */
  atTime(state$: RunningStateLike, timestamp: number): Promise<SnapshotState> {
    const commitId = commitAtTime(state$, timestamp)
    return this.atCommit(state$, commitId)
  }

  /**
   * Apply options relating to authoring a new commit
   *
   * @param state$ - Running State
   * @param opts - Initialization options (request anchor, publish to pubsub, etc.)
   * @private
   */
  async applyWriteOpts(state$: RunningState, opts: CreateOpts | UpdateOpts): Promise<void> {
    const anchor = (opts as any).anchor
    const publish = (opts as any).publish
    if (anchor) {
      await this.anchor(state$, opts)
    }
    if (publish) {
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

    const cidToBlock = async (cid) => new CarBlock(cid, await this.dispatcher.getIpfsBlock(cid))

    // Genesis block
    const genesisCid = streamId.cid
    car.blocks.put(await cidToBlock(genesisCid))

    // Tip block
    car.blocks.put(await cidToBlock(tip))

    // Genesis Link Block
    const genesisCommit = car.get(genesisCid)
    if (StreamUtils.isSignedCommit(genesisCommit)) {
      car.blocks.put(await cidToBlock(genesisCommit.link))
    }

    // Tip Link Block
    const tipCommit = car.get(tip)
    if (StreamUtils.isSignedCommit(tipCommit)) {
      car.blocks.put(await cidToBlock(tipCommit.link))
      // Tip CACAO Block
      const tipCacaoCid = StreamUtils.getCacaoCidFromCommit(tipCommit)
      if (tipCacaoCid) {
        car.blocks.put(await cidToBlock(tipCacaoCid))
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
