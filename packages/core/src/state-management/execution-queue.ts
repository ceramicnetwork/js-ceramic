import { NamedTaskQueue } from './named-task-queue.js'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Semaphore } from 'await-semaphore'
import { Task, TaskQueueLike } from '../ancillary/task-queue.js'

export class TaskGuard {}

export type GuardedTask<TaskResultType> = (guard: TaskGuard) => Promise<TaskResultType>
interface TaskQueueLikeWithGuard {
  add(task: GuardedTask<void>, onFinally?: () => void | Promise<void>): void
  run<T>(task: GuardedTask<T>): Promise<T>
}

/**
 * Serialize tasks running on the same stream.
 * Ensure that a task is run with the currently available running state - either from memory or from state store.
 * This makes a task code simpler.
 */
export class ExecutionQueue {
  private readonly tasks: NamedTaskQueue
  private readonly semaphore: Semaphore

  static #TASK_GUARD_INSTANCE = new TaskGuard()

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
  forStream(streamId: StreamID | CommitID): TaskQueueLikeWithGuard {
    return {
      add: (task: GuardedTask<any>) => {
        return this.tasks.add(streamId.toString(), () => {
          if (this.semaphore.count == 0) {
            this.logger.warn(
              `${this.name} queue is full, over ${this.concurrencyLimit} pending requests found`
            )
          }
          return this.semaphore.use(() => task(ExecutionQueue.#TASK_GUARD_INSTANCE))
        })
      },
      run: (task: GuardedTask<any>) => {
        return this.tasks.run(streamId.toString(), () => {
          if (this.semaphore.count == 0) {
            this.logger.warn(
              `${this.name} queue is full, over ${this.concurrencyLimit} pending requests found`
            )
          }
          return this.semaphore.use(() => task(ExecutionQueue.#TASK_GUARD_INSTANCE))
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
