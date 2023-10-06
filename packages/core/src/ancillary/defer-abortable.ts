import { Observable } from 'rxjs'

/**
 * Like `defer` from rxjs, but aborting the underlying function on unsubscribe.
 */
export function deferAbortable<T>(fn: (signal: AbortSignal) => Promise<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    const abortController = new AbortController()
    fn(abortController.signal)
      .then((value) => {
        subscriber.next(value)
        subscriber.complete()
      })
      .catch((error) => {
        subscriber.error(error)
      })
    return () => {
      abortController.abort()
    }
  })
}
