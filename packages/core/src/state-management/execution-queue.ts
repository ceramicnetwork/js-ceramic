import { NamedTaskQueue } from './named-task-queue'
import { StreamID } from '@ceramicnetwork/streamid'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Semaphore } from 'await-semaphore'
import { Task, FromQueue, TaskQueue, TaskQueueLike } from '../pubsub/task-queue'

/**
 * Serialize tasks running on the same stream.
 * Ensure that a task is run with the currently available running state - either from memory or from state store.
 * This makes a task code simpler.
 */
export class ExecutionQueue {
  readonly tasks: NamedTaskQueue
  readonly semaphore: Semaphore

  constructor(concurrencyLimit: number, logger: DiagnosticsLogger) {
    this.tasks = new NamedTaskQueue((error) => {
      logger.err(error)
    })
    this.semaphore = new Semaphore(concurrencyLimit)
  }

  /**
   * Return execution lane for a stream.
   */
  forStream(streamId: StreamID): TaskQueueLike {
    return {
      add: (task: Task<void>) => {
        return this.tasks.add(streamId.toString(), (handle) => {
          return this.semaphore.use(() => task(handle))
        })
      },
      run: (task) => {
        return this.tasks.run(streamId.toString(), () => {
          return this.semaphore.use(() => task(new FromQueue()))
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
