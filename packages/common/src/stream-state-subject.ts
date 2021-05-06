import { BehaviorSubject } from 'rxjs';
import { StreamState } from './stream';
import { StreamUtils } from './utils/stream-utils';

/**
 * BehaviourSubject<StreamState> that emits only distinct values.
 */
export class StreamStateSubject extends BehaviorSubject<StreamState> {
  next(next: StreamState) {
    const current = this.value;
    if (!StreamUtils.statesEqual(current, next)) {
      super.next(next);
    }
  }
}
