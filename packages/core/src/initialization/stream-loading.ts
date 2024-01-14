import { StreamUpdater } from '../stream-loading/stream-updater.js'
import { StreamLoader } from '../stream-loading/stream-loader.js'
import type { DiagnosticsLogger, StreamReaderWriter } from '@ceramicnetwork/common'
import { Dispatcher } from '../dispatcher.js'
import { AnchorTimestampExtractor } from '../stream-loading/anchor-timestamp-extractor.js'
import { TipFetcher } from '../stream-loading/tip-fetcher.js'
import { LogSyncer } from '../stream-loading/log-syncer.js'
import { StateManipulator } from '../stream-loading/state-manipulator.js'
import { AnchorValidator } from '../anchor/anchor-service.js'
import { HandlersMap } from '../handlers-map.js'

export function makeStreamLoaderAndUpdater(
  logger: DiagnosticsLogger,
  dispatcher: Dispatcher,
  anchorValidator: AnchorValidator,
  api: StreamReaderWriter,
  streamHandlers: HandlersMap
): [StreamLoader, StreamUpdater] {
  const anchorTimestampExtractor = new AnchorTimestampExtractor(logger, dispatcher, anchorValidator)
  const tipFetcher = new TipFetcher(dispatcher.messageBus)
  const logSyncer = new LogSyncer(dispatcher)
  const stateManipulator = new StateManipulator(logger, streamHandlers, logSyncer, api)
  const streamLoader = new StreamLoader(
    logger,
    tipFetcher,
    logSyncer,
    anchorTimestampExtractor,
    stateManipulator
  )
  const streamUpdater = new StreamUpdater(
    logger,
    dispatcher,
    logSyncer,
    anchorTimestampExtractor,
    stateManipulator
  )
  return [streamLoader, streamUpdater]
}
