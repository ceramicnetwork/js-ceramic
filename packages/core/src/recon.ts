import { type CAR } from 'cartonne'

import { DiagnosticsLogger, FetchRequest, fetchJson, AbortOptions } from '@ceramicnetwork/common'
import { EventID } from '@ceramicnetwork/streamid'

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
    this.#url = await this.#config.url
  }

  async put(event: ReconEvent, opts: AbortOptions): Promise<void> {
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
