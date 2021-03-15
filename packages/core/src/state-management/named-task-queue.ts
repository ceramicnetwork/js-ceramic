import { TaskQueue } from '../pubsub/task-queue';

/**
 * Set of named PQueues.
 * When a task is done, it checks for pending tasks. No pending tasks means PQueue for the name is cleared.
 */
export class NamedTaskQueue {
  #lanes: Map<string, TaskQueue>;

  constructor(lanes: Map<string, TaskQueue> = new Map()) {
    this.#lanes = lanes;
  }

  /**
   * Get a queue: return existing one, or create new.
   *
   * There can only be one `queue` or `remove` operation running at a time.
   */
  private queue(name: string): TaskQueue {
    const found = this.#lanes.get(name);
    if (found) {
      return found;
    } else {
      const queue = new TaskQueue();
      this.#lanes.set(name, queue);
      return queue;
    }
  }

  /**
   * Remove a queue. Called after a task is done.
   *
   * There can only be one `queue` or `remove` operation running at a time.
   */
  private remove(name: string): void {
    const found = this.#lanes.get(name);
    if (found && found.size === 0) {
      this.#lanes.delete(name);
    }
  }

  /**
   * Add task to the queue, wait for the execution.
   *
   * All the tasks added under the same name are executed sequentially.
   * Tasks with different names are executed in parallel.
   *
   * Returns result of the task execution.
   */
  run<A>(name: string, f: () => Promise<A>): Promise<A> {
    const queue = this.queue(name);
    return queue.run(f).then(async (result) => {
      await this.remove(name);
      return result;
    });
  }

  /**
   * Add task to the queue, fire-and-forget semantics.
   *
   * All the tasks added under the same name are executed sequentially.
   * Tasks with different names are executed in parallel.
   */
  add(name: string, f: () => Promise<void>): void {
    const queue = this.queue(name);
    queue.add(async () => {
      await f();
      this.remove(name);
    });
  }
}
