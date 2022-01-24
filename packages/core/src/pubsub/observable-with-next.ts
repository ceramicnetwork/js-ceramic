import { Observable, Subscription } from 'rxjs'

/**
 * An extension of Observable that also has a 'next' method which can be used to publish
 * new events into the Observable stream.
 */
export type ObservableWithNext<T> = Observable<T> & { next: (m: T) => Subscription }
