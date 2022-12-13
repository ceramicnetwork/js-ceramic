import { StreamID } from '@ceramicnetwork/streamid'
import { AnchorRequestStoreListResult } from '../store/anchor-request-store.js'
import { AnchorStatus, DiagnosticsLogger, LogStyle, SyncOptions } from '@ceramicnetwork/common'
import { Repository } from './repository.js'
import PQueue from 'p-queue'

const RESUME_QUEUE_CONCURRENCY = 30
const RESUME_BATCH_SIZE = RESUME_QUEUE_CONCURRENCY * 5

export class AnchorResumingService {
  /**
   * Resume running states from anchor request store
   */
  readonly resumeQ: PQueue

  /**
   * true iff the repository is in the process of closing
   *
   * @private
   */
  #shouldBeClosed = false

  constructor(private readonly logger: DiagnosticsLogger) {
    this.resumeQ = new PQueue({ concurrency: RESUME_QUEUE_CONCURRENCY })
  }

  async resumeRunningStatesFromAnchorRequestStore(repository: Repository): Promise<void> {
    if (this.#shouldBeClosed) {
      throw Error('This AnchorResumingService is closed, create a new instance to resume')
    }

    let gt: StreamID | undefined = undefined
    let batch = new Array<AnchorRequestStoreListResult>()
    do {
      batch = await repository.anchorRequestStore.list(RESUME_BATCH_SIZE, gt)
      batch.map((listResult) => {
        this.resumeQ.add(async () => {
          try {
            await repository.fromMemoryOrStore(listResult.key)
            this.logger.log(
              LogStyle.verbose,
              `Resumed running state for stream id: ${listResult.key.toString()}`
            )
          } catch (error) {
            if (this.#shouldBeClosed) {
              this.logger.log(
                LogStyle.verbose,
                `Anthor Resuming Service threw an error after it was closed: ${error.toString()}`
              )
            } else {
              throw error
            }
          }
        })
      })
      gt = batch[batch.length - 1]?.key
    } while (batch.length > 0 && !this.#shouldBeClosed)
  }

  close(): void {
    this.#shouldBeClosed = true
    this.resumeQ.clear()
  }
}
