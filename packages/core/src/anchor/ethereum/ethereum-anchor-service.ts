import { CID } from 'multiformats/cid'
import {
  CeramicApi,
  DiagnosticsLogger,
  fetchJson,
  FetchRequest,
  AnchorEvent,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import {
  Observable,
  concat,
  timer,
  of,
  defer,
  expand,
  lastValueFrom,
  Subject,
  type OperatorFunction,
  type MonoTypeOperatorFunction,
} from 'rxjs'
import { concatMap, catchError, map, retry, tap } from 'rxjs/operators'
import { CAR } from 'cartonne'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { CASResponseOrError, ErrorResponse, AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { decode } from 'codeco'
import { EthereumAnchorValidator } from './ethereum-anchor-validator.js'
import { AnchorService, AnchorServiceAuth, AnchorValidator, AuthenticatedAnchorService } from '../anchor-service.js'

const DEFAULT_POLL_INTERVAL = 60_000 // 60 seconds
const MAX_POLL_TIME = 86_400_000 // 24 hours

class MultipleChainsError extends Error {
  constructor() {
    super(
      "Anchor service returned multiple supported chains, which isn't supported by js-ceramic yet"
    )
  }
}

class CasConnectionError extends Error {
  constructor(streamId: StreamID, tip: CID, cause: string) {
    super(
      `Error connecting to CAS while attempting to anchor ${streamId} at commit ${tip}: ${cause}`
    )
  }
}

class MaxAnchorPollingError extends Error {
  constructor() {
    super('Exceeded max anchor polling time limit')
  }
}

/**
 * Parse JSON that CAS returns.
 */
function parseResponse(streamId: StreamID, tip: CID, json: unknown): AnchorEvent {
  const parsed = decode(CASResponseOrError, json)
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

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export class EthereumAnchorService implements AnchorService {
  readonly #requestsApiEndpoint: string
  readonly #chainIdApiEndpoint: string
  readonly #logger: DiagnosticsLogger
  /**
   * Retry a request to CAS every +pollInterval+ milliseconds.
   */
  readonly #pollInterval: number
  readonly #maxPollTime: number
  readonly #sendRequest: FetchRequest
  readonly #events: Subject<AnchorEvent>
  #chainId: string

  readonly url: string
  readonly events: Observable<AnchorEvent>
  readonly validator: AnchorValidator

  constructor(
    readonly anchorServiceUrl: string,
    ethereumRpcUrl: string | undefined,
    logger: DiagnosticsLogger,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
    maxPollTime = MAX_POLL_TIME,
    sendRequest: FetchRequest = fetchJson
  ) {
    this.#requestsApiEndpoint = this.anchorServiceUrl + '/api/v0/requests'
    this.#chainIdApiEndpoint = this.anchorServiceUrl + '/api/v0/service-info/supported_chains'
    this.#logger = logger
    this.#pollInterval = pollInterval
    this.#sendRequest = sendRequest
    this.#maxPollTime = maxPollTime
    this.#events = new Subject()
    this.events = this.#events
    this.url = this.anchorServiceUrl
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

  async init(): Promise<void> {
    // Get the chainIds supported by our anchor service
    const response = await this.#sendRequest(this.#chainIdApiEndpoint)
    if (response.supportedChains.length > 1) {
      throw new MultipleChainsError()
    }
    this.#chainId = response.supportedChains[0]
    await this.validator.init(this.#chainId)
  }

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   * @param waitForConfirmation - if true, waits until the CAS has acknowledged receipt of the anchor
   *   request before returning.
   */
  async requestAnchor(
    carFile: CAR,
    waitForConfirmation: boolean
  ): Promise<Observable<AnchorEvent>> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const streamId = carFileReader.streamId
    const tip = carFileReader.tip

    const requestCreated$ = concat(
      announcePending(streamId, tip),
      this._makeAnchorRequest(carFileReader, !waitForConfirmation)
    )

    const anchorCompleted$ = this.pollForAnchorResponse(streamId, tip)

    const errHandler = (error: Error) =>
      of<AnchorEvent>({
        status: AnchorRequestStatusName.FAILED,
        streamId: streamId,
        cid: tip,
        message: error.message,
      })

    if (waitForConfirmation) {
      await lastValueFrom(requestCreated$)
      return anchorCompleted$.pipe(catchError(errHandler))
    } else {
      return concat(requestCreated$, anchorCompleted$).pipe(catchError(errHandler))
    }
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return [this.#chainId]
  }

  /**
   * Send requests to an external Ceramic Anchor Service
   */
  private _makeAnchorRequest(
    carFileReader: AnchorRequestCarFileReader,
    shouldRetry: boolean
  ): Observable<AnchorEvent> {
    let sendRequest$ = defer(() =>
      this.#sendRequest(this.#requestsApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.ipld.car',
        },
        body: carFileReader.carFile.bytes,
      })
    )

    if (shouldRetry) {
      sendRequest$ = sendRequest$.pipe(
        retry({
          delay: (error) => {
            this.#logger.warn(
              new CasConnectionError(carFileReader.streamId, carFileReader.tip, error.message)
            )
            return timer(this.#pollInterval)
          },
        })
      )
    } else {
      sendRequest$ = sendRequest$.pipe(
        catchError((error) => {
          throw new CasConnectionError(carFileReader.streamId, carFileReader.tip, error.message)
        })
      )
    }

    return sendRequest$.pipe(this._parseResponse(carFileReader.streamId, carFileReader.tip))
  }

  /**
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorEvent> {
    const started = new Date().getTime()
    const maxTime = started + this.#maxPollTime
    const requestUrl = [this.#requestsApiEndpoint, tip.toString()].join('/')

    const requestWithError = defer(() => this.#sendRequest(requestUrl)).pipe(
      retry({
        delay: (error) => {
          this.#logger.warn(new CasConnectionError(streamId, tip, error.message))
          return timer(this.#pollInterval)
        },
      })
    )

    return requestWithError.pipe(
      expand(() => {
        const now = new Date().getTime()
        if (now > maxTime) {
          throw new MaxAnchorPollingError()
        } else {
          return timer(this.#pollInterval).pipe(concatMap(() => requestWithError))
        }
      }),
      this._parseResponse(streamId, tip),
      this._updateEvents()
    )
  }

  private _parseResponse(streamId: StreamID, tip: CID): OperatorFunction<unknown, AnchorEvent> {
    return map((response) => parseResponse(streamId, tip, response))
  }

  private _updateEvents(): MonoTypeOperatorFunction<AnchorEvent> {
    return tap((event) => this.#events.next(event))
  }

  async close(): Promise<void> {
    // Do Nothing
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

  async init(): Promise<void> {
    await this.auth.init()
    await super.init()
  }
}
