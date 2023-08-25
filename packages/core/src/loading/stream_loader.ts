import { LogSyncer } from './log_syncer.js'
import { TipFetcher } from './tip_fetcher.js'
import { StateManipulator } from './state_manipulator.js'
import {
  AnchorValidator,
  DiagnosticsLogger,
  StreamState,
  StreamUtils,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { IpfsInterface } from './ipfs_interface.js'
import { verifyAnchorAndApplyTimestamps } from '../conflict-resolution.js'
import { Dispatcher } from '../dispatcher.js'

export class StreamLoader {
  constructor(
    readonly logger: DiagnosticsLogger,
    readonly ipfsInterface: IpfsInterface,
    readonly tipFetcher: TipFetcher,
    readonly logSyncer: LogSyncer,
    readonly anchorValidator: AnchorValidator,
    readonly stateManipulator: StateManipulator
  ) {}

  async loadStream(streamID: StreamID, syncTimeoutSecs: number): Promise<StreamState> {
    const tip = await this.tipFetcher.findTip(streamID, syncTimeoutSecs)
    const logWithoutTimestamps = await this.logSyncer.syncFullLog(streamID, tip)
    const logWithTimestamps = await verifyAnchorAndApplyTimestamps(
      this.logger,
      this.ipfsInterface as Dispatcher, // todo remove typecast
      this.anchorValidator,
      logWithoutTimestamps.log
    )
    return await this.stateManipulator.applyFullLog({
      log: logWithTimestamps,
      anchorTimestampsValidated: true,
    })
  }

  async syncStream(state: StreamState, syncTimeoutSecs: number): Promise<StreamState> {
    const streamID = StreamUtils.streamIdFromState(state)
    const tip = await this.tipFetcher.findTip(streamID, syncTimeoutSecs)
    const logWithoutTimestamps = await this.logSyncer.syncLogUntil(
      streamID,
      tip,
      state.log[state.log.length - 1].cid
    )
    const logWithTimestamps = await verifyAnchorAndApplyTimestamps(
      this.logger,
      this.ipfsInterface as Dispatcher, // todo remove typecast
      this.anchorValidator,
      logWithoutTimestamps.log
    )
    return await this.stateManipulator.applyLogToState(state, {
      log: logWithTimestamps,
      anchorTimestampsValidated: true,
    })
  }
}
