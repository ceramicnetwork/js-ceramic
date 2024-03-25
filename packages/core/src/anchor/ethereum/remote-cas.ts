import type { CASClient } from '../anchor-service.js'
import type { AnchorEvent, FetchRequest } from '@ceramicnetwork/common'
import { AnchorRequestStatusName } from '@ceramicnetwork/common'
import type { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { CASResponseOrError, ErrorResponse, SupportedChainsResponse } from '@ceramicnetwork/codecs'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CID } from 'multiformats/cid'
import { validate, isValid, decode } from 'codeco'
import { deferAbortable } from '../../ancillary/defer-abortable.js'
import { catchError, firstValueFrom, Subject, takeUntil, type Observable } from 'rxjs'
import { DiagnosticsLogger } from '@ceramicnetwork/common'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'

const MAX_FAILED_REQUESTS = 3
const MAX_MILLIS_WITHOUT_SUCCESS = 1000 * 60 // 1 minute

/**
 * Parse JSON that CAS returns.
 */
function parseResponse(streamId: StreamID, tip: CID, json: unknown): AnchorEvent {
  const validation = validate(CASResponseOrError, json)
  if (!isValid(validation)) {
    return {
      status: AnchorRequestStatusName.FAILED,
      streamId: streamId,
      cid: tip,
      message: `Unexpected response from CAS: ${JSON.stringify(json)}`,
    }
  }
  const parsed = validation.right
  if (ErrorResponse.is(parsed)) {
    Metrics.count('cas_request_failed', 1)
    return {
      status: AnchorRequestStatusName.FAILED,
      streamId: streamId,
      cid: tip,
      message: parsed.error,
    }
  } else {
    if (parsed.status === AnchorRequestStatusName.COMPLETED) {
      Metrics.count('cas_request_success', 1)
      return {
        status: parsed.status,
        streamId: parsed.streamId,
        cid: parsed.cid,
        message: parsed.message,
        witnessCar: parsed.witnessCar,
      }
    }
    if (parsed.status === AnchorRequestStatusName.PENDING) {
      Metrics.count('cas_request_pending', 1)
    }
    return {
      status: parsed.status,
      streamId: parsed.streamId,
      cid: parsed.cid,
      message: parsed.message,
    }
  }
}

export class RemoteCAS implements CASClient {
  readonly #logger: DiagnosticsLogger
  readonly #requestsApiEndpoint: string
  readonly #chainIdApiEndpoint: string
  readonly #sendRequest: FetchRequest
  readonly #stopSignal: Subject<void>

  // Used to track when we fail to reach the CAS at all (e.g. from a network error)
  // Note it does not care about if the status of the request *on* the CAS.  In other words,
  // getting a definitive response from the CAS telling us that the request is in status FAILED,
  // does not cause this counter to increment.
  #numFailedRequests: number
  #firstFailedRequestDate: Date | null

  constructor(logger: DiagnosticsLogger, anchorServiceUrl: string, sendRequest: FetchRequest) {
    this.#logger = logger
    this.#requestsApiEndpoint = anchorServiceUrl + '/api/v0/requests'
    this.#chainIdApiEndpoint = anchorServiceUrl + '/api/v0/service-info/supported_chains'
    this.#sendRequest = sendRequest
    this.#stopSignal = new Subject()
    this.#numFailedRequests = 0
    this.#firstFailedRequestDate = null
  }

  /**
   * Throws an exception if we have consistently been unable to reach the CAS for multiple requests
   * in a row over an ongoing period of time. Used to fail writes when we reach this state so that
   * the failure becomes obvious to the node operator and so that we don't continue to create data
   * that risks becoming corrupted if it never gets anchored.
   */
  assertCASAccessible(): void {
    if (this.#numFailedRequests < MAX_FAILED_REQUESTS) {
      return
    }

    // We've had 3 or more failures talking to the CAS in a row. Now figure out
    // how long we've been in this state
    const now = new Date()
    const millisSinceFirstFailure = now.getTime() - this.#firstFailedRequestDate.getTime()
    if (millisSinceFirstFailure > MAX_MILLIS_WITHOUT_SUCCESS) {
      const err = new Error(
        `Ceramic Anchor Service appears to be inaccessible. We have failed to contact the CAS ${
          this.#numFailedRequests
        } times in a row, starting at ${this.#firstFailedRequestDate.toISOString()}. Note that failure to anchor may cause data loss.`
      )
      this.#logger.err(err)
      throw err
    }
  }

  _recordCASContactFailure() {
    if (this.#numFailedRequests === 0) {
      this.#firstFailedRequestDate = new Date()
    }
    this.#numFailedRequests++
  }

  _recordCASContactSuccess(action: string) {
    if (this.#numFailedRequests >= MAX_FAILED_REQUESTS) {
      this.#logger.imp(`Successfully ${action} a request against the CAS`)
    }
    this.#numFailedRequests = 0
    this.#firstFailedRequestDate = null
  }

  async supportedChains(): Promise<Array<string>> {
    const response = await this.#sendRequest(this.#chainIdApiEndpoint)
    try {
      const supportedChainsResponse = decode(SupportedChainsResponse, response)
      return supportedChainsResponse.supportedChains
    } catch (error) {
      throw new Error(
        `SupportedChains response : ${JSON.stringify(
          response
        )} does not contain contain the field <supportedChains> or is of size more than 1: ${error}`
      )
    }
  }

  /**
   * Create an anchor request on CAS through `fetch`.
   */
  async create(carFileReader: AnchorRequestCarFileReader): Promise<AnchorEvent> {
    const response = await firstValueFrom(this.create$(carFileReader))
    return parseResponse(carFileReader.streamId, carFileReader.tip, response)
  }

  create$(carFileReader: AnchorRequestCarFileReader): Observable<unknown> {
    const sendRequest$ = deferAbortable(async (signal) => {
      const response = await this.#sendRequest(this.#requestsApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.ipld.car',
        },
        body: carFileReader.carFile.bytes,
        signal: signal,
      })

      // We successfully contacted the CAS
      this._recordCASContactSuccess('created')

      return response
    })

    return sendRequest$.pipe(
      catchError((error) => {
        // Record the fact that we failed to contact the CAS
        this._recordCASContactFailure()

        // clean up the error message to have more context
        throw new Error(
          `Error connecting to CAS while attempting to anchor ${carFileReader.streamId} at commit ${
            carFileReader.tip
          }. This is failure #${this.#numFailedRequests} attempting to communicate to the CAS: ${
            error.message
          }`
        )
      }),
      takeUntil(this.#stopSignal)
    )
  }

  async getStatusForRequest(streamId: StreamID, tip: CID): Promise<AnchorEvent> {
    const requestUrl = [this.#requestsApiEndpoint, tip.toString()].join('/')
    const sendRequest$ = deferAbortable(async (signal) => {
      const response = await this.#sendRequest(requestUrl, { signal: signal })

      // We successfully contacted the CAS
      this._recordCASContactSuccess('polled')

      return response
    })
    const response = await firstValueFrom(
      sendRequest$.pipe(
        catchError((error) => {
          // Record the fact that we failed to contact the CAS
          this._recordCASContactFailure()

          // clean up the error message to have more context
          throw new Error(
            `Error connecting to CAS while attempting to poll the status of request for StreamID ${streamId} at commit ${tip}. This is failure #${
              this.#numFailedRequests
            } attempting to communicate to the CAS: ${error.message}`
          )
        }),
        takeUntil(this.#stopSignal)
      )
    )
    return parseResponse(streamId, tip, response)
  }

  async close() {
    this.#stopSignal.next()
    this.#stopSignal.complete()
  }
}
