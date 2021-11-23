import { CID } from 'multiformats/cid'
import * as providers from '@ethersproject/providers'
import { LRUMap } from 'lru_map'
import {
  CeramicApi,
  AnchorServiceResponse,
  AnchorService,
  AnchorStatus,
  DiagnosticsLogger,
  fetchJson,
} from '@ceramicnetwork/common'
import StreamID from '@ceramicnetwork/streamid'
import { Observable, interval, from, concat, of } from 'rxjs'
import { concatMap, catchError, map } from 'rxjs/operators'

/**
 * CID-streamId pair
 */
interface CidAndStream {
  readonly cid: CID
  readonly streamId: StreamID
}

const POLL_INTERVAL = 60000 // 60 seconds
const MAX_POLL_TIME = 86400000 // 24 hours

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export default class EthereumAnchorService implements AnchorService {
  private readonly requestsApiEndpoint: string
  private readonly chainIdApiEndpoint: string
  private _chainId: string
  private readonly providersCache: LRUMap<string, providers.BaseProvider>
  private readonly _logger: DiagnosticsLogger

  /**
   * @param anchorServiceUrl
   */
  constructor(readonly anchorServiceUrl: string, logger: DiagnosticsLogger) {
    this.requestsApiEndpoint = this.anchorServiceUrl + '/api/v0/requests'
    this.chainIdApiEndpoint = this.anchorServiceUrl + '/api/v0/service-info/supported_chains'
    this._logger = logger
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
    const response = await fetchJson(this.chainIdApiEndpoint)
    if (response.supportedChains.length > 1) {
      throw new Error(
        "Anchor service returned multiple supported chains, which isn't supported by js-ceramic yet"
      )
    }
    this._chainId = response.supportedChains[0]
  }

  /**
   * Requests anchoring service for current tip of the stream
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  requestAnchor(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse> {
    const cidStreamPair: CidAndStream = { cid: tip, streamId }
    return concat(
      this._announcePending(cidStreamPair),
      this._makeRequest(cidStreamPair),
      this.pollForAnchorResponse(streamId, tip)
    ).pipe(
      catchError((error) =>
        of<AnchorServiceResponse>({
          status: AnchorStatus.FAILED,
          streamId: streamId,
          cid: tip,
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

  private _announcePending(cidStream: CidAndStream): Observable<AnchorServiceResponse> {
    return of({
      status: AnchorStatus.PENDING,
      streamId: cidStream.streamId,
      cid: cidStream.cid,
      message: 'Sending anchoring request',
      anchorScheduledFor: null,
    })
  }

  /**
   * Send requests to an external Ceramic Anchor Service
   * @param cidStreamPair - mapping
   * @private
   */
  private _makeRequest(cidStreamPair: CidAndStream): Observable<AnchorServiceResponse> {
    return from(
      fetchJson(this.requestsApiEndpoint, {
        method: 'POST',
        body: {
          streamId: cidStreamPair.streamId.toString(),
          docId: cidStreamPair.streamId.toString(),
          cid: cidStreamPair.cid.toString(),
        },
      })
    ).pipe(
      map((response) => {
        return this.parseResponse(cidStreamPair, response)
      })
    )
  }

  /**
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse> {
    const started = new Date().getTime()
    const maxTime = started + MAX_POLL_TIME
    const requestUrl = [this.requestsApiEndpoint, tip.toString()].join('/')
    const cidStream = { cid: tip, streamId }

    return interval(POLL_INTERVAL).pipe(
      concatMap(async () => {
        const now = new Date().getTime()
        if (now > maxTime) {
          throw new Error('Exceeded max timeout')
        } else {
          const response = await fetchJson(requestUrl)
          return this.parseResponse(cidStream, response)
        }
      })
    )
  }

  /**
   * Parse JSON that CAS returns.
   */
  private parseResponse(cidStream: CidAndStream, json: any): AnchorServiceResponse {
    if (json.error) {
      return {
        status: AnchorStatus.FAILED,
        streamId: cidStream.streamId,
        cid: cidStream.cid,
        message: json.error,
      }
    }

    switch (json.status) {
      case 'PENDING':
        return {
          status: AnchorStatus.PENDING,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
          anchorScheduledFor: json.scheduledAt,
        }
      case 'PROCESSING':
        return {
          status: AnchorStatus.PROCESSING,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
        }
      case 'FAILED':
        return {
          status: AnchorStatus.FAILED,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
        }
      case 'COMPLETED': {
        const { anchorCommit } = json
        const anchorCommitCid = CID.parse(anchorCommit.cid.toString())
        return {
          status: AnchorStatus.ANCHORED,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
          anchorCommit: anchorCommitCid,
        }
      }
      default:
        throw new Error(`Unexpected status: ${json.status}`)
    }
  }
}
