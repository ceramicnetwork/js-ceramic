import { Observer, Subject } from 'rxjs'

/**
 * Kind of AbortController.signal used to indicate of a Ceramic instance is about to shutdown.
 *
 * Unlike native AbortController and AbortSignal, ShutdownSignal do not limit number of subscribers.
 */
export class ShutdownSignal {
  private subject: Subject<void> = new Subject()

  /**
   * Subscribers to the signal.
   */
  get observers(): Array<Observer<void>> {
    return this.subject.observers
  }

  /**
   * Send "abort" signal to the subscribers.
   */
  abort(): void {
    this.subject.complete()
  }

  /**
   * Pass a shutdown signal to a function using `AbortSignal`.
   *
   * If ShutdownSignal is aborted, or when it is aborted, the passed AbortSignal gets aborted as well.
   */
  abortable<T>(fn: (abortSignal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController()
    const onAbort = () => {
      controller.abort()
    }
    const subscription = this.subject.subscribe({
      complete: () => {
        onAbort()
      },
    })
    if (this.subject.isStopped) controller.abort()
    return fn(controller.signal).finally(() => {
      subscription.unsubscribe()
    })
  }
}
