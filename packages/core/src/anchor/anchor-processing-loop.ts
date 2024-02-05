import { ProcessingLoop } from './processing-loop.js'
import type { CASClient } from './anchor-service.js'
import type { AnchorRequestStore } from '../store/anchor-request-store.js'
import { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import type { AnchorLoopHandler } from './anchor-service.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { NamedTaskQueue } from '../state-management/named-task-queue.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { TimeableMetric, SinceField } from '@ceramicnetwork/observability'

const METRICS_REPORTING_INTERVAL_MS = 10000 // 10 second reporting interval

/**
 * Get anchor request entries from AnchorRequestStore one by one. For each entry, get CAS response,
 * and handle the response via `eventHandler.handle`.
 *
 * If CAS does not know about an anchor request, we consider it being not created previously for some reason.
 * We create a request on CAS then.
 */
export class AnchorProcessingLoop {
  readonly #loop: ProcessingLoop<StreamID>
  /**
   * Linearizes requests to AnchorRequestStore by stream id. Shared with the AnchorService.
   */
  readonly #anchorStoreQueue: NamedTaskQueue
  readonly #anchorPollingMetrics: TimeableMetric

  constructor(
    batchSize: number,
    cas: CASClient,
    store: AnchorRequestStore,
    logger: DiagnosticsLogger,
    eventHandler: AnchorLoopHandler,
    anchorStoreQueue: NamedTaskQueue
  ) {
    this.#anchorStoreQueue = anchorStoreQueue
    this.#anchorPollingMetrics = new TimeableMetric(
      SinceField.TIMESTAMP,
      'anchorPollingDelay',
      METRICS_REPORTING_INTERVAL_MS
    )
    this.#loop = new ProcessingLoop(logger, store.infiniteList(batchSize), async (streamId) => {
      try {
        logger.verbose(
          `Loading pending anchor metadata for Stream ${streamId} from AnchorRequestStore`
        )
        const entry = await store.load(streamId)
        const event = await cas.getStatusForRequest(streamId, entry.cid).catch(async (error) => {
          logger.warn(`No request present on CAS for ${entry.cid} of ${streamId}: ${error}`)
          const requestCAR = await eventHandler.buildRequestCar(streamId, entry.cid)
          return cas.create(new AnchorRequestCarFileReader(requestCAR))
        })
        const isTerminal = await eventHandler.handle(event)
        logger.verbose(
          `Anchor event with status ${event.status} for commit CID ${entry.cid} of Stream ${streamId} handled successfully`
        )
        if (isTerminal) {
          this.#anchorPollingMetrics.record(entry)
          // Remove iff tip stored equals to the tip we processed
          // Sort of Compare-and-Swap.
          await this.#anchorStoreQueue.run(streamId.toString(), async () => {
            const loaded = await store.load(streamId)
            if (loaded.cid.equals(entry.cid)) {
              await store.remove(streamId)
            }
          })
          logger.verbose(
            `Entry from AnchorRequestStore for Stream ${streamId} removed successfully`
          )
        }
      } catch (err) {
        logger.err(
          `Error while processing entry from the AnchorRequestStore for StreamID ${streamId}: ${err}`
        )
        // Swallow the error and leave the entry in the store, it will get retries the next time through the loop.
      }
    })
  }

  /**
   * Start looping.
   */
  start(): void {
    this.#anchorPollingMetrics.startPublishingStats()
    this.#loop.start()
  }

  /**
   * Stop looping.
   */
  async stop(): Promise<void> {
    this.#anchorPollingMetrics.stopPublishingStats()
    return this.#loop.stop()
  }
}
