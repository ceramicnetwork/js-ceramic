import { ProcessingLoop } from './processing-loop.js'
import type { CASClient } from './anchor-service.js'
import type {
  AnchorRequestStore,
  AnchorRequestStoreListResult,
} from '../store/anchor-request-store.js'
import { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import type { AnchorLoopHandler } from './anchor-service.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'

/**
 * Get anchor request entries from AnchorRequestStore one by one. For each entry, get CAS response,
 * and handle the response via `eventHandler.handle`.
 *
 * If CAS does not know about an anchor request, we consider it being not created previously for some reason.
 * We create a request on CAS then.
 */
export class AnchorProcessingLoop {
  #loop: ProcessingLoop<AnchorRequestStoreListResult>
  constructor(
    batchSize: number,
    cas: CASClient,
    store: AnchorRequestStore,
    logger: DiagnosticsLogger,
    eventHandler: AnchorLoopHandler
  ) {
    this.#loop = new ProcessingLoop(store.infiniteList(batchSize), async (entry) => {
      try {
        const event = await cas.getStatusForRequest(entry.key, entry.value.cid).catch(async () => {
          const requestCAR = await eventHandler.buildRequestCar(entry.key, entry.value.cid)
          return cas.create(new AnchorRequestCarFileReader(requestCAR), false)
        })
        const isTerminal = await eventHandler.handle(event)
        if (isTerminal) {
          // We might store a new entry during the processing, so we better check if the current entry is indeed terminal.
          const current = await store.load(entry.key)
          if (current.cid.equals(entry.value.cid)) {
            await store.remove(entry.key)
          }
        }
      } catch (e) {
        logger.err(e)
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
