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
import type {
  AnchorService,
  AnchorServiceAuth,
  AnchorValidator,
  AuthenticatedAnchorService,
} from '../anchor-service.js'
import { CasConnectionError, MaxAnchorPollingError } from '../anchor-service.js'
import { RemoteCAS } from './remote-cas.js'

const DEFAULT_POLL_INTERVAL = 60_000 // 60 seconds
const MAX_POLL_TIME = 86_400_000 // 24 hours

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
  readonly #logger: DiagnosticsLogger
  /**
   * Retry a request to CAS every +pollInterval+ milliseconds.
   */
  readonly #pollInterval: number
  readonly #maxPollTime: number
  readonly #events: Subject<AnchorEvent>
  readonly #cas: RemoteCAS
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
    this.#logger = logger
    this.#pollInterval = pollInterval
    this.#maxPollTime = maxPollTime
    this.#events = new Subject()
    this.events = this.#events
    this.url = this.anchorServiceUrl
    this.validator = new EthereumAnchorValidator(ethereumRpcUrl, logger)
    this.#cas = new RemoteCAS(anchorServiceUrl, logger, pollInterval, maxPollTime, sendRequest)
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
    const supportedChains = await this.#cas.supportedChains()
    this.#chainId = supportedChains[0]
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
    const sendRequest$ = this.#cas.create$(carFileReader, shouldRetry)
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

    const requestWithError = defer(() => this.#cas.get(streamId, tip)).pipe(
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
    await this.#cas.close()
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
