import { ProcessingLoop } from './processing-loop.js'
import type { CASClient } from './anchor-service.js'
import type { AnchorRequestStore } from '../store/anchor-request-store.js'
import { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import type { AnchorLoopHandler } from './anchor-service.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { NamedTaskQueue } from '../state-management/named-task-queue.js'
import type { StreamID } from '@ceramicnetwork/streamid'

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

  constructor(
    batchSize: number,
    cas: CASClient,
    store: AnchorRequestStore,
    logger: DiagnosticsLogger,
    eventHandler: AnchorLoopHandler,
    anchorStoreQueue: NamedTaskQueue
  ) {
    this.#anchorStoreQueue = anchorStoreQueue
    this.#loop = new ProcessingLoop(logger, store.infiniteList(batchSize), async (streamId) => {
      try {
        logger.debug(
          `Loading pending anchor metadata for Stream ${streamId} from AnchorRequestStore`
        )
        const entry = await store.load(streamId)
        logger.debug(`Pending anchor metadata for Stream ${streamId} loaded successfully`)
        logger.debug(
          `Polling CAS for anchor status for commit CID ${entry.cid} of Stream ${streamId}`
        )
        const event = await cas.getStatusForRequest(streamId, entry.cid).catch(async (error) => {
          logger.warn(`No request present on CAS for ${entry.cid} of ${streamId}: ${error}`)
          const requestCAR = await eventHandler.buildRequestCar(streamId, entry.cid)
          const creationResult = await cas.create(new AnchorRequestCarFileReader(requestCAR))
          logger.debug(
            `Successfully created request on the CAS for commit CID ${entry.cid} of Stream ${streamId}`
          )
          return creationResult
        })
        logger.debug(
          `Anchor status for commit CID ${entry.cid} of Stream ${streamId} polled successfully`
        )
        logger.debug(
          `Handling anchor event with status ${event.status} for commit CID ${entry.cid} of Stream ${streamId}`
        )
        const isTerminal = await eventHandler.handle(event)
        logger.debug(
          `Anchor event with status ${event.status} for commit CID ${entry.cid} of Stream ${streamId} handled successfully`
        )
        if (isTerminal) {
          logger.debug(`Removing entry from AnchorRequestStore for Stream ${streamId}`)
          // Remove iff tip stored equals to the tip we processed. Sort of Compare-and-Swap.
          await this.#anchorStoreQueue.run(streamId.toString(), async () => {
            const loaded = await store.load(streamId)
            if (loaded.cid.equals(entry.cid)) {
              await store.remove(streamId)
            }
          })
          logger.debug(`Entry from AnchorRequestStore for Stream ${streamId} removed successfully`)
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
    this.#loop.start()
  }

  /**
   * Stop looping.
   */
  async stop(): Promise<void> {
    return this.#loop.stop()
  }
}
