import { CID } from 'multiformats/cid'
import {
  CeramicApi,
  DiagnosticsLogger,
  fetchJson,
  FetchRequest,
  AnchorEvent,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { Observable, of, Subject } from 'rxjs'
import { CAR } from 'cartonne'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { CASResponseOrError, ErrorResponse, AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { validate, isLeft } from 'codeco'
import { EthereumAnchorValidator } from './ethereum-anchor-validator.js'
import type {
  AnchorService,
  AnchorServiceAuth,
  AnchorValidator,
  AuthenticatedAnchorService,
  CASClient,
} from '../anchor-service.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'
import {
  AnchorLoopHandler,
  CasConnectionError,
  MaxAnchorPollingError,
  MultipleChainsError,
} from '../anchor-service.js'
import { AnchorProcessingLoop } from '../anchor-processing-loop.js'

const DEFAULT_POLL_INTERVAL = 60_000 // 60 seconds
const MAX_POLL_TIME = 86_400_000 // 24 hours

/**
 * Parse JSON that CAS returns.
 */
function parseResponse(streamId: StreamID, tip: CID, json: unknown): AnchorEvent {
  const validation = validate(CASResponseOrError, json)
  if (isLeft(validation)) {
    return {
      status: AnchorRequestStatusName.FAILED,
      streamId: streamId,
      cid: tip,
      message: `Unexpected response from CAS: ${JSON.stringify(json)}`,
    }
  }
  const parsed = validation.right
  if (ErrorResponse.is(parsed)) {
    return {
      status: AnchorRequestStatusName.FAILED,
      streamId: streamId,
      cid: tip,
      message: parsed.error,
    }
  } else {
    if (parsed.status === AnchorRequestStatusName.COMPLETED) {
      return {
        status: parsed.status,
        streamId: parsed.streamId,
        cid: parsed.cid,
        message: parsed.message,
        witnessCar: parsed.witnessCar,
      }
    }
    return {
      status: parsed.status,
      streamId: parsed.streamId,
      cid: parsed.cid,
      message: parsed.message,
    }
  }
}

function announcePending(streamId: StreamID, tip: CID): Observable<AnchorEvent> {
  return of({
    status: AnchorRequestStatusName.PENDING,
    streamId: streamId,
    cid: tip,
    message: 'Sending anchoring request',
  })
}

class RemoteCAS implements CASClient {
  readonly #requestsApiEndpoint: string
  readonly #chainIdApiEndpoint: string
  readonly #sendRequest: FetchRequest
  readonly #logger: DiagnosticsLogger
  readonly #pollInterval: number
  readonly #maxPollTime: number

  constructor(
    anchorServiceUrl: string,
    logger: DiagnosticsLogger,
    pollInterval: number,
    maxPollTime: number,
    sendRequest: FetchRequest
  ) {
    this.#requestsApiEndpoint = anchorServiceUrl + '/api/v0/requests'
    this.#chainIdApiEndpoint = anchorServiceUrl + '/api/v0/service-info/supported_chains'
    this.#logger = logger
    this.#pollInterval = pollInterval
    this.#maxPollTime = maxPollTime
    this.#sendRequest = sendRequest
  }

  async supportedChains(): Promise<Array<string>> {
    const response = await this.#sendRequest(this.#chainIdApiEndpoint)
    return response.supportedChains as Array<string>
  }

  async create(
    carFileReader: AnchorRequestCarFileReader,
    waitForConfirmation: boolean
  ): Promise<AnchorEvent> {
    if (waitForConfirmation) {
      const response = await this.stubbornCreate(carFileReader, waitForConfirmation)
      return parseResponse(carFileReader.streamId, carFileReader.tip, response)
    } else {
      return {
        status: AnchorRequestStatusName.PENDING,
        streamId: carFileReader.streamId,
        cid: carFileReader.tip,
        message: 'Sending anchoring request',
      }
    }
  }

  private async stubbornCreate(
    carFileReader: AnchorRequestCarFileReader,
    shouldRetry: boolean
  ): Promise<unknown> {
    do {
      try {
        const response = await this.#sendRequest(this.#requestsApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.ipld.car',
          },
          body: carFileReader.carFile.bytes,
        })
        return response
      } catch (error) {
        const externalError = new CasConnectionError(
          carFileReader.streamId,
          carFileReader.tip,
          error.message
        )
        if (shouldRetry) {
          this.#logger.warn(externalError)
          await new Promise((resolve) => setTimeout(resolve, this.#pollInterval)) // FIXME fucking delay
        } else {
          throw externalError
        }
      }
    } while (shouldRetry)
  }

  async get(streamId: StreamID, tip: CID): Promise<AnchorEvent> {
    const response = await this.stubbornGetRequest(streamId, tip)
    return parseResponse(streamId, tip, response)
  }

  private async stubbornGetRequest(streamId: StreamID, tip: CID): Promise<any> {
    const requestUrl = [this.#requestsApiEndpoint, tip.toString()].join('/')
    const started = new Date().getTime()
    const maxTime = started + this.#maxPollTime
    let response: any = undefined
    while (!response) {
      const now = new Date().getTime()
      if (now > maxTime) {
        throw new MaxAnchorPollingError()
      }
      try {
        response = await this.#sendRequest(requestUrl)
      } catch (error: any) {
        this.#logger.warn(new CasConnectionError(streamId, tip, error.message))
        await new Promise((resolve) => setTimeout(resolve, this.#pollInterval))
      }
    }
    return response
  }

  async close() {
    // Do Nothing FIXME
  }
}

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export class EthereumAnchorService implements AnchorService {
  readonly #requestsApiEndpoint: string
  readonly #chainIdApiEndpoint: string
  readonly #logger: DiagnosticsLogger
  #loop: AnchorProcessingLoop
  /**
   * Retry a request to CAS every +pollInterval+ milliseconds.
   */
  readonly #pollInterval: number
  readonly #maxPollTime: number
  readonly #events: Subject<AnchorEvent>

  #chainId: string
  #store: AnchorRequestStore
  #cas: CASClient

  readonly url: string
  readonly events: Observable<AnchorEvent>
  readonly validator: AnchorValidator

  constructor(
    anchorServiceUrl: string,
    ethereumRpcUrl: string | undefined,
    logger: DiagnosticsLogger,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
    maxPollTime = MAX_POLL_TIME,
    sendRequest: FetchRequest = fetchJson
  ) {
    this.#requestsApiEndpoint = anchorServiceUrl + '/api/v0/requests'
    this.#chainIdApiEndpoint = anchorServiceUrl + '/api/v0/service-info/supported_chains'
    this.#logger = logger
    this.#pollInterval = pollInterval
    this.#maxPollTime = maxPollTime
    this.#events = new Subject()
    this.#cas = new RemoteCAS(anchorServiceUrl, logger, pollInterval, maxPollTime, sendRequest)
    this.events = this.#events
    this.url = anchorServiceUrl
    this.validator = new EthereumAnchorValidator(ethereumRpcUrl, logger)
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    // Do Nothing
  }

  async init(store: AnchorRequestStore, eventHandler: AnchorLoopHandler): Promise<void> {
    // FIXME add onEvent
    this.#store = store
    // Get the chainIds supported by our anchor service
    const supportedChains = await this.#cas.supportedChains()
    if (supportedChains.length > 1) {
      throw new MultipleChainsError()
    }
    this.#chainId = supportedChains[0]
    await this.validator.init(this.#chainId)
    const batchSize = 10 // FIXME
    this.#loop = new AnchorProcessingLoop(
      this.#pollInterval,
      batchSize,
      this.#cas,
      this.#store,
      this.#logger,
      eventHandler
    )
    this.#loop.start()
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return [this.#chainId]
  }

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   * @param waitForConfirmation - if true, waits until the CAS has acknowledged receipt of the anchor
   *   request before returning.
   */
  async requestAnchor(carFile: CAR, waitForConfirmation: boolean): Promise<AnchorEvent> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const streamId = carFileReader.streamId
    const tip = carFileReader.tip

    await this.#store.save(streamId, {
      cid: tip,
      genesis: carFileReader.genesis,
      timestamp: Date.now(),
    })

    if (waitForConfirmation) {
      return this.#cas.create(carFileReader, waitForConfirmation)
    } else {
      return {
        status: AnchorRequestStatusName.PENDING,
        streamId: streamId,
        cid: tip,
        message: 'Sending anchoring request',
      }
    }
  }

  async close(): Promise<void> {
    await this.#cas.close()
    await this.#store.close()
    await this.#loop.stop()
  }
}

/**
 * Ethereum anchor service that authenticates requests
 */
export class AuthenticatedEthereumAnchorService
  extends EthereumAnchorService
  implements AuthenticatedAnchorService
{
  readonly auth: AnchorServiceAuth

  constructor(
    auth: AnchorServiceAuth,
    anchorServiceUrl: string,
    ethereumRpcUrl: string | undefined,
    logger: DiagnosticsLogger,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
    maxPollTime: number = MAX_POLL_TIME
  ) {
    super(
      anchorServiceUrl,
      ethereumRpcUrl,
      logger,
      pollInterval,
      maxPollTime,
      auth.sendAuthenticatedRequest.bind(auth)
    )
    this.auth = auth
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    this.auth.ceramic = ceramic
  }

  async init(store: AnchorRequestStore, eventHandler: AnchorLoopHandler): Promise<void> {
    await this.auth.init()
    await super.init(store, eventHandler)
  }
}
