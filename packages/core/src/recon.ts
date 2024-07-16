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
  takeUntil,
  Subscriber,
  TeardownLogic,
} from 'rxjs'

import {
  DiagnosticsLogger,
  FetchRequest,
  fetchJson,
  AbortOptions,
  Networks,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { Model } from '@ceramicnetwork/stream-model'
import { CID } from 'multiformats/cid'

const DEFAULT_POLL_INTERVAL = 1_000 // 1 seconds
// Note this limit is arbitrary. This limit represents the upper bound on being able to recover after being down
const FEED_LIMIT = 1000

/**
 * Configuration for the Recon API
 */
export type ReconApiConfig = {
  // Whether the Recon API is enabled
  enabled: boolean
  // URL of the Recon API or a promise that resolves to the URL
  url: string | Promise<string>
  // Whether the event feed is enabled
  feedEnabled: boolean
  /// which network are we configured to use
  network: Networks
}

/**
 * Recon Event
 */
export interface ReconEvent {
  cid: CID
  data: CAR | null
}

/**
 * Recon Event Feed Response
 */
export interface ReconEventFeedResponse {
  events: Array<ReconEvent>
  cursor: string
}

/**
 * Recon API Interface
 */
export interface IReconApi extends Observable<ReconEventFeedResponse> {
  init(initialCursor?: string, initialInterests?: Array<StreamID>): Promise<void>
  registerInterest(model: StreamID, controller?: string): Promise<void>
  put(car: CAR, opts?: AbortOptions): Promise<void>
  enabled: boolean
  stop(): void
}

export class ReconApi extends Observable<ReconEventFeedResponse> implements IReconApi {
  readonly #config: ReconApiConfig
  readonly #logger: DiagnosticsLogger
  readonly #sendRequest: FetchRequest
  #url: string
  #initialized = false

  readonly #pollInterval: number
  #eventsSubscription: Subscription
  readonly #feed$: Subject<ReconEventFeedResponse> = new Subject()
  readonly #stopSignal: Subject<void> = new Subject<void>()

  constructor(
    config: ReconApiConfig,
    logger: DiagnosticsLogger,
    sendRequest: FetchRequest = fetchJson,
    pollInterval: number = DEFAULT_POLL_INTERVAL
  ) {
    super((subscriber: Subscriber<ReconEventFeedResponse>): TeardownLogic => {
      return this.#feed$.subscribe(subscriber)
    })

    this.#config = config
    this.#logger = logger
    this.#sendRequest = sendRequest
    this.#pollInterval = pollInterval
  }

  /**
   * Initialization tasks. Registers interest in the model and starts polling the feed for new events to emit to subscribers.
   * @param initialCursor
   * @returns
   */
  async init(initialCursor = '', initialInterests: Array<StreamID> = []): Promise<void> {
    if (this.#initialized) {
      return
    }

    this.#initialized = true

    if (!this.enabled) {
      return
    }

    this.#url = await this.#config.url
    await this.verifyNetwork()
    await this.registerInterest(Model.MODEL)

    for (const interest of initialInterests) {
      await this.registerInterest(interest)
    }

    if (this.#config.feedEnabled) {
      this.#eventsSubscription = this.createSubscription(initialCursor).subscribe(this.#feed$)
    }
  }

  private async verifyNetwork(): Promise<void> {
    let response
    try {
      response = await this.#sendRequest(this.#url + '/ceramic/network', {
        method: 'GET',
      })
    } catch (err) {
      this.#logger.warn(
        `Recon: failed to verify network with error ${err}. This is likely due to an older version of ceramic-one and you should upgrade.`
      )
      return
    }
    if (response?.name) {
      // this works for all types but is a bit odd for local which is 'local-X'
      // where X is the --local-network-id. As we either started the binary (in tests) and passed
      // in the network, or don't use it at all and just rely on c1, we're okay ignoring that piece
      if (!response.name.includes(this.#config.network)) {
        throw new Error(
          `Recon: failed to verify network as js-ceramic is using ${
            this.#config.network
          } but ceramic-one is on ${
            response.name
          }. Pass --network to the js-ceramic or ceramic-one daemon to make them match.`
        )
      }
    } else {
      throw new Error('Recon: failed to verify network as the response was empty')
    }
  }

  /**
   * Registers interest in a model
   * @param model stream id of the model to register interest in
   * @param controller restrict the interest range to just events with this controller
   */
  async registerInterest(model: StreamID, controller?: string): Promise<void> {
    if (!this.enabled) {
      throw new Error(`Recon: disabled, not registering interest in model ${model.toString()}`)
    }
    try {
      const headers = { 'Content-Type': 'application/json' }
      const body = { ...(controller && { controller }) }
      await this.#sendRequest(this.#url + `/ceramic/interests/model/${model.toString()}`, {
        method: 'POST',
        headers,
        body,
      })
      this.#logger.debug(`Recon: added interest for model ${model.toString()}`)
    } catch (err) {
      this.#logger.err(
        `Recon: failed to register interest in model ${model.toString()} with error ${err}`
      )
      throw err
    }
  }

  /**
   * Put an car representing an event to the Recon API
   * @param car CAR representing the event
   * @param opts Abort options
   * @returns
   */
  async put(car: CAR, opts: AbortOptions = {}): Promise<void> {
    const cid = car.roots[0]
    if (!this.enabled) {
      this.#logger.imp(`Recon: disabled, not putting event with cid ${cid.toString()}`)
      return
    }
    const body = {
      data: car.toString(),
    }
    try {
      await this.#sendRequest(this.#url + '/ceramic/events', {
        method: 'POST',
        body,
        signal: opts.signal,
      })
      this.#logger.debug(`Recon: put event with cid ${cid.toString()}`)
    } catch (err) {
      this.#logger.err(`Recon: failed to add event with cid ${cid.toString()} with error ${err}`)
      throw err
    }
  }

  /**
   * Whether the Recon API is enabled
   */
  get enabled(): boolean {
    return this.#config.enabled
  }

  /**
   * Stops the Recon API. This stops the polling and sends a complete signal to subscribers.
   */
  stop(): void {
    this.#stopSignal.next()
    this.#stopSignal.complete()
    if (this.#eventsSubscription) {
      this.#eventsSubscription.unsubscribe()
    }
    this.#feed$.complete()
  }

  /**
   * Polls the Recon API for new events using the feed endpoint. This is a turned into an observable that emits the events.
   * @param initialCursor The cursor to start polling from
   * @returns An observable that emits the events and cursor so it can be stored and used to resume polling during restart
   */
  private createSubscription(initialCursor: string): Observable<ReconEventFeedResponse> {
    // start event
    return of({ events: [], cursor: initialCursor, first: true }).pipe(
      // projects the starting event to an Observable that emits the next events. Then it recursively projects each event to an Observable that emits the next event
      expand((prev) => {
        // creates an observable that emits the next event after a certain delay (pollInterval) unless this is the first event
        return timer(prev.first ? 0 : this.#pollInterval).pipe(
          // concat map is used to ensure that the next event is only emitted after the previous event has been processed
          concatMap(() =>
            // defer allows lazy creation of the observable
            defer(async () => {
              const response = await this.#sendRequest(
                this.#url + `/ceramic/feed/events?resumeAt=${prev.cursor}&limit=${FEED_LIMIT}`,
                {
                  method: 'GET',
                }
              )
              return {
                events: response.events.map(({ id }) => {
                  return {
                    cid: CID.parse(id),
                    data: null,
                  }
                }),
                cursor: response.resumeToken,
                first: false,
              }
            }).pipe(
              // if the request fails retry after a certain delay (pollInterval)
              retry({
                delay: (err) => {
                  this.#logger.warn(
                    `Recon: event feed failed, due to error ${err}; attempting to retry in ${
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
      // filter out events with no data
      filter(({ events }) => events.length > 0),
      // stop the polling when the stop signal is emitted
      takeUntil(this.#stopSignal)
    )
  }
}
