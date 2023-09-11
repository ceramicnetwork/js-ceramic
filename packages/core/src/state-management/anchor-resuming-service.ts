import type { Repository } from './repository.js'
import { LogStyle, type DiagnosticsLogger } from '@ceramicnetwork/common'
import { TaskQueue } from '../ancillary/task-queue.js'

// TODO: Increase concurrency and remove the delay between restoring each stream once we've
// optimized anchor polling so that the cost to js-ceramic for polling is constant (instead
// of scaling with the number of streams with pending anchors as it is today).
const RESUME_QUEUE_CONCURRENCY = 5
const RESUME_BATCH_SIZE = RESUME_QUEUE_CONCURRENCY * 5

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

  /**
   * Returns a random number between 10 and 50 representing the number of milliseconds to sleep
   * in between restoring each stream.  We want some randomness here to prevent many streams from
   * being on the same schedule such that they wind up polling the CAS at the exact same time.
   */
  getDelay() {
    return Math.floor(Math.random() * 40) + 10
  }

  async resumeRunningStatesFromAnchorRequestStore(repository: Repository): Promise<void> {
    if (this.#shouldBeClosed) {
      throw Error('This AnchorResumingService is closed, create a new instance to resume')
    }

    this.logger.imp(`Resuming polling for streams with pending anchors`)

    let numRestoredStreams = 0
    for await (const batch of repository.anchorRequestStore.list()) {
      for (const item of batch) {
        if (this.#shouldBeClosed) return
        this.resumeQ.add(async () => {
          await repository.fromMemoryOrStore(item.key)
          this.logger.verbose(`Resumed running state for stream id: ${item.key}`)
          numRestoredStreams++
        })
        await this.delay(this.getDelay())
      }
      await this.resumeQ.onIdle()
    }

    this.logger.imp(
      `Finished resuming polling for ${numRestoredStreams} streams which had pending anchors`
    )
  }

  async close(): Promise<void> {
    this.logger.debug('Closing AnchorResumingService')
    this.#shouldBeClosed = true
    await this.resumeQ.onIdle()
    this.logger.debug('Waiting for remaining AnchorResumingService tasks to stop')
    await this.resumeQ.onIdle()
    this.logger.debug('AnchorResumingService closed')
  }
}
