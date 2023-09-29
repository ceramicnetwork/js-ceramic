import { CID } from 'multiformats/cid'
import {
  catchError,
  concat,
  concatMap,
  defer,
  expand,
  firstValueFrom,
  from,
  lastValueFrom,
  Observable,
  of,
  retry,
  Subject,
  tap,
  timer,
} from 'rxjs'
import { filter } from 'rxjs/operators'
import type { AnchorCommit, AnchorEvent, AnchorProof } from '@ceramicnetwork/common'
import { type DiagnosticsLogger, TestUtils } from '@ceramicnetwork/common'
import type { Ceramic } from '../../ceramic.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { type CAR, CARFactory } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { AnchorRequestStatusName, NotCompleteStatusName } from '@ceramicnetwork/codecs'
import type {
  AnchorService,
  AnchorValidator,
  CASClient,
  CasConnectionError,
  HandleEventFn,
  MaxAnchorPollingError,
} from '../anchor-service.js'
import { InMemoryAnchorValidator, TRANSACTION_CACHE } from './in-memory-anchor-validator.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'
import { AnchorProcessingLoop } from '../anchor-processing-loop.js'
import { AnchorRequestStoreListResult } from '../../store/anchor-request-store.js'

const CHAIN_ID = 'inmemory:12345'
const V1_PROOF_TYPE = 'f(bytes32)'

class Candidate {
  static fromCarFileReader(reader: AnchorRequestCarFileReader): Candidate {
    return new Candidate(reader.streamId, reader.tip, reader.streamId.toString())
  }

  constructor(readonly streamId: StreamID, readonly cid: CID, readonly key: string) {}
}

type InMemoryAnchorConfig = {
  anchorDelay: number
  anchorOnRequest: boolean
}

const carFactory = new CARFactory()
carFactory.codecs.add(DAG_JOSE)

function groupCandidatesByStreamId(candidates: Candidate[]): Record<string, Candidate[]> {
  const result: Record<string, Candidate[]> = {}
  for (const req of candidates) {
    const key = req.key
    const items = result[key] || []
    if (items.find((c) => c.cid.equals(req.cid))) {
      // If we already have an identical request for the exact same commit on the same,
      // streamid, don't create duplicate Candidates
      continue
    }
    items.push(req)
    result[key] = items
  }
  return result
}

class InMemoryCAS implements CASClient {
  readonly #anchorOnRequest: boolean
  #queue: Candidate[]
  readonly #events: Subject<AnchorEvent>
  readonly #anchors: Map<string, AnchorEvent> = new Map() // Maps CID of a specific anchor request to the current status of that request

