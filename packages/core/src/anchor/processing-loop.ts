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
import { DiagnosticsLogger } from '@ceramicnetwork/common'

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
  /**
   * Source of entries we process in a loop.
   */
  private readonly source: AsyncGenerator<T>

  /**
   * External action that processes an entry.
   */
  private readonly handleValue: (value: T) => Promise<void>

  #logger: DiagnosticsLogger

  /**
   * `for await ()` loop wrapped in a function. It resolves, when `source` reports it has no entries.
   * If absent, i.e. `undefined`, it means, we have not started processing the entries.
   */
  #processing: Promise<void> | undefined

  /**
   * Used to intercept fulfillment inside `#processing`. Node.js forces you to handle Promise errors by
   * issuing a warning to console. Passing an error to an instance of `Deferred` solves that.
   */
  #whenComplete: Deferred

  /**
   * Stop promises in `#processing` by issuing abort signal.
   */
  #abortController: AbortController

  constructor(
    logger: DiagnosticsLogger,
    source: ProcessingLoop<T>['source'],
    onValue: ProcessingLoop<T>['handleValue']
  ) {
    this.source = source
    this.handleValue = onValue
    this.#logger = logger
    this.#processing = undefined
    this.#whenComplete = new Deferred()
    this.#abortController = new AbortController()
  }

  start() {
    const rejectOnAbortSignal = new Promise<IteratorResult<T>>((resolve) => {
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
          const next = await Promise.race([this.source.next(), rejectOnAbortSignal])
          isDone = next.done
          if (isDone) break
          const value = next.value
          if (!value) {
            this.#logger.debug(`No value received in ProcessingLoop, skipping this iteration`)
            continue
          }
          await Promise.race([this.handleValue(value), rejectOnAbortSignal])
        } while (!isDone)
        this.#whenComplete.resolve()
        this.#logger.debug(`ProcessingLoop complete`)
      } catch (e) {
        this.#logger.err(`Error in ProcessingLoop: ${e}`)
        this.#whenComplete.reject(e)
      }
    }
    this.#processing = processing()
  }

  /**
   * Stop processing:
   * 1. Emit an abort signal to `#abortController`
   * 2. Command `source` that we are done.
   * 3. Wait till the processing is over.
   * 4. Clean up internal state.
   */
  async stop() {
    this.#logger.debug(`Stopping ProcessingLoop`)
    if (!this.#processing) return
    this.#abortController.abort('STOP')
    await this.source.return(undefined)
    await this.#processing
    await this.#whenComplete
    this.#processing = undefined
  }
}
