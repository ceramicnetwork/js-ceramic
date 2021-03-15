import { NamedTaskQueue } from './named-task-queue';
import { DocID } from '@ceramicnetwork/docid';
import { Task, TaskQueueLike } from '../pubsub/task-queue';
import { DiagnosticsLogger } from '@ceramicnetwork/logger';

export class ExecutionQueue {
  readonly tasks: NamedTaskQueue;

  constructor(logger: DiagnosticsLogger) {
    this.tasks = new NamedTaskQueue((error) => {
      logger.err(error);
    });
  }

  forDocument(docId: DocID): TaskQueueLike {
    const add = (task: Task<void>) => {
      return this.tasks.add(docId.toString(), task);
    };
    const run = <T>(task: Task<T>): Promise<T> => {
      return this.tasks.run(docId.toString(), task);
    };
    return {
      add: add.bind(this),
      run: run.bind(this),
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
