import { BehaviorSubject } from 'rxjs';
import { DocState } from './doctype';
import { DoctypeUtils } from './utils/doctype-utils';

/**
 * BehaviourSubject<DocState> that emits only distinct values.
 */
export class DocStateSubject extends BehaviorSubject<DocState> {
  next(next: DocState) {
    const current = this.value;
    if (!DoctypeUtils.statesEqual(current, next)) {
      super.next(next);
    }
  }
}
