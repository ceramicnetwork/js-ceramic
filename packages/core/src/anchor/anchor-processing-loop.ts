export class Deferred<T = void> {
  readonly resolve: (t: T) => void
  readonly reject: (e: Error) => void
  readonly then: Promise<T>['then']
  readonly catch: Promise<T>['catch']

  constructor() {
    let dResolve: Deferred<T>['resolve']
    let dReject: Deferred<T>['reject']

    const promise = new Promise<T>((resolve, reject) => {
      dResolve = resolve
      dReject = reject
    })
    this.resolve = dResolve
    this.reject = dReject
    this.then = promise.then.bind(promise)
    this.catch = promise.catch.bind(promise)
  }
}

export class AnchorProcessingLoop<T> {
  private readonly source: AsyncGenerator<T>
  private readonly handleValue: (value: T) => Promise<void>
  #processing: Promise<void> | undefined
  #defer: Deferred
  #abortController: AbortController

  constructor(
    source: AnchorProcessingLoop<T>['source'],
    onValue: AnchorProcessingLoop<T>['handleValue']
  ) {
    this.source = source
    this.handleValue = onValue
    this.#processing = undefined
    this.#defer = new Deferred()
    this.#abortController = new AbortController()
  }

  start() {
    const abortion = new Promise<IteratorResult<T>>((resolve) => {
      if (this.#abortController.signal.aborted) {
        resolve({ done: true, value: undefined })
      }
      const done = () => {
        this.#abortController.signal.removeEventListener('abort', done)
        resolve({ done: true, value: undefined })
      }
      this.#abortController.signal.addEventListener('abort', done)
    })
    const processing = async (): Promise<void> => {
      try {
        let isDone = false
        do {
          const next = await Promise.race([this.source.next(), abortion])
          isDone = next.done
          if (isDone) break
          const value = next.value
          await this.handleValue(value)
        } while (!isDone)
        this.#defer.resolve()
      } catch (e) {
        this.#defer.reject(e)
      }
    }
    this.#processing = processing()
  }

  async stop() {
    this.#abortController.abort('STOP')
    await this.source.return(undefined)
    await this.#processing
    await this.#defer
  }
}
