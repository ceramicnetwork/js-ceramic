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
  from,
  defer,
  expand,
  lastValueFrom,
  Subject,
  tap,
  catchError,
  retry,
  concatMap,
} from 'rxjs'
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
  HandleEventFn,
} from '../anchor-service.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'

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

class RemoteCAS {
  readonly #requestsApiEndpoint: string
  readonly #chainIdApiEndpoint: string
  readonly #sendRequest: FetchRequest
  readonly #logger: DiagnosticsLogger
  readonly #pollInterval: number

  constructor(
    anchorServiceUrl: string,
    logger: DiagnosticsLogger,
    pollInterval: number,
    sendRequest: FetchRequest
  ) {
    this.#requestsApiEndpoint = anchorServiceUrl + '/api/v0/requests'
    this.#chainIdApiEndpoint = anchorServiceUrl + '/api/v0/service-info/supported_chains'
    this.#logger = logger
    this.#pollInterval = pollInterval
    this.#sendRequest = sendRequest
  }

  async supportedChains(): Promise<Array<string>> {
    const response = await this.#sendRequest(this.#chainIdApiEndpoint)
    return response.supportedChains as Array<string>
  }

  async create(
    carFileReader: AnchorRequestCarFileReader,
    shouldRetry: boolean
  ): Promise<AnchorEvent> {
    do {
      try {
        const response = await this.#sendRequest(this.#requestsApiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.ipld.car',
          },
          body: carFileReader.carFile.bytes,
        })
        return parseResponse(carFileReader.streamId, carFileReader.tip, response)
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
    const requestUrl = [this.#requestsApiEndpoint, tip.toString()].join('/')
    const response = await this.#sendRequest(requestUrl)
    return parseResponse(streamId, tip, response)
  }
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
  readonly #events: Subject<AnchorEvent>

  #chainId: string
  #store: AnchorRequestStore
  #cas: RemoteCAS // FIXME Move In-memory close to EAS, and move the logic to CASClient

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
    this.#cas = new RemoteCAS(anchorServiceUrl, logger, pollInterval, sendRequest)
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

  async init(store: AnchorRequestStore, onEvent: HandleEventFn): Promise<void> {
    // FIXME add onEvent
    this.#store = store
    // Get the chainIds supported by our anchor service
    const supportedChains = await this.#cas.supportedChains()
    if (supportedChains.length > 1) {
      throw new MultipleChainsError()
    }
    this.#chainId = supportedChains[0]
    await this.validator.init(this.#chainId)
    // let store: AnchorRequestStore
    // FIXME
    // create loop, update events, tie up events
    // const loop = new AnchorProcessingLoop(store.infiniteList(10), async (value) => {
    //   const entry = value.value
    //   if (entry.status !== 'requested') {
    //     console.log('create')
    //     // save and handle
    //     // status == terminal ? remove : save
    //   } else {
    //     console.log('ask')
    //     // save and handle
    //     // status == terminal ? remove : save
    //   }
    // })
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
      from(this.#cas.create(carFileReader, !waitForConfirmation))
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
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorEvent> {
    const started = new Date().getTime()
    const maxTime = started + this.#maxPollTime

    const requestWithError = defer(() => {
      return this.#cas.get(streamId, tip)
    }).pipe(
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
      tap((event) => this.#events.next(event))
    )
  }

  close(): Promise<void> {
    return Promise.resolve(undefined)
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

  async init(store: AnchorRequestStore, onEvent: HandleEventFn): Promise<void> {
    await this.auth.init()
    await super.init(store, onEvent)
  }
}