  constructor(anchorOnRequest: boolean) {
    this.#anchorOnRequest = anchorOnRequest
    this.#queue = []
    this.#events = new Subject()
    this.#events.subscribe((event) => {
      this.#anchors.set(event.cid.toString(), event)
    })
  }

  async supportedChains(): Promise<Array<string>> {
    return [CHAIN_ID]
  }

  /**
   * Anchor requests
   */
  async anchor(): Promise<void> {
    const candidates = await this.findCandidates()
    for (const candidate of candidates) {
      await this._process(candidate)
    }

    this.#queue = [] // reset
  }

  /**
   * Filter candidates by stream and DIDs
   */
  private async findCandidates(): Promise<Candidate[]> {
    const groupedCandidates = groupCandidatesByStreamId(this.#queue)
    // Select last candidate per stream, mark others REPLACED
    return Object.values(groupedCandidates).map((candidates) => {
      const init = candidates.slice(0, candidates.length - 1)
      const last = candidates[candidates.length - 1]
      for (const replaced of init) {
        this.#events.next({
          status: AnchorRequestStatusName.REPLACED,
          streamId: replaced.streamId,
          cid: replaced.cid,
          message: 'replaced',
        })
      }
      return last
    })
  }

  async create(
    carFileReader: AnchorRequestCarFileReader,
    shouldRetry: boolean
  ): Promise<AnchorEvent> {
    const candidate = Candidate.fromCarFileReader(carFileReader)
    const streamId = candidate.streamId
    const tip = candidate.cid
    if (this.#anchorOnRequest) {
      this._process(candidate).catch((error) => {
        this.#events.next({
          status: AnchorRequestStatusName.FAILED,
          streamId: streamId,
          cid: tip,
          message: error.message,
        })
      })
    } else {
      this.#queue.push(candidate)
      this.#events.next({
        status: AnchorRequestStatusName.PENDING,
        streamId: streamId,
        cid: tip,
        message: 'Sending anchoring request',
      })
    }
    const filtered$ = this.#events.pipe(
      filter((e) => e.streamId.equals(streamId) && e.cid.equals(tip))
    )
    const fromCache$ = this.#anchors.has(tip.toString())
      ? of(this.#anchors.get(tip.toString()))
      : of()
    return firstValueFrom(concat(fromCache$, filtered$))
  }

  async _process(candidate: Candidate): Promise<void> {
    this._startProcessingCandidate(candidate)
    // creates fake anchor commit
    const timestamp = Math.floor(Date.now() / 1000)
    const txHashCid = TestUtils.randomCID()
    const proofData: AnchorProof = {
      chainId: CHAIN_ID,
      txHash: txHashCid,
      root: candidate.cid,
      //TODO (NET-1657): Update the InMemoryAnchorService to mirror the behavior of the contract-based anchoring system
      txType: V1_PROOF_TYPE,
    }
    TRANSACTION_CACHE.set(txHashCid.toString(), timestamp)
    const witnessCar = carFactory.build()
    const proofCid = witnessCar.put(proofData)
    const commit: AnchorCommit = {
      proof: proofCid,
      path: '',
      prev: candidate.cid,
      id: candidate.streamId.cid,
    }
    witnessCar.put(commit, { isRoot: true })
    this.#events.next({
      status: AnchorRequestStatusName.COMPLETED,
      streamId: candidate.streamId,
      cid: candidate.cid,
      message: 'CID successfully anchored',
      witnessCar: witnessCar,
    })
  }

  _startProcessingCandidate(candidate: Candidate, message?: string): void {
    if (!message) {
      message = `Processing request to anchor CID ${candidate.cid.toString()} for stream ${candidate.streamId.toString()}`
    }
    this.#events.next({
      status: AnchorRequestStatusName.PROCESSING,
      streamId: candidate.streamId,
      cid: candidate.cid,
      message,
    })
  }

  async get(streamId: StreamID, tip: CID): Promise<AnchorEvent> {
    const found = this.#anchors.get(tip.toString())
    if (found) {
      return found
    }
    return firstValueFrom(
      this.#events.pipe(filter((asr) => asr.streamId.equals(streamId) && asr.cid.equals(tip)))
    )
  }

  moveAnchors(from: NotCompleteStatusName, to: NotCompleteStatusName, reset: boolean): void {
    const candidates = this.#queue
    for (const candidate of candidates) {
      const current = this.#anchors.get(candidate.cid.toString())
      if (current && from === current.status) {
        this.#events.next({
          status: to,
          streamId: candidate.streamId,
          cid: candidate.cid,
          message: `Moved anchor to ${to}`,
        })
      } else if (!current) {
        this.#events.next({
          status: to,
          streamId: candidate.streamId,
          cid: candidate.cid,
          message: `Set anchor to ${to}`,
        })
      }
    }
    if (reset) {
      this.#queue = []
    }
  }

  async failPendingAnchors(): Promise<void> {
    const candidates = await this.findCandidates()
    for (const candidate of candidates) {
      this.#events.next({
        status: AnchorRequestStatusName.FAILED,
        streamId: candidate.streamId,
        cid: candidate.cid,
        message: 'anchor failed',
      })
    }

    this.#queue = [] // reset
  }

  async close() {
    this.#events.complete()
    this.#events.unsubscribe()
  }
}

