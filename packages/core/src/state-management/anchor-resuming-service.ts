import type { StreamID } from '@ceramicnetwork/streamid'
import type { AnchorRequestStoreListResult } from '../store/anchor-request-store.js'
import type { Repository } from './repository.js'
import { LogStyle, type DiagnosticsLogger } from '@ceramicnetwork/common'
import { TaskQueue } from '../ancillary/task-queue.js'

// TODO: Increase concurrency and remove RATE_LIMIT_DELAY once we've optimized anchor polling
// so that the code to js-ceramic for polling is constant (instead of scaling with the number of
// streams with pending anchors as it is today).
const RESUME_QUEUE_CONCURRENCY = 5
const RESUME_BATCH_SIZE = RESUME_QUEUE_CONCURRENCY * 5
const RATE_LIMIT_DELAY = 100

export class AnchorResumingService {
  /**
   * Resume running states from anchor request store
   */
  readonly resumeQ: TaskQueue

  /**
   * true iff the repository is in the process of closing
   *
   * @private
   */
  #shouldBeClosed = false

  constructor(private readonly logger: DiagnosticsLogger) {
    this.resumeQ = new TaskQueue(RESUME_QUEUE_CONCURRENCY, (error) => {
      if (this.#shouldBeClosed) {
        logger.log(
          LogStyle.verbose,
          `Anchor Resuming Service threw an error after it was closed: ${error.toString()}`
        )
      } else {
        throw error
      }
    })
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async resumeRunningStatesFromAnchorRequestStore(repository: Repository): Promise<void> {
    if (this.#shouldBeClosed) {
      throw Error('This AnchorResumingService is closed, create a new instance to resume')
    }

    this.logger.imp(`Resuming polling for streams with pending anchors`)

    let numRestoredStreams = 0
    let gt: StreamID | undefined = undefined
    let batch = new Array<AnchorRequestStoreListResult>()
    do {
      batch = await repository.anchorRequestStore.list(RESUME_BATCH_SIZE, gt)
      for (const listResult of batch) {
        this.resumeQ.add(async () => {
          await repository.fromMemoryOrStore(listResult.key)
          this.logger.verbose(`Resumed running state for stream id: ${listResult.key.toString()}`)
          numRestoredStreams++
        })
        await this.delay(RATE_LIMIT_DELAY)
      }
      gt = batch[batch.length - 1]?.key
      await this.resumeQ.onIdle()
    } while (batch.length > 0 && !this.#shouldBeClosed)

    this.logger.imp(
      `Finished resuming polling for ${numRestoredStreams} streams which had pending anchors`
    )
  }

  async close(): Promise<void> {
    this.logger.debug('Closing AnchorResumingService')
    this.#shouldBeClosed = true
    this.resumeQ.clear()
    this.logger.debug('Waiting for remaining AnchorResumingService tasks to stop')
    await this.resumeQ.onIdle()
    this.logger.debug('AnchorResumingService closed')
  }
}
