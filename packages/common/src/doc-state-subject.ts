import { BehaviorSubject } from 'rxjs';
import { DocState } from './stream';
import { StreamUtils } from './utils/stream-utils';

/**
 * BehaviourSubject<DocState> that emits only distinct values.
 */
export class DocStateSubject extends BehaviorSubject<DocState> {
  next(next: DocState) {
    const current = this.value;
    if (!StreamUtils.statesEqual(current, next)) {
      super.next(next);
    }
  }
}
