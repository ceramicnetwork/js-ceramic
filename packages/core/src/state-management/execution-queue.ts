import { NamedTaskQueue } from './named-task-queue';
import { DocID } from '@ceramicnetwork/docid';
import { Task, TaskQueueLike } from '../pubsub/task-queue';
import { DiagnosticsLogger } from '@ceramicnetwork/logger';
import { RunningState } from './running-state';

export interface ExecLike extends TaskQueueLike {
  addE: (task: (state$: RunningState) => Promise<void>) => void;
  runE<T>(task: (state$: RunningState) => Promise<T>): Promise<T>;
}

export class ExecutionQueue {
  readonly tasks: NamedTaskQueue;

  constructor(logger: DiagnosticsLogger, readonly get: (docId: DocID) => Promise<RunningState>) {
    this.tasks = new NamedTaskQueue((error) => {
      logger.err(error);
    });
  }

  forDocument(docId: DocID): ExecLike {
    const add = (task: Task<void>) => {
      return this.tasks.add(docId.toString(), task);
    };
    const run = <T>(task: Task<T>): Promise<T> => {
      return this.tasks.run(docId.toString(), task);
    };
    return {
      add: add.bind(this),
      run: run.bind(this),
      addE: (task) => {
        add(async () => {
          const doc = await this.get(docId);
          if (doc) {
            await task(doc);
          }
        });
      },
      runE: (task) => {
        return run(async () => {
          const doc = await this.get(docId);
          return task(doc);
        });
      },
    };
  }

  onIdle(): Promise<void> {
    return this.tasks.onIdle();
  }

  pause(): void {
    this.tasks.pause();
  }

  async close() {
    await this.onIdle();
    this.pause();
  }
}
