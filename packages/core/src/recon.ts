import { type CAR } from 'cartonne'

import { DiagnosticsLogger, FetchRequest, fetchJson } from '@ceramicnetwork/common'
import { EventID } from '@ceramicnetwork/streamid'

/**
 * Configuration for the Recon API
 */
export type ReconApiConfig = {
  // Whether the Recon API is enabled
  enabled: boolean
  // URL of the Recon API
  url: string
}

/**
 * Recon Event
 */
export interface Event {
  eventId: EventID
  eventData: CAR
}

/**
 * Recon API Interface
 */
export interface IReconApi {
  put(event: Event): Promise<void>
  enabled: boolean
}

export class ReconApi implements IReconApi {
  readonly #config: ReconApiConfig
  readonly #logger: DiagnosticsLogger
  readonly #sendRequest: FetchRequest

  constructor(
    config: ReconApiConfig,
    logger: DiagnosticsLogger,
    sendRequest: FetchRequest = fetchJson
  ) {
    this.#config = config
    this.#logger = logger
    this.#sendRequest = sendRequest
  }

  async put(event: Event): Promise<void> {
    const body = {
      eventId: event.eventId.toString(),
      eventData: event.eventData.toString(),
    }
    try {
      await this.#sendRequest(this.#config.url + '/ceramic/events', {
        method: 'POST',
        body,
      })
      this.#logger.imp(`Recon: put event ${event.eventId}`)
    } catch (err) {
      this.#logger.err(`Recon: failed to add event ${event.eventId} with error ${err}`)
      throw err
    }
  }

  get enabled(): boolean {
    return this.#config.enabled
  }
}
