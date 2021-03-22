import { DocState, RunningStateLike } from '@ceramicnetwork/common';
import { Observable } from 'rxjs';
import { DocID } from '@ceramicnetwork/docid';
import { filter, tap } from 'rxjs/operators';

export class StateLink extends Observable<DocState> implements RunningStateLike {
  constructor(private _state: DocState, feed$: Observable<DocState>) {
    super((subscriber) => {
      feed$
        .pipe(
          filter((state) => state.log[0].cid.equals(_state.log[0].cid)),
          tap((state) => (this._state = state)),
        )
        .subscribe(subscriber);
    });
  }

  get state(): DocState {
    return this._state;
  }

  get value(): DocState {
    return this._state;
  }

  get id(): DocID {
    return new DocID(this.state.doctype, this.state.log[this.state.log.length - 1].cid);
  }
}
