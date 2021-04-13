import { NamedTaskQueue } from './named-task-queue';
import { StreamID } from '@ceramicnetwork/streamid';
import { DiagnosticsLogger } from '@ceramicnetwork/common';
import { RunningState } from './running-state';

/**
 * Ensures tasks are executed sequentially.
 * Each task can accept currently running state.
 */
export interface ExecutionLane {
  /**
   * Add task to the execution lane, and disregard its result. Fire-and-forget semantics.
   */
  add: (task: (state$: RunningState) => Promise<void>) => void;

  /**
   * Add task to the execution lane. Return its result in Promise.
   * The point of `run` (as opposed to `add`) is to pass an error to the caller if it is throw inside a task.
   * Note "fire-and-forget" comment for the `doc` method.
   */
  run<T>(task: (state$: RunningState) => Promise<T>): Promise<T | undefined>;
}

/**
 * Serialize tasks running on the same document.
 * Ensure that a task is run with the currently available running state - either from memory or from state store.
 * This makes a task code simpler.
 */
export class ExecutionQueue {
  readonly tasks: NamedTaskQueue;

  constructor(logger: DiagnosticsLogger, readonly get: (streamId: StreamID) => Promise<RunningState>) {
    this.tasks = new NamedTaskQueue((error) => {
      logger.err(error);
    });
  }

  /**
   * Return execution lane for a document.
   */
  forDocument(streamId: StreamID): ExecutionLane {
    return {
      add: (task) => {
        return this.tasks.add(streamId.toString(), async () => {
          const doc = await this.get(streamId);
          if (doc) {
            await task(doc);
          }
        });
      },
      run: (task) => {
        return this.tasks.run(streamId.toString(), async () => {
          const doc = await this.get(streamId);
          if (doc) {
            return task(doc);
          }
        });
      },
    };
  }

  /**
   * Wait till all the tasks in all the lanes are done.
   */
  onIdle(): Promise<void> {
    return this.tasks.onIdle();
  }

  /**
   * Stop executing the tasks.
   */
  pause(): void {
    this.tasks.pause();
  }

  /**
   * Wait till the tasks are done, and prohibit adding more tasks.
   */
  async close() {
    await this.onIdle();
    this.pause();
  }
}
