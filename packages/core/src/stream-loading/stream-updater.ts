import { LogSyncer } from './log-syncer.js'
import { StateManipulator } from './state-manipulator.js'
import { AnchorTimestampExtractor } from './anchor-timestamp-extractor.js'
import { CeramicCommit, DiagnosticsLogger, StreamState, StreamUtils } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { applyTipToState } from './apply-tip-helper.js'

type CommitStorer = {
  storeCommit(
    data: any,
    eventHeight: number,
    streamId?: StreamID,
    controllers?: Array<string>,
    model?: StreamID
  ): Promise<CID>
}

/**
 * Class to contain all the logic for updating new commits to a stream.  It notably however does not
 * manage the persistence of the state information, nor updating the cache or indexing. It is
 * purely stateless.
 */
export class StreamUpdater {
  constructor(
    private readonly logger: DiagnosticsLogger,
    private readonly commitStorer: CommitStorer,
    private readonly logSyncer: LogSyncer,
    private readonly anchorTimestampExtractor: AnchorTimestampExtractor,
    private readonly stateManipulator: StateManipulator
  ) {}

  /**
   * Applies a tip that was learned about via the p2p network (ie from pubsub, ReCon, HDS, etc) to
   * the given StreamState.  Because it came from the network, we cannot trust that the tip is
   * actually a valid tip for the stream.  If it is not, we just return the same StreamState
   * unmodified.
   * @param state
   * @param tip
   */
  async applyTipFromNetwork(state: StreamState, tip: CID): Promise<StreamState> {
    return applyTipToState(
      this.logSyncer,
      this.anchorTimestampExtractor,
      this.stateManipulator,
      state,
      tip,
      {
        throwOnInvalidCommit: false,
        throwIfStale: false,
        throwOnConflict: false,
      }
    )
  }

  /**
   * Apply a commit that came in from an active application request via the HTTP client. Because
   * this write comes in from an active application session, we apply stricter rules to it and
   * throw errors in cases that might indicate an application bug - for instance if the write
   * is built on stale state in the client relative to what the server knows is the most current
   * state for the Stream.
   * @param state
   * @param commit
   */
  async applyCommitFromUser(state: StreamState, commit: CeramicCommit): Promise<StreamState> {
    const streamId = StreamUtils.streamIdFromState(state)
    const commitHeight = StreamUtils.getCommitHeight(state, commit)

    const commitCid = await this.commitStorer.storeCommit(
      commit,
      commitHeight,
      StreamUtils.streamIdFromState(state),
      state.metadata.controllers,
      state.metadata.model
    )
    this.logger.verbose(
      `StreamUpdater stored commit for stream ${streamId.toString()}, CID: ${commitCid.toString()}`
    )

    const updatedState = await applyTipToState(
      this.logSyncer,
      this.anchorTimestampExtractor,
      this.stateManipulator,
      state,
      commitCid,
      {
        throwOnInvalidCommit: true,
        throwIfStale: true,
        throwOnConflict: true,
      }
    )

    const newTip = StreamUtils.tipFromState(updatedState)
    this.logger.verbose(
      `StreamUpdater applied commit ${commitCid.toString()} to stream ${streamId.toString()}. New tip: ${newTip.toString()} `
    )

    return updatedState
  }
}
