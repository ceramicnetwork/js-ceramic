import { ProcessingLoop } from './processing-loop.js'
import type { CASClient } from './anchor-service.js'
import type { AnchorRequestStore } from '../store/anchor-request-store.js'
import { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import type { AnchorLoopHandler } from './anchor-service.js'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { NamedTaskQueue } from '../state-management/named-task-queue.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import fs from 'fs';

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

  #successfulAnchors = 0
  #failedAnchors = 0
  #errAnchors = 0

  #startTime = null
  #endTime = null

  private loggingInterval

  constructor(
    batchSize: number,
    cas: CASClient,
    store: AnchorRequestStore,
    logger: DiagnosticsLogger,
    eventHandler: AnchorLoopHandler,
    anchorStoreQueue: NamedTaskQueue
  ) {

    const logFilePath = '/logs/metrics/metrics.log';
    this.loggingInterval = setInterval(() => {
      console.log(
        `Test1 : Successful Anchors : ${this.#successfulAnchors}, Failed Anchors : ${
          this.#failedAnchors
        }, Error Anchors : ${this.#errAnchors}`
      )
      const logData = `${new Date().toISOString()},${this.#successfulAnchors},${this.#failedAnchors},${this.#errAnchors}\n`;
      fs.appendFileSync(logFilePath, logData);
    }, 30000) // Log every 30 seconds

    this.#startTime = Date.now()
    this.#anchorStoreQueue = anchorStoreQueue
    this.#loop = new ProcessingLoop(logger, store.infiniteList(batchSize), (streamId) =>
      this.#anchorStoreQueue.run(streamId.toString(), async () => {
        try {
          const entry = await store.load(streamId)
          const event = await cas.getStatusForRequest(streamId, entry.cid).catch(async (error) => {
            logger.warn(`No request present on CAS for ${entry.cid} of ${streamId}: ${error}`)
            const requestCAR = await eventHandler.buildRequestCar(streamId, entry.cid)
            return cas.create(new AnchorRequestCarFileReader(requestCAR))
          })
          const isTerminal = await eventHandler.handle(event)
          if (isTerminal) {
            if (event.status === AnchorRequestStatusName.COMPLETED) {
              this.#successfulAnchors++
            } else if (event.status === AnchorRequestStatusName.FAILED) {
              this.#failedAnchors++
            }
            await store.remove(streamId)
          }
        } catch (err) {
          logger.err(
            `Error while processing entry from the AnchorRequestStore for StreamID ${streamId}: ${err}`
          )
          // Swallow the error and leave the entry in the store, it will get retries the next time through the loop.
          this.#errAnchors++
        }
      })
    )
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
    clearInterval(this.loggingInterval)
    return this.#loop.stop()
  }
}
