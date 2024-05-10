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
import { TaskQueue } from '../ancillary/task-queue.js'
import { abortSignalToPromise } from '../utils.js'

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

  /**
   * Returns true if resolved without an error.
   */
  isResolved = false

  constructor() {
    let dResolve: Deferred<T>['resolve']
    let dReject: Deferred<T>['reject']

    const promise = new Promise<T>((resolve, reject) => {
      dResolve = (...args) => {
        this.isResolved = true
        resolve(...args)
      }
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

  #toUniqueString: (value: T) => string

  readonly #taskQueue: TaskQueue

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
    this.#processing = undefined
    this.#abortController = new AbortController()
    this.#toUniqueString = toUniqueString
    this.#taskQueue = new TaskQueue(concurrencyLimit)
  }

  /**
   * Start the loop processing.  Returns a promise that resolves when the loop completes.
   */
  start(): Promise<void> {
    const waitForAbortSignal = abortSignalToPromise(this.#abortController.signal)
    const doneOnAbortSignal = waitForAbortSignal.then(() => {
      return { done: true, value: undefined }
    })
    const processing = async (): Promise<void> => {
      let isDone = false
      const taskIds = new Set<string>()
      do {
        this.#taskQueue.add(async () => {
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
          if (taskIds.has(uniqueTaskId)) {
            // We have it processing already
            return
          }
          taskIds.add(uniqueTaskId)
          try {
            await Promise.race([this.handleValue(value), waitForAbortSignal])
          } catch (e) {
            this.#logger.err(`Error in ProcessingLoop: ${e}`)
            this.#abortController.abort('ERROR')
          } finally {
            taskIds.delete(uniqueTaskId)
          }
        })
        if (this.#taskQueue.size >= this.#taskQueue.concurrency) {
          await this.#taskQueue.onEmpty() // Wait for the queue to have room to take on more tasks
        }
      } while (!isDone)
      await this.#taskQueue.onIdle()
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
    await this.#taskQueue.onIdle()
    this.#processing = undefined
  }
}
