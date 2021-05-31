import { Observable, of } from 'rxjs';
import { StreamState, RunningStateLike } from '@ceramicnetwork/common';
import { StreamID } from '@ceramicnetwork/streamid';

/**
 * Snapshot of a stream state at some commit. Unlike `RunningState` this can not be updated.
 * Only a subset of operations could be performed with an instance of SnapshotState, like
 * `StateManager#rewind` or `StateManager#atTime`.
 */
export class SnapshotState extends Observable<StreamState> implements RunningStateLike {
  readonly id: StreamID;
  readonly state: StreamState;

  constructor(readonly value: StreamState) {
    super((subscriber) => {
      of(value).subscribe(subscriber);
    });
    this.state = value;
    this.id = new StreamID(this.state.type, this.state.log[0].cid);
  }

  next(value: StreamState): void {
    throw new Error('Snapshot can not be updated');
  }
}
