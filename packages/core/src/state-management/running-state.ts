import { BehaviorSubject, Subscription, Subscribable, Observable, OperatorFunction, of } from 'rxjs';
import { DocState, DocStateHolder, DoctypeUtils } from '@ceramicnetwork/common';
import { DocID } from '@ceramicnetwork/docid';
import { SubscriptionSet } from '../subscription-set';
import CID from 'cids';

/**
 * `pipe` aspect of rxjs Observable.
 */
interface Pipeable<T> {
  pipe(): Observable<T>;
  pipe<A>(op1: OperatorFunction<T, A>): Observable<A>;
  pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): Observable<B>;
  pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): Observable<C>;
  pipe<A, B, C, D>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>): Observable<D>;
  pipe<A, B, C, D, E>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>): Observable<E>;
  pipe<A, B, C, D, E, F>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>): Observable<F>;
  pipe<A, B, C, D, E, F, G>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>): Observable<G>;
  pipe<A, B, C, D, E, F, G, H>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>): Observable<H>;
  pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>): Observable<I>;
  pipe<A, B, C, D, E, F, G, H, I>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>, op4: OperatorFunction<C, D>, op5: OperatorFunction<D, E>, op6: OperatorFunction<E, F>, op7: OperatorFunction<F, G>, op8: OperatorFunction<G, H>, op9: OperatorFunction<H, I>, ...operations: OperatorFunction<any, any>[]): Observable<{}>;
  toPromise<T>(this: Observable<T>): Promise<T>;
  toPromise<T>(this: Observable<T>, PromiseCtor: typeof Promise): Promise<T>;
  toPromise<T>(this: Observable<T>, PromiseCtor: PromiseConstructorLike): Promise<T>;
}

export interface RunningStateLike extends DocStateHolder, Subscribable<DocState>, Pipeable<DocState> {
  value: DocState;
}

export class RunningState extends BehaviorSubject<DocState> implements RunningStateLike {
  readonly id: DocID;
  readonly subscriptionSet: SubscriptionSet = new SubscriptionSet();

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

  get tip(): CID {
    return this.value.log[this.value.log.length - 1].cid;
  }

  get state() {
    return this.value;
  }

  /**
   * Track related subscription.
   */
  add(subscription: Subscription) {
    this.subscriptionSet.add(subscription);
  }

  /**
   * Mark the RunningState complete, closed, and unsubscribe from related subscriptions in subscriptionSet.
   */
  complete() {
    this.subscriptionSet.unsubscribe();
    super.complete();
  }
}
