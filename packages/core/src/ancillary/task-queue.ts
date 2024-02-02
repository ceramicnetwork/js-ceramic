import PQueue from 'p-queue'

export const noop = () => {
  // Do Nothing
}

export type Task<TaskResultType> = () => Promise<TaskResultType>

/**
 * TaskQueue aspect.
 */
export interface TaskQueueLike {
  /**
   * Add task to the queue, and disregard its result. Fire-and-forget semantics.
   *
   * @param task - task to run
   * @param onFinally - function to call when the task is finished, optional
   */
  add(task: Task<void>, onFinally?: () => void | Promise<void>): void

  /**
   * Add task to the queue. Return its result in Promise.
   * The point of `run` (as opposed to `add`) is to pass an error to the caller if it is throw inside a task.
   * Note "fire-and-forget" comment for the `add` method.
   */
  run<T>(task: Task<T>): Promise<T>
}

/**
 * PQueue with synchronous `add` and a common error-handler.
 */
export class TaskQueue implements TaskQueueLike {
  #pq: PQueue

  /**
   * Construct the queue.
   *
   * @param concurrency - Number of tasks allowed to run simultaneously.
   * @param onError - Common error handler for all the tasks, it is called whenever a task errors.
   *   The first parameter is an error object.
   *   The second parameter, if called, would re-add the task to the queue again.
   *   Useful if you know an error indicates another attempt to execute the task is necessary.
   */
  constructor(
    concurrency = 1,
    private readonly onError: (error: Error, retry: () => void) => void = noop
  ) {
    this.#pq = new PQueue({ concurrency: concurrency })
  }

  /**
   * Size of the queue. Counts both deferred and currently running tasks.
   */
  get size(): number {
    return this.#pq.size + this.#pq.pending
  }

  /**
   * Add task to queue. Fire-and-forget semantics.
   */
  add(task, onFinally?): void {
    this.run(task)
      .catch((error) => {
        this.onError(error, this.add.bind(this, task, onFinally))
      })
      .finally(() => onFinally?.())
  }

  /**
   * Add task and wait till it is completed.
   * The point of `run` (as opposed to `add`) is to pass an error to the caller if it is throw inside a task.
   * Note "fire-and-forget" comment for the `add` method.
   */
  run<T>(task: Task<T>): Promise<T> {
    return this.#pq.add(task) as Promise<T>
  }

  /**
   * Wait till all the tasks are completed.
   */
  onIdle(): Promise<void> {
    return this.#pq.onIdle()
  }

  /**
   * Clear the queue.
   */
  clear() {
    this.#pq.clear()
  }

  pause() {
    this.#pq.pause()
  }
}
