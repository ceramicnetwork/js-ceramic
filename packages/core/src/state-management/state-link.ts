import { Observable, Subscription } from 'rxjs';
import { StreamID } from '@ceramicnetwork/streamid';
import { DocState, RunningStateLike, DocStateSubject } from '@ceramicnetwork/common';

/**
 * Maintain Stream state. Can be updated from inside, thus maintaining separate states per doctype instance.
 * If subscribed, gets external updates from `update$` feed.
 */
export class StateLink extends Observable<DocState> implements RunningStateLike {
  private readonly state$: DocStateSubject;

  /**
   * @param initial - initial state
   * @param update$ - external feed of DocState updates to this document
   */
  constructor(private readonly initial: DocState, update$?: (init: DocState) => Observable<DocState>) {
    super((subscriber) => {
      const update$S = update$ ? update$(this.state$.value).subscribe(this.state$) : Subscription.EMPTY;
      this.state$.subscribe(subscriber).add(() => {
        update$S.unsubscribe();
      });
    });
    this.state$ = new DocStateSubject(initial);
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

  get id(): StreamID {
    return new StreamID(this.state.doctype, this.state.log[this.state.log.length - 1].cid);
  }
}
