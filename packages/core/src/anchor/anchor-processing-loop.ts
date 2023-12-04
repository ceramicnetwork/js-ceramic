import { ProcessingLoop } from './processing-loop.js'
import type { CASClient } from './anchor-service.js'
import type {
  AnchorRequestStore,
  AnchorRequestStoreListResult,
} from '../store/anchor-request-store.js'
import { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import type { AnchorLoopHandler } from './anchor-service.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'
import type { NamedTaskQueue } from '../state-management/named-task-queue.js'

/**
 * Get anchor request entries from AnchorRequestStore one by one. For each entry, get CAS response,
 * and handle the response via `eventHandler.handle`.
 *
 * If CAS does not know about an anchor request, we consider it being not created previously for some reason.
 * We create a request on CAS then.
 */
export class AnchorProcessingLoop {
  readonly #loop: ProcessingLoop<AnchorRequestStoreListResult>
  readonly #queue: NamedTaskQueue

  constructor(
    batchSize: number,
    cas: CASClient,
    store: AnchorRequestStore,
    logger: DiagnosticsLogger,
    eventHandler: AnchorLoopHandler,
    queue: NamedTaskQueue
  ) {
    this.#queue = queue
    this.#loop = new ProcessingLoop(store.infiniteList(batchSize), (entry) =>
      this.#queue.run(entry.key.toString(), async () => {
        const event = await cas
          .getStatusForRequest(entry.key, entry.value.cid)
          .catch(async (error) => {
            logger.warn(
              `No request present on CAS for ${entry.value.cid} of ${entry.key}: ${error}`
            )
            const requestCAR = await eventHandler.buildRequestCar(entry.key, entry.value.cid)
            return cas.create(new AnchorRequestCarFileReader(requestCAR))
          })
        const isTerminal = await eventHandler.handle(event)
        if (isTerminal) {
          await store.remove(entry.key)
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
    return this.#loop.stop()
  }
}
