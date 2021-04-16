import { Observable, of } from 'rxjs';
import { DocState, RunningStateLike } from '@ceramicnetwork/common';
import { StreamID } from '@ceramicnetwork/streamid';

/**
 * Snapshot of a document state at some commit. Unlike `RunningState` this can not be updated.
 * Only a subset of operations could be performed with an instance of SnapshotState, like
 * `StateManager#rewind` or `StateManager#atTime`.
 */
export class SnapshotState extends Observable<DocState> implements RunningStateLike {
  readonly id: StreamID;
  readonly state: DocState;

  constructor(readonly value: DocState) {
    super((subscriber) => {
      of(value).subscribe(subscriber);
    });
    this.state = value;
    this.id = new StreamID(this.state.type, this.state.log[0].cid);
  }

  next(value: DocState): void {
    throw new Error('Snapshot can not be updated');
  }
}
