import { timer, fromEvent, merge, Subscription } from 'rxjs'
import { first } from 'rxjs/operators'
import { polyfillAbortController } from '../polyfill-abort-controller.js'

polyfillAbortController()

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
