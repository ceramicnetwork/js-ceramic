import PQueue from 'p-queue';

export const noop = () => {
  // Do Nothing
};

export type Task<TaskResultType> = () => Promise<TaskResultType>;

export interface TaskQueueLike {
  add(task: Task<void>): void;
  run<T>(task: Task<T>): Promise<T>;
}

/**
 * PQueue with synchronous `add` and a common error-handler.
 */
export class TaskQueue implements TaskQueueLike {
  #pq = new PQueue({ concurrency: 1 });

  /**
   * Construct the queue. `onError` is a common error-handler for all the tasks.
   * It is called when a task errors.
   * The first parameter is an error object.
   * The second parameter, if called, would re-add the task to the queue again.
   * Useful if you know an error indicates another attempt to execute the task is necessary.
   *
   * @param onError - Common error handler.
   */
  constructor(private readonly onError: (error: Error, retry: () => void) => void = noop) {}

  /**
   * Size of the queue. Counts both deferred and currently running tasks.
   */
  get size(): number {
    return this.#pq.size + this.#pq.pending;
  }

  /**
   * Add task to queue. Fire-and-forget semantics.
   */
  add(task: Task<void>): void {
    this.#pq.add(task).catch((error) => {
      const retry = () => this.add(task);
      this.onError(error, retry);
    });
  }

  /**
   * Add task and wait till it is completed.
   */
  run<T>(task: Task<T>): Promise<T> {
    return this.#pq.add(task);
  }

  /**
   * Wait till all the tasks are completed.
   */
  onIdle(): Promise<void> {
    return this.#pq.onIdle();
  }

  /**
   * Clear the queue.
   */
  clear() {
    this.#pq.clear();
  }

  pause() {
    this.#pq.pause()
  }
}
