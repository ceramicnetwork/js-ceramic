import { BehaviorSubject } from 'rxjs';
import { DocState, DocStateHolder } from '@ceramicnetwork/common';
import DocID from 'docid/lib';

export class RunningState extends BehaviorSubject<DocState> implements DocStateHolder {
  readonly id: DocID;

  constructor(initial: DocState) {
    super(initial);
    this.id = new DocID(initial.doctype, initial.log[0].cid);
  }

  get state() {
    return this.value;
  }
}
