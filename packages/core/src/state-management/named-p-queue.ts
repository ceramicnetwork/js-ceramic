import PQueue from 'p-queue';
import { Mutex } from 'await-semaphore';

/**
 * Set of named PQueues.
 * When a task is done, it checks for pending tasks. No pending tasks means PQueue for the name is cleared.
 */
export class NamedPQueue {
  #lanes: Map<string, PQueue>;
  #operations: Mutex = new Mutex();

  constructor(lanes: Map<string, PQueue> = new Map()) {
    this.#lanes = lanes;
  }

  /**
   * Get a queue: return existing one, or create new.
   *
   * There can only be one `queue` or `remove` operation running at a time.
   */
  private queue(name: string): Promise<PQueue> {
    return this.#operations.use(async () => {
      const found = this.#lanes.get(name);
      if (found) {
        return found;
      } else {
        const queue = new PQueue({ concurrency: 1 });
        this.#lanes.set(name, queue);
        return queue;
      }
    });
  }

  /**
   * Remove a queue. Called after a task is done.
   *
   * There can only be one `queue` or `remove` operation running at a time.
   */
  private remove(name: string): Promise<void> {
    return this.#operations.use(async () => {
      const found = this.#lanes.get(name);
      if (found && found.size === 0) {
        this.#lanes.delete(name);
      }
    });
  }

  /**
   * Add task to the queue.
   *
   * All the tasks added under the same name are executed sequentially.
   * Tasks with different names are executed in parallel.
   *
   * Returns result of the task execution.
   */
  async add<A>(name: string, f: () => Promise<A>): Promise<A> {
    const queue = await this.queue(name);
    return queue.add(f).then(async (result) => {
      await this.remove(name);
      return result;
    });
  }
}
