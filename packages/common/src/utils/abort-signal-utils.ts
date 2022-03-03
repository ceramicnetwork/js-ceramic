import { timer, fromEvent, merge } from 'rxjs'
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

export interface TimedAbortSignal {
  signal: AbortSignal
  clear: () => void
}

export function createTimedAbortSignal(timeout: number): TimedAbortSignal {
  const controller = new AbortController()

  const timerSubscription = timer(timeout).subscribe(() => {
    controller.abort()
  })

  return { signal: controller.signal, clear: () => timerSubscription.unsubscribe() }
}
