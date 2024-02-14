import { type CAR } from 'cartonne'
import {
  Subject,
  defer,
  concatMap,
  expand,
  of,
  retry,
  timer,
  Observable,
  Subscription,
  filter,
  tap,
  takeUntil,
  Subscriber,
  TeardownLogic,
} from 'rxjs'

import { DiagnosticsLogger, FetchRequest, fetchJson, AbortOptions } from '@ceramicnetwork/common'
import { EventID, StreamID } from '@ceramicnetwork/streamid'
import { Model } from '@ceramicnetwork/stream-model'

const DEFAULT_POLL_INTERVAL = 1_000 // 1 seconds

/**
 * Configuration for the Recon API
 */
export type ReconApiConfig = {
  // Whether the Recon API is enabled
  enabled: boolean
  // URL of the Recon API or a promise that resolves to the URL
  url: string | Promise<string>

  feedEnabled: boolean
}

/**
 * Recon Event
 */
export interface ReconEvent {
  id: EventID
  data: CAR
}

export interface ReconEventFeedResponse {
  events: Array<ReconEvent>
  cursor: number
}

/**
 * Recon API Interface
 */
export interface IReconApi extends Observable<ReconEventFeedResponse> {
  init(initialCursor?: number): Promise<void>
  registerInterest(model: StreamID): Promise<void>
  put(event: ReconEvent, opts?: AbortOptions): Promise<void>
  enabled: boolean
  stop(): void
}

export class ReconApi extends Observable<ReconEventFeedResponse> implements IReconApi {
  readonly #config: ReconApiConfig
  readonly #logger: DiagnosticsLogger
  readonly #sendRequest: FetchRequest
  #url: string

  readonly #pollInterval: number
  readonly models = new Set()
  #eventsSubscription: Subscription
  private readonly feed$: Subject<ReconEventFeedResponse> = new Subject<ReconEventFeedResponse>()
  readonly #stopSignal: Subject<void> = new Subject<void>()

  constructor(
    config: ReconApiConfig,
    logger: DiagnosticsLogger,
    sendRequest: FetchRequest = fetchJson,
    pollInterval: number = DEFAULT_POLL_INTERVAL
  ) {
    super((subscriber: Subscriber<ReconEventFeedResponse>): TeardownLogic => {
      return this.feed$.subscribe(subscriber)
    })

    this.#config = config
    this.#logger = logger
    this.#sendRequest = sendRequest
    this.#pollInterval = pollInterval
  }

  async init(initialCursor = 0): Promise<void> {
    if (!this.enabled) {
      return
    }

    this.#url = await this.#config.url
    await this.registerInterest(Model.MODEL)

    if (this.#config.feedEnabled) {
      this.#eventsSubscription = this.createSubscription(initialCursor).subscribe(this.feed$)
    }
  }

  async registerInterest(model: StreamID): Promise<void> {
    if (!this.enabled) {
      throw new Error(`Recon: disabled, not registering interest in model ${model.toString()}`)
    }

    try {
      await this.#sendRequest(this.#url + `/ceramic/interests/model/${model.toString()}`, {
        method: 'POST',
      })
      this.#logger.debug(`Recon: added interest for model ${model.toString()}`)
    } catch (err) {
      this.#logger.err(
        `Recon: failed to register interest in model ${model.toString()} with error ${err}`
      )
      throw err
    }
  }

  async put(event: ReconEvent, opts: AbortOptions): Promise<void> {
    if (!this.enabled) {
      this.#logger.imp(`Recon: disabled, not putting event ${event.id}`)
      return
    }

    const body = {
      id: event.id.toString(),
      data: event.data.toString(),
    }
    try {
      await this.#sendRequest(this.#url + '/ceramic/events', {
        method: 'POST',
        body,
        signal: opts.signal,
      })
      this.#logger.debug(`Recon: put event ${event.id}`)
    } catch (err) {
      this.#logger.err(`Recon: failed to add event ${event.id} with error ${err}`)
      throw err
    }
  }

  get enabled(): boolean {
    return this.#config.enabled
  }

  stop(): void {
    this.#stopSignal.next()
    this.#stopSignal.complete()
    if (this.#eventsSubscription) {
      this.#eventsSubscription.unsubscribe()
    }
    this.feed$.complete()
  }

  private createSubscription(initialCursor: number): Observable<ReconEventFeedResponse> {
    return of({ events: [], cursor: initialCursor, first: true }).pipe(
      expand((prev) => {
        return timer(prev.first ? 0 : this.#pollInterval).pipe(
          concatMap(() =>
            defer(async () => {
              const response = await this.#sendRequest(
                this.#url + `/ceramic/feed/events?resumeAt=${prev.cursor}`,
                {
                  method: 'GET',
                }
              )
              return {
                events: response.events.map(({ id, data }) => {
                  return {
                    id: EventID.fromString(id),
                    data: undefined,
                  }
                }),
                cursor: Math.max(parseInt(response.resumeToken, 10), prev.cursor),
                first: false,
              }
            }).pipe(
              retry({
                delay: (err) => {
                  this.#logger.warn(
                    `Recon: event feed failed, due to connection error ${err}; attempting to retry in ${
                      this.#pollInterval
                    }ms`
                  )
                  return timer(this.#pollInterval)
                },
              })
            )
          )
        )
      }),
      filter(({ events }) => events.length > 0),
      takeUntil(this.#stopSignal)
    )
  }
}
