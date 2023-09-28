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

  constructor(
    source: AnchorProcessingLoop<T>['source'],
    onValue: AnchorProcessingLoop<T>['handleValue']
  ) {
    this.source = source
    this.handleValue = onValue
    this.#processing = undefined
    this.#defer = new Deferred()
  }

  start() {
    const processing = async (): Promise<void> => {
      try {
        let canContinue = true
        do {
          const next = await this.source.next()
          canContinue = !next.done
          if (!canContinue) break
          const value = next.value
          await this.handleValue(value)
        } while (canContinue)
        this.#defer.resolve()
      } catch (e) {
        this.#defer.reject(e)
      }
    }
    this.#processing = processing()
  }

  async stop() {
    await this.source.return(undefined)
    await this.#processing
    await this.#defer
  }
}
