import { BehaviorSubject } from 'rxjs';
import { DocState, DocStateHolder, DoctypeUtils } from '@ceramicnetwork/common';
import { DocID } from '@ceramicnetwork/docid';

export class RunningState extends BehaviorSubject<DocState> implements DocStateHolder {
  readonly id: DocID;

  constructor(initial: DocState) {
    super(initial);
    this.id = new DocID(initial.doctype, initial.log[0].cid);
  }

  next(next: DocState) {
    const current = this.value;
    if (!DoctypeUtils.statesEqual(current, next)) {
      super.next(next);
    }
  }

  get state() {
    return this.value;
  }
}
