import { ProcessingLoop } from './processing-loop.js'
import type { CASClient } from './anchor-service.js'
import type {
  AnchorRequestStore,
  AnchorRequestStoreListResult,
} from '../store/anchor-request-store.js'
import { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import type { AnchorLoopHandler } from './anchor-service.js'
import type { DiagnosticsLogger } from '@ceramicnetwork/common'

export class AnchorProcessingLoop {
  #loop: ProcessingLoop<AnchorRequestStoreListResult>
  constructor(
    pollInterval: number,
    batchSize: number,
    cas: CASClient,
    store: AnchorRequestStore,
    logger: DiagnosticsLogger,
    eventHandler: AnchorLoopHandler
  ) {
    this.#loop = new ProcessingLoop(store.infiniteList(batchSize), async (entry) => {
      try {
        const event = await cas.get(entry.key, entry.value.cid).catch(async () => {
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
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    })
  }

  start(): void {
    this.#loop.start()
  }

  async stop(): Promise<void> {
    return this.#loop.stop()
  }
}
