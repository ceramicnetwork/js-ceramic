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
import { Semaphore } from 'await-semaphore'

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
   * Stop promises in `#processing` by issuing abort signal.
   */
  #abortController: AbortController

  /**
   * Controls how many values can be processed concurrently
   */
  #semaphore: Semaphore

  /**
   * The tasks that are currently being processed, keyed by task id.
   */
  #runningTasks: Map<string, Promise<void>>

  #toUniqueString: (value: T) => string

  constructor(
    logger: DiagnosticsLogger,
    concurrencyLimit: number,
    source: ProcessingLoop<T>['source'],
    onValue: ProcessingLoop<T>['handleValue'],
    toUniqueString: (value: T) => string = String
  ) {
    this.source = source
    this.handleValue = onValue
    this.#logger = logger
    this.#semaphore = new Semaphore(concurrencyLimit)
    this.#processing = undefined
    this.#abortController = new AbortController()
    this.#runningTasks = new Map()
    this.#toUniqueString = toUniqueString
  }

  /**
   * Start the loop processing.  Returns a promise that resolves when the loop completes.
   */
  start(): Promise<void> {
    const waitForAbortSignal = new Promise<void>((resolve) => {
      if (this.#abortController.signal.aborted) {
        return resolve()
      }
      const done = () => {
        this.#abortController.signal.removeEventListener('abort', done)
        resolve()
      }
      this.#abortController.signal.addEventListener('abort', done)
    })
    const doneOnAbortSignal = waitForAbortSignal.then(() => {
      return { done: true, value: undefined }
    })
    const processing = async (): Promise<void> => {
      let isDone = false
      do {
        try {
          const release = await this.#semaphore.acquire()
          this.#logger.verbose(`ProcessingLoop: Fetching next event from source`)
          const next = await Promise.race([this.source.next(), doneOnAbortSignal])
          isDone = next.done
          if (isDone) return
          const value = next.value
          if (value === undefined) {
            this.#logger.verbose(`No value received in ProcessingLoop, skipping this iteration`)
            return
          }
          const uniqueTaskId = this.#toUniqueString(value)
          if (this.#runningTasks.has(uniqueTaskId)) {
            // We have it processing
            continue
          }

          const task = async () => {
            try {
              await Promise.race([this.handleValue(value), waitForAbortSignal])
            } catch (e) {
              this.#logger.err(`Error in ProcessingLoop: ${e}`)
              this.#abortController.abort('ERROR')
            } finally {
              this.#runningTasks.delete(uniqueTaskId)
              // Semaphore is released only when the actual work of processing the item is
              // complete.
              release()
            }
          }

          // It's important that the semaphore guards adding the task to the running task set,
          // so that we won't get more tasks created than the concurrency limit.
          this.#runningTasks.set(uniqueTaskId, task())
        } catch (e) {
          this.#logger.err(`Error in ProcessingLoop: ${e}`)
        }
      } while (!isDone)
      await Promise.all(this.#runningTasks.values())
      this.#logger.debug(`ProcessingLoop complete`)
    }
    this.#processing = processing()
    return this.#processing
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
    await Promise.all(this.#runningTasks.values())
    this.#processing = undefined
  }
}
