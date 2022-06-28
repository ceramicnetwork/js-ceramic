import { timer, fromEvent, merge, Subscription } from 'rxjs'
import { first } from 'rxjs/operators'

export function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()

  if (signals.length === 0) {
    throw Error('Need abort signals to create a merged abort signal')
  }

  if (signals.some((signal) => signal.aborted)) {
    controller.abort()
    return controller.signal
  }

  merge(...signals.map((signal) => fromEvent(signal, 'abort')))
    .pipe(first())
    .subscribe(() => {
      controller.abort()
    })

  return controller.signal
}
export class TimedAbortSignal {
  private readonly _subscription: Subscription
  readonly signal: AbortSignal

  constructor(timeout: number) {
    const controller = new AbortController()
    this.signal = controller.signal

    if (timeout <= 0) {
      controller.abort()
      return
    }

    this._subscription = timer(timeout).subscribe(() => {
      controller.abort()
    })
  }

  clear() {
    this._subscription?.unsubscribe()
  }
}

/**
 * Call a function with abort signal and clear the memory.
 *
 * Some functions do not clear a signal listener after successful execution. By wrapping the original AbortSignal (which may be long-lived) in a temporary AbortSignal that we can throw out when `fn` completes, we make sure
 * a function we call does not leave stuff in memory.
 * @param original Original AbortSignal.
 * @param fn Function that uses an AbortSignal.
 */
export async function abortable<T>(
  original: AbortSignal,
  fn: (abortSignal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController()
  const onAbort = () => {
    controller.abort()
  }
  original.addEventListener('abort', onAbort)
  if (original.aborted) controller.abort()
  return fn(controller.signal).finally(() => {
    original.removeEventListener('abort', onAbort)
  })
}