// FIXME from EAS
function announcePending(streamId: StreamID, tip: CID): Observable<AnchorEvent> {
  return of({
    status: AnchorRequestStatusName.PENDING,
    streamId: streamId,
    cid: tip,
    message: 'Sending anchoring request',
  })
}

const DEFAULT_POLL_INTERVAL = 500 // 500 milliseconds
const MAX_POLL_TIME = 86_400_000 // 24 hours

/**
 * In-memory anchor service - used locally, not meant to be used in production code
 */
export class InMemoryAnchorService implements AnchorService {
  #store: AnchorRequestStore | undefined
  #cas: InMemoryCAS
  #loop: AnchorProcessingLoop<AnchorRequestStoreListResult>
  #maxPollTime = MAX_POLL_TIME
  #logger: DiagnosticsLogger
  #pollInterval = DEFAULT_POLL_INTERVAL

  readonly url = '<inmemory>'
  readonly events: Observable<AnchorEvent>
  readonly validator: AnchorValidator

  constructor(_config: Partial<InMemoryAnchorConfig> = {}, logger: DiagnosticsLogger) {
    this.#store = undefined
    this.#cas = new InMemoryCAS(_config.anchorOnRequest ?? true)
    this.events = new Subject()
    this.validator = new InMemoryAnchorValidator()
    this.#logger = logger
  }

  async init(store: AnchorRequestStore, onEvent: HandleEventFn): Promise<void> {
    this.#store = store
    const batchSize = 10 // FIXME
    this.#loop = new AnchorProcessingLoop(store.infiniteList(batchSize), async (entry) => {
      try {
        // FIXME get or create??
        const event = await this.#cas.get(entry.key, entry.value.cid)
        const isTerminal = await onEvent(event)
        if (isTerminal) {
          await this.#store.remove(entry.key)
        }
      } catch (e) {
        // Do Nothing
      }
      await new Promise((resolve) => setTimeout(resolve, this.#pollInterval))
    })
    this.#loop.start()
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service
   */
  getSupportedChains(): Promise<Array<string>> {
    return this.#cas.supportedChains()
  }

  /**
   * Anchor requests
   */
  anchor(): Promise<void> {
    return this.#cas.anchor()
  }

  moveAnchors(
    from: NotCompleteStatusName | Array<NotCompleteStatusName>,
    to: NotCompleteStatusName,
    reset = false
  ): void {
    if (Array.isArray(from)) {
      for (const fromStatus of from) {
        this.#cas.moveAnchors(fromStatus, to, reset)
      }
    } else {
      this.#cas.moveAnchors(from, to, reset)
    }
  }

  /**
   * Fails all pending anchors. Useful for testing.
   */
  failPendingAnchors(): Promise<void> {
    return this.#cas.failPendingAnchors()
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: Ceramic) {
    // Do Nothing
  }

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   * @param waitForConfirmation - if true, waits until the CAS has acknowledged receipt of the anchor
   *   request before returning.
   */
  async requestAnchor(carFile: CAR, waitForConfirmation = false): Promise<Observable<AnchorEvent>> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const streamId = carFileReader.streamId
    const tip = carFileReader.tip

    await this.#store.save(streamId, {
      cid: tip,
      genesis: carFileReader.genesis,
      timestamp: Date.now(),
    })

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

    let previous: AnchorEvent | undefined = undefined
    return requestWithError.pipe(
      expand(() => {
        const now = new Date().getTime()
        if (now > maxTime) {
          throw new MaxAnchorPollingError()
        } else {
          return timer(this.#pollInterval).pipe(concatMap(() => requestWithError))
        }
      }),
      filter((current) => {
        if (!previous) {
          previous = current
          return true
        } else {
          return !(previous.cid.equals(current.cid) && previous.status === current.status)
        }
      })
    )
  }

  async close(): Promise<void> {
    await this.#cas.close()
    await this.#store.close()
    await this.#loop.stop()
  }
}
