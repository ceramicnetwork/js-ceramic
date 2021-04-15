import { Observable, Subscription } from 'rxjs';
import { StreamID } from '@ceramicnetwork/streamid';
import { StreamState, RunningStateLike, StreamStateSubject } from '@ceramicnetwork/common';

/**
 * Maintain Stream state. Can be updated from inside, thus maintaining separate states per doctype instance.
 * If subscribed, gets external updates from `update$` feed.
 */
export class StateLink extends Observable<StreamState> implements RunningStateLike {
  private readonly state$: StreamStateSubject;

  /**
   * @param initial - initial state
   * @param update$ - external feed of StreamState updates to this document
   */
  constructor(private readonly initial: StreamState, update$?: (init: StreamState) => Observable<StreamState>) {
    super((subscriber) => {
      const update$S = update$ ? update$(this.state$.value).subscribe(this.state$) : Subscription.EMPTY;
      this.state$.subscribe(subscriber).add(() => {
        update$S.unsubscribe();
      });
    });
    this.state$ = new StreamStateSubject(initial);
  }

  next(state: StreamState): void {
    this.state$.next(state);
  }

  get state(): StreamState {
    return this.state$.value;
  }

  get value(): StreamState {
    return this.state$.value;
  }

  get id(): StreamID {
    return new StreamID(this.state.doctype, this.state.log[this.state.log.length - 1].cid);
  }
}
