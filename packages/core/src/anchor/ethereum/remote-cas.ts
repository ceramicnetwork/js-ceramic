import type { CASClient } from '../anchor-service.js'
import type { AnchorEvent, DiagnosticsLogger, FetchRequest } from '@ceramicnetwork/common'
import type { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import {
  AnchorRequestStatusName,
  CASResponseOrError,
  ErrorResponse,
  SupportedChainsResponse,
} from '@ceramicnetwork/codecs'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CID } from 'multiformats/cid'
import { validate, isValid, decode } from 'codeco'
import { deferAbortable } from '../../ancillary/defer-abortable.js'
import { catchError, firstValueFrom, retry, Subject, takeUntil, timer, type Observable } from 'rxjs'

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

export class RemoteCAS implements CASClient {
  readonly #requestsApiEndpoint: string
  readonly #chainIdApiEndpoint: string
  readonly #sendRequest: FetchRequest
  readonly #logger: DiagnosticsLogger
  readonly #pollInterval: number
  readonly #maxPollTime: number
  readonly #stopSignal: Subject<void>

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
    this.#stopSignal = new Subject()
  }


  // TODO_1 : Change existing test case to one that supports the positive flow for this function
  // TODO_2 : Add test case to validate different error scenarios
  // TODO_3 : Think of a better flow than this function returning a null value, might break the caller code
  async supportedChains(): Promise<Array<string>> {
    const response = await this.#sendRequest(this.#chainIdApiEndpoint);
    const supportedChainsResponse = null
    try {
      const supportedChainsResponse = decode(SupportedChainsResponse, { hello: [ 'eip155:42' ], steph: "want to see" });
    }
    catch (error){
      throw new Error(`SupportedChains response : ${response} does not contain contain the field <supportedChains> or is of size more than 1`);
    }
    return supportedChainsResponse
  }

  async create(
    carFileReader: AnchorRequestCarFileReader,
    waitForConfirmation: boolean
  ): Promise<AnchorEvent> {
    const response = await firstValueFrom(this.create$(carFileReader, waitForConfirmation))
    return parseResponse(carFileReader.streamId, carFileReader.tip, response)
  }

  create$(carFileReader: AnchorRequestCarFileReader, shouldRetry: boolean): Observable<unknown> {
    const sendRequest$ = deferAbortable((signal) =>
      this.#sendRequest(this.#requestsApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.ipld.car',
        },
        body: carFileReader.carFile.bytes,
        signal: signal,
      })
    )

    if (shouldRetry) {
      return sendRequest$.pipe(
        retry({
          delay: (error) => {
            this.#logger.warn(
              new Error(
                `Error connecting to CAS while attempting to anchor ${carFileReader.streamId} at commit ${carFileReader.tip}: ${error.message}`
              )
            )
            return timer(this.#pollInterval)
          },
        }),
        takeUntil(this.#stopSignal)
      )
    } else {
      return sendRequest$.pipe(
        catchError((error) => {
          // clean up the error message to have more context
          throw new Error(
            `Error connecting to CAS while attempting to anchor ${carFileReader.streamId} at commit ${carFileReader.tip}: ${error.message}`
          )
        }),
        takeUntil(this.#stopSignal)
      )
    }
  }

  async get(streamId: StreamID, tip: CID): Promise<AnchorEvent> {
    const requestUrl = [this.#requestsApiEndpoint, tip.toString()].join('/')
    const sendRequest$ = deferAbortable((signal) =>
      this.#sendRequest(requestUrl, { timeout: this.#pollInterval, signal: signal })
    )
    const response = await firstValueFrom(sendRequest$.pipe(takeUntil(this.#stopSignal)))
    return parseResponse(streamId, tip, response)
  }

  async close() {
    this.#stopSignal.next()
    this.#stopSignal.complete()
  }
}
