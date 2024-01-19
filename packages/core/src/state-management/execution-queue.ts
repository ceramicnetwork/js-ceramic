import { NamedTaskQueue } from './named-task-queue.js'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Semaphore } from 'await-semaphore'
import { TaskQueueLike } from '../ancillary/task-queue.js'

/**
 * Serialize tasks running on the same stream.
 * Ensure that a task is run with the currently available running state - either from memory or from state store.
 * This makes a task code simpler.
 */
export class ExecutionQueue {
  private readonly tasks: NamedTaskQueue
  private readonly semaphore: Semaphore
  private n = 0

  constructor(
    private readonly name: string,
    private readonly concurrencyLimit: number,
    private readonly logger: DiagnosticsLogger
  ) {
    this.tasks = new NamedTaskQueue((error) => {
      logger.err(error)
    })
    this.semaphore = new Semaphore(concurrencyLimit)
  }

  /**
   * Return execution lane for a stream.
   */
  forStream(streamId: StreamID | CommitID): TaskQueueLike {
    this.logger.debug(`EQ: Creating a ${this.name} queue for ${streamId}`)
    return {
      add: (task) => {
        this.n += 1
        const n = this.n
        this.logger.debug(`EQ: Added an ADD ${this.name}-${n} task for ${streamId}`)
        return this.tasks.add(streamId.toString(), () => {
          this.logger.debug(`EQ: Running an ADD ${this.name}-${n} task for ${streamId}`)
          if (this.semaphore.count == 0) {
            this.logger.warn(
              `${this.name} queue is full, over ${this.concurrencyLimit} pending requests found`
            )
          }
          return this.semaphore.use(async () => {
            this.logger.debug(`EQ: Starting an ADD ${this.name}-${n} task for ${streamId}`)
            const result = await task()
            this.logger.debug(`EQ: Finished an ADD ${this.name}-${n} task for ${streamId}`)
            return result
          })
        })
      },
      run: (task, label = '') => {
        this.n += 1
        const n = this.n
        this.logger.debug(`EQ: Adding a RUN ${this.name}-${n} task: ${label} : ${streamId}`)
        return this.tasks.run(streamId.toString(), () => {
          this.logger.debug(`EQ: Running a RUN ${this.name}-${n} task: ${label} : ${streamId}`)
          if (this.semaphore.count == 0) {
            this.logger.warn(
              `${this.name} queue is full, over ${this.concurrencyLimit} pending requests found`
            )
          }
          return this.semaphore.use(async () => {
            this.logger.debug(`EQ: Starting a RUN ${this.name}-${n} task: ${label} : ${streamId}`)
            const result = await task()
            this.logger.debug(`EQ: Finished a RUN ${this.name}-${n} task: ${label} : ${streamId}`)
            return result
          })
        })
      },
    }
  }

  /**
   * Wait till all the tasks in all the lanes are done.
   */
  onIdle(): Promise<void> {
    return this.tasks.onIdle()
  }

  /**
   * Stop executing the tasks.
   */
  pause(): void {
    this.tasks.pause()
  }

  /**
   * Wait till the tasks are done, and prohibit adding more tasks.
   */
  async close() {
    await this.onIdle()
    this.pause()
  }
}
