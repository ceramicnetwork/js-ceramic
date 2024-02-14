import { type CAR } from 'cartonne'

import { DiagnosticsLogger, FetchRequest, fetchJson, AbortOptions } from '@ceramicnetwork/common'
import { EventID, StreamID } from '@ceramicnetwork/streamid'
import { Model } from '@ceramicnetwork/stream-model'

/**
 * Configuration for the Recon API
 */
export type ReconApiConfig = {
  // Whether the Recon API is enabled
  enabled: boolean
  // URL of the Recon API or a promise that resolves to the URL
  url: string | Promise<string>
}

/**
 * Recon Event
 */
export interface ReconEvent {
  id: EventID
  data: CAR
}

/**
 * Recon API Interface
 */
export interface IReconApi {
  init(): Promise<void>
  registerInterest(model: StreamID): Promise<void>
  put(event: ReconEvent, opts?: AbortOptions): Promise<void>
  enabled: boolean
}

export class ReconApi implements IReconApi {
  readonly #config: ReconApiConfig
  readonly #logger: DiagnosticsLogger
  readonly #sendRequest: FetchRequest
  #url: string

  constructor(
    config: ReconApiConfig,
    logger: DiagnosticsLogger,
    sendRequest: FetchRequest = fetchJson
  ) {
    this.#config = config
    this.#logger = logger
    this.#sendRequest = sendRequest
  }

  async init(): Promise<void> {
    if (!this.enabled) {
      return
    }

    this.#url = await this.#config.url
    await this.registerInterest(Model.MODEL)
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
      eventId: event.id.toString(),
      eventData: event.data.toString(),
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
}
