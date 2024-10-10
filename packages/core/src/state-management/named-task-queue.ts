import { noop, TaskQueue } from '../ancillary/task-queue.js'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'

const NAMED_TASK_QUEUE_SIZE = 'named_task_queue_size'
const NAMED_TASK_QUEUE_RUN = 'named_task_queue_run'
const NAMED_TASK_QUEUE_ADD = 'named_task_queue_add'
const NAMED_TASK_QUEUE_LARGE_SIZE = 'named_task_queue_large_size'
const LARGE_QUEUE_THRESHOLD = process.env.LARGE_QUEUE_THRESHOLD || 50

/**
 * Set of named PQueues.
 * When a task is done, it checks for pending tasks.
 * No pending tasks means PQueue for the name is removed and garbage collected.
 */
export class NamedTaskQueue {
  constructor(
    private readonly onError: (error: Error, retry: () => void) => void = noop,
    readonly lanes: Map<string, TaskQueue> = new Map()
  ) {}

  /**
   * Get a queue: return existing one, or create new.
   *
   * There can only be one `queue` or `remove` operation running at a time.
   */
  private queue(name: string): TaskQueue {
    const found = this.lanes.get(name)
    if (found) {
      return found
    } else {
      const queue = new TaskQueue(1, this.onError.bind(this))
      this.lanes.set(name, queue)
      return queue
    }
  }

  /**
   * Remove a queue. Called after a task is done.
   *
   * There can only be one `queue` or `remove` operation running at a time.
   */
  private remove(name: string): void {
    const found = this.lanes.get(name)
    if (found && found.size === 0) {
      this.lanes.delete(name)
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
  run<A>(name: string, task: () => Promise<A>): Promise<A> {
    const queue = this.queue(name)
    Metrics.observe(NAMED_TASK_QUEUE_SIZE, queue.size, {'method': 'run'})
    Metrics.count(NAMED_TASK_QUEUE_RUN, 1)
    // only log the names of queues over a threshold size
    if (queue.size > LARGE_QUEUE_THRESHOLD) {
        Metrics.observe(NAMED_TASK_QUEUE_LARGE_SIZE, queue.size, {'name': name, 'method': 'run'})
    }
    return queue.run(task).finally(() => {
      this.remove(name)
    })
  }

  /**
   * Add task to the queue, fire-and-forget semantics.
   *
   * All the tasks added under the same name are executed sequentially.
   * Tasks with different names are executed in parallel.
   */
  add(name: string, task: () => Promise<void>): void {
    const queue = this.queue(name)
    Metrics.observe(NAMED_TASK_QUEUE_SIZE, queue.size, {'method': 'add'})
    Metrics.count(NAMED_TASK_QUEUE_ADD, 1, { name: name })
    if (queue.size > LARGE_QUEUE_THRESHOLD) {
        Metrics.observe(NAMED_TASK_QUEUE_LARGE_SIZE, queue.size, {'name': name, 'method': 'add'})
    }

    queue.add(
      () => task(),
      () => this.remove(name)
    )
  }

  /**
   * Wait till all the present lanes are idle.
   */
  async onIdle(): Promise<void> {
    const lanes = Array.from(this.lanes.values())
    await Promise.all(lanes.map((lane) => lane.onIdle()))
  }

  async close() {
    await this.onIdle()
    this.pause()
  }

  pause(): void {
    const lanes = Array.from(this.lanes.values())
    lanes.map((l) => l.pause())
  }
}
