import { EventID, StreamID } from '@ceramicnetwork/streamid'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { Repository } from './state-management/repository.js'
import * as ReconClient from 'zcgen-client'
import { Dispatcher } from './dispatcher.js'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { from, repeat, timer, switchMap, tap, Subscription } from 'rxjs'
import { retry } from 'rxjs/operators'

/**
 * Recon Event
 */
export interface Event {
  eventId: string
}

/**
 * Describes Recon Service API
 */
export interface ReconApi {
  readonly networkName: string
  /**
   * Recon subscription, subscribe by model
   */
  subscribe(model: string): Subscription
  /**
   * Add event to recon
   */
  addEvent(event: Event): Promise<void>
  /**
   * Unsubscribe to subscription by model
   */
  unsubscribe(model: string): void
  /**
   * Close and unsubscribe to all
   */
  close(): void
}

/**
 * Recon subscription manager, manages simple map of models to subscriptions
 */
export interface SubManager {
  /**
   * Add active subscription
   */
  add(model: string, sub: Subscription): void
  /**
   * Get subscription by model
   */
  get(model: string): Subscription | undefined
  /**
   * Unsubscribe
   */
  unsubscribe(model: string): void
  /**
   * Unsubscribe to all known subscriptions
   */
  close(): void
}

export class ReconSubManager implements SubManager {
  private readonly subscriptions: Record<string, Subscription>

  constructor(private readonly logger: DiagnosticsLogger) {
    this.subscriptions = {}
  }

  add(model: string, sub: Subscription): void {
    this.subscriptions[model] = sub
    this.logger.verbose(`Recon: subscription for model ${model} added`)
  }

  get(model: string): Subscription | undefined {
    return this.subscriptions[model]
  }

  unsubscribe(model: string): void {
    const sub = this.get(model)
    if (!sub) return
    sub.unsubscribe()
    delete this.subscriptions[model]
    this.logger.verbose(`Recon: unsubscribed for model ${model}`)
  }

  close(): void {
    Object.keys(this.subscriptions).forEach((model) => {
      this.unsubscribe(model)
    })
    this.logger.verbose(`Recon: closing, unsubscribed to all`)
  }
}

/**
 * Recon API
 */
export class ReconApiHTTP implements ReconApi {
  private readonly api: ReconClient.DefaultApi
  private readonly subscriptions: ReconSubManager

  constructor(
    url: string,
    readonly networkName: string,
    private readonly repository: Repository,
    private readonly dispatcher: Dispatcher,
    private readonly logger: DiagnosticsLogger
  ) {
    const baseServer = new ReconClient.ServerConfiguration(url, {})
    const config = ReconClient.createConfiguration({ baseServer })
    this.api = new ReconClient.DefaultApi(config)
    this.subscriptions = new ReconSubManager(logger)
  }

  subscribe(model: string): Subscription {
    if (this.subscriptions.get(model)) return this.subscriptions.get(model)

    let offset = 0
    const increaseOffset = (val: number): void => {
      offset += val
    }

    const obv$ = from(
      this.api.ceramicSubscribeSortKeySortValueGet(
        'model',
        model,
        undefined,
        undefined,
        offset,
        1000
      )
    ).pipe(
      tap((arr) => increaseOffset(arr.length)),
      switchMap(from),
      repeat({ delay: 200 }),
      retry({
        delay: (error, count) => {
          this.logger.warn(`Recon: subscription failed for model ${model}, attempting to retry`)
          // exp backoff, max 3 minutes
          return timer(count > 11 ? 3 * 60 * 1000 : 2 ^ (count * 100))
        },
        resetOnSuccess: true,
      })
    )

    // in future could return observable, handler added here to keep recon code together for now
    const sub = obv$.subscribe(this._eventHandler)
    this.subscriptions.add(model, sub)
    return sub
  }

  unsubscribe(model: string): void {
    this.subscriptions.unsubscribe(model)
  }

  close(): void {
    this.subscriptions.close()
  }

  // messy here, so that recon changes are minimized for now and uses existing apis,
  // model/streamids used for lots of caching, but could later be implemented w/o or recon based
  async _eventHandler(event: string): Promise<void> {
    const eventId = EventID.fromString(event)
    const commit = await this.dispatcher.retrieveCommit(eventId.event)

    let header, gcid
    if (commit.proof) {
      gcid = commit.id
    } else if (commit.id) {
      const genesis = await this.dispatcher.retrieveCommit(commit.id)
      header = genesis.header
      gcid = commit.id
    } else {
      header = commit.header
      gcid = eventId.event
    }

    const model = header ? StreamID.fromBytes(header.model) : undefined
    // assumes model instance
    const streamid = new StreamID(ModelInstanceDocument.STREAM_TYPE_ID, gcid)

    this.logger.verbose(`Recon: received eventID ${eventId.toString()} for streamId ${streamid}`)
    await this.repository.stateManager.handleUpdate(streamid, eventId.event, model)
  }

  async addEvent(event: Event): Promise<void> {
    try {
      await this.api.ceramicEventsPost(event)
      this.logger.verbose(`Recon: added event ${event.eventId}`)
    } catch (err) {
      this.logger.err(`Recon: failed to add event ${event.eventId}`)
    }
  }
}
