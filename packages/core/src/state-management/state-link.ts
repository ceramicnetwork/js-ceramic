import { BehaviorSubject, Observable } from 'rxjs';
import { DocID } from '@ceramicnetwork/docid';
import { DocState, RunningStateLike } from '@ceramicnetwork/common';

/**
 * Maintain Doctype state. Can be updated from inside, thus maintaining separate states per doctype.
 * If subscribed, gets external updates from `update$` feed.
 */
export class StateLink extends Observable<DocState> implements RunningStateLike {
  private readonly state$: BehaviorSubject<DocState>;

  constructor(private readonly initial: DocState, update$: Observable<DocState>) {
    super((subscriber) => {
      const update$S = update$.subscribe(this.state$);
      this.state$.subscribe(subscriber).add(() => {
        update$S.unsubscribe();
      });
    });
    this.state$ = new BehaviorSubject(initial);
  }

  next(state: DocState): void {
    this.state$.next(state);
  }

  get state(): DocState {
    return this.state$.value;
  }

  get value(): DocState {
    return this.state$.value;
  }

  get id(): DocID {
    return new DocID(this.state.doctype, this.state.log[this.state.log.length - 1].cid);
  }
}
