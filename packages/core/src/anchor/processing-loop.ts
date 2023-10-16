/**
 * Deferred pattern is one of the most commonly used design patterns in JavaScript world and in programming in general.
 * It postpones the action to a later stage for whatever reason, but mostly because the expected value is not available yet.
 *
 * Unlike Promise that encapsulation fulfillment (resolve or reject) in `new Promise()`,
 * `Deferred` allows you to return promise, and then fulfill it manually.
 *
 * ```typescript
 * const promiseLike = new Deferred<T>() // Feel free to do whatever you like with it
 * // When you _want_ the promise to resolve, just pass a value:
 * promiseLike.resolve(value)
 * // Same with rejection:
 * promiseLike.reject(new Error("I am done"))
 * ```
 */
export class Deferred<T = void> implements PromiseLike<T> {
  /**
   * Resolve the promise manually.
   */
  readonly resolve: (t: T) => void

  /**
   * Reject the promise.
   */
  readonly reject: (e: Error) => void

  // Parts of Promise API
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

export class ProcessingLoop<T> {
  private readonly source: AsyncGenerator<T>
  private readonly handleValue: (value: T) => Promise<void>
  #processing: Promise<void> | undefined
  #deferred: Deferred
  #abortController: AbortController

  constructor(source: ProcessingLoop<T>['source'], onValue: ProcessingLoop<T>['handleValue']) {
    this.source = source
    this.handleValue = onValue
    this.#processing = undefined
    this.#deferred = new Deferred()
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
          await Promise.race([this.handleValue(value), abortion])
        } while (!isDone)
        this.#deferred.resolve()
      } catch (e) {
        this.#deferred.reject(e)
      }
    }
    this.#processing = processing()
  }

  async stop() {
    if (!this.#processing) return
    this.#abortController.abort('STOP')
    await this.source.return(undefined)
    await this.#processing
    await this.#deferred
    this.#processing = undefined
  }
}
