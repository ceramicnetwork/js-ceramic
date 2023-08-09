import { CID } from 'multiformats/cid'
import {
  CeramicApi,
  AnchorService,
  AnchorServiceAuth,
  AuthenticatedAnchorService,
  DiagnosticsLogger,
  fetchJson,
  FetchRequest,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { Observable, concat, timer, of, defer, expand, interval, tap } from 'rxjs'
import { concatMap, catchError, map, retry } from 'rxjs/operators'
import { CAR } from 'cartonne'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import {
  CASResponse,
  CASResponseOrError,
  ErrorResponse,
  AnchorRequestStatusName,
} from '@ceramicnetwork/codecs'
import { decode } from 'codeco'

/**
 * CID-streamId pair
 */
interface CidAndStream {
  readonly cid: CID
  readonly streamId: StreamID
}

const DEFAULT_POLL_INTERVAL = 60_000 // 60 seconds
const MAX_POLL_TIME = 86_400_000 // 24 hours

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export class EthereumAnchorService implements AnchorService {
  private readonly requestsApiEndpoint: string
  private readonly chainIdApiEndpoint: string
  private _chainId: string
  private readonly _logger: DiagnosticsLogger
  /**
   * Retry a request to CAS every +pollInterval+ milliseconds.
   */
  private readonly pollInterval: number
  private readonly maxPollTime: number
  private readonly sendRequest: FetchRequest

  constructor(
    readonly anchorServiceUrl: string,
    logger: DiagnosticsLogger,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
    maxPollTime = MAX_POLL_TIME,
    sendRequest: FetchRequest = fetchJson
  ) {
    this.requestsApiEndpoint = this.anchorServiceUrl + '/api/v0/requests'
    this.chainIdApiEndpoint = this.anchorServiceUrl + '/api/v0/service-info/supported_chains'
    this._logger = logger
    this.pollInterval = pollInterval
    this.sendRequest = sendRequest
    this.maxPollTime = maxPollTime
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    // Do Nothing
  }

  get url() {
    return this.anchorServiceUrl
  }

  async init(): Promise<void> {
    // Get the chainIds supported by our anchor service
    const response = await this.sendRequest(this.chainIdApiEndpoint)
    if (response.supportedChains.length > 1) {
      throw new Error(
        "Anchor service returned multiple supported chains, which isn't supported by js-ceramic yet"
      )
    }
    this._chainId = response.supportedChains[0]
  }

  /**
   * Requests anchoring service for current tip of the stream
   */
  requestAnchor(carFile: CAR): Observable<CASResponse> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const cidStreamPair: CidAndStream = { cid: carFileReader.tip, streamId: carFileReader.streamId }
    return concat(
      this._announcePending(cidStreamPair),
      this._makeAnchorRequest(carFileReader),
      this.pollForAnchorResponse(carFileReader.streamId, carFileReader.tip)
    ).pipe(
      catchError((error) =>
        of<CASResponse>({
          id: '',
          status: AnchorRequestStatusName.FAILED,
          streamId: carFileReader.streamId,
          cid: carFileReader.tip,
          message: error.message,
        })
      )
    )
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return [this._chainId]
  }

  private _announcePending(cidStream: CidAndStream): Observable<CASResponse> {
    return of({
      id: '',
      status: AnchorRequestStatusName.PENDING,
      streamId: cidStream.streamId,
      cid: cidStream.cid,
      message: 'Sending anchoring request',
    })
  }

  /**
   * Send requests to an external Ceramic Anchor Service
   */
  private _makeAnchorRequest(carFileReader: AnchorRequestCarFileReader): Observable<CASResponse> {
    return defer(() =>
      this.sendRequest(this.requestsApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.ipld.car',
        },
        body: carFileReader.carFile.bytes,
      })
    ).pipe(
      retry({
        delay: (error) => {
          this._logger.err(
            new Error(
              `Error connecting to CAS while attempting to anchor ${carFileReader.streamId} at commit ${carFileReader.tip}: ${error.message}`
            )
          )
          return timer(this.pollInterval)
        },
      }),
      map((response) => {
        return this.parseResponse(
          { streamId: carFileReader.streamId, cid: carFileReader.tip },
          response
        )
      })
    )
  }

  /**
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<CASResponse> {
    const started = new Date().getTime()
    const maxTime = started + this.maxPollTime
    const requestUrl = [this.requestsApiEndpoint, tip.toString()].join('/')
    const cidStream = { cid: tip, streamId }

    const requestWithError = defer(() => this.sendRequest(requestUrl)).pipe(
      retry({
        delay: (error) => {
          this._logger.err(
            new Error(
              `Error connecting to CAS while polling for anchor ${streamId} at commit ${tip}: ${error.message}`
            )
          )
          return timer(this.pollInterval)
        },
      })
    )

    return requestWithError.pipe(
      expand(() => {
        const now = new Date().getTime()
        if (now > maxTime) {
          throw new Error('Exceeded max anchor polling time limit')
        } else {
          return timer(this.pollInterval).pipe(concatMap(() => requestWithError))
        }
      }),
      map((response) => this.parseResponse(cidStream, response))
    )
  }

  newPollForAnchorResponse(task: () => Promise<any>): Observable<CASResponse> {
    const started = new Date().getTime()
    const maxTime = started + this.maxPollTime

    const requestWithError = defer(async () => {
      console.log('newPollForAnchorResponse: doing task', Date.now() - started)
      const x = await task()
      console.log('newPollForAnchorResponse: after task', Date.now() - started)
      return x
    }).pipe(
      retry({
        delay: (error) => {
          this._logger.err(
            new Error(
              `newPollForAnchorResponse: error received ${error} at ${Date.now() - started}`
            )
          )
          return timer(this.pollInterval)
        },
      })
    )

    return requestWithError.pipe(
      tap((x) => {
        console.log('newPollForAnchorResponse: received first value', x)
      }),
      expand(() => {
        const now = new Date().getTime()
        console.log('newPollForAnchorResponse: time elapsed', now - started)
        if (now > maxTime) {
          throw new Error('Exceeded max anchor polling time limit')
        } else {
          console.log('newPollForAnchorResponse: task to be completed in ms', this.pollInterval)
          return timer(this.pollInterval).pipe(concatMap(() => requestWithError))
        }
      }),
      tap((x) => {
        console.log('newPollForAnchorResponse: received value after expand', x)
      })
    )
  }

  oldPollForAnchorResponse(task: () => Promise<any>): Observable<CASResponse> {
    const started = new Date().getTime()
    const maxTime = started + this.maxPollTime

    const doPoll = defer(async () => {
      console.log('oldPollForAnchorResponse: doing task', Date.now() - started)
      const x = await task()
      console.log('oldPollForAnchorResponse: after task', Date.now() - started)
      return x
    }).pipe(
      retry({
        delay: (error) => {
          this._logger.err(
            new Error(
              `oldPollForAnchorResponse: error received ${error} at ${Date.now() - started}`
            )
          )
          return timer(this.pollInterval)
        },
      })
    )

    return interval(this.pollInterval).pipe(
      tap((x) => {
        console.log('oldPollForAnchorResponse: received value from interval', x)
      }),
      concatMap(() => {
        const now = new Date().getTime()
        console.log('oldPollForAnchorResponse: time elapsed', now - started)
        if (now > maxTime) {
          throw new Error('Exceeded max anchor polling time limit')
        } else {
          return doPoll
        }
      }),
      tap((x) => {
        console.log('oldPollForAnchorResponse: received value after concatMap', x)
      })
    )
  }

  /**
   * Parse JSON that CAS returns.
   */
  private parseResponse(cidStream: CidAndStream, json: any): CASResponse {
    const parsed = decode(CASResponseOrError, json)
    if (ErrorResponse.is(parsed)) {
      return {
        id: '',
        status: AnchorRequestStatusName.FAILED,
        streamId: cidStream.streamId,
        cid: cidStream.cid,
        message: json.error,
      }
    } else {
      return parsed
    }
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
    readonly anchorServiceUrl: string,
    logger: DiagnosticsLogger,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
    maxPollTime: number = MAX_POLL_TIME
  ) {
    super(
      anchorServiceUrl,
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
