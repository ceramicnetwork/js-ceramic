import { LogSyncer } from './log-syncer.js'
import { StateManipulator } from './state-manipulator.js'
import { AnchorTimestampExtractor } from './anchor-timestamp-extractor.js'
import { CeramicCommit, DiagnosticsLogger, StreamState, StreamUtils } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { applyTipToState } from './apply-tip-helper.js'

interface CommitStorer {
  storeCommit(data: any, streamId?: StreamID): Promise<CID>
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
   *
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

  async applyCommitFromUser(state: StreamState, commit: CeramicCommit): Promise<StreamState> {
    const tip = await this.commitStorer.storeCommit(commit, StreamUtils.streamIdFromState(state))

    return applyTipToState(
      this.logSyncer,
      this.anchorTimestampExtractor,
      this.stateManipulator,
      state,
      tip,
      {
        throwOnInvalidCommit: true,
        throwIfStale: true,
        throwOnConflict: true,
      }
    )
  }
}
