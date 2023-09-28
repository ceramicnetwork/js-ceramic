import { CID } from 'multiformats/cid'
import {
  Observable,
  Subject,
  concat,
  of,
  from,
  lastValueFrom,
  catchError,
  firstValueFrom,
  defer,
  retry,
  timer,
  expand,
  concatMap,
  tap,
} from 'rxjs'
import { filter } from 'rxjs/operators'
import { type DiagnosticsLogger, TestUtils } from '@ceramicnetwork/common'
import type { AnchorProof, AnchorCommit, AnchorEvent } from '@ceramicnetwork/common'
import type { Dispatcher } from '../../dispatcher.js'
import type { Ceramic } from '../../ceramic.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { CARFactory, type CAR } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import type { AnchorService, AnchorValidator, HandleEventFn } from '../anchor-service.js'
import { InMemoryAnchorValidator, TRANSACTION_CACHE } from './in-memory-anchor-validator.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'

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

// FIXME Fucking cleanup
class InMemoryCAS {
  readonly #anchorOnRequest: boolean
  #queue: Candidate[]
  readonly #events: Subject<AnchorEvent>
  readonly #dispatcher: Dispatcher
  readonly #anchors: Map<string, AnchorEvent> = new Map() // Maps CID of a specific anchor request to the current status of that request

  constructor(anchorOnRequest: boolean, dispatcher: Dispatcher) {
    this.#anchorOnRequest = anchorOnRequest
    this.#queue = []
    this.#events = new Subject()
    this.#dispatcher = dispatcher
    this.#events.subscribe((event) => {
      this.#anchors.set(event.cid.toString(), event)
    })
  }

  // FIXME interface with RemoteCAS
  async supportedChains(): Promise<Array<string>> {
    return [CHAIN_ID]
  }

  /**
   * Anchor requests
   */
  async anchor(): Promise<void> {
    const candidates = await this._findCandidates()
    for (const candidate of candidates) {
      await this._process(candidate)
    }

    this.#queue = [] // reset
  }

  /**
   * Filter candidates by stream and DIDs
   * @private
   */
  async _findCandidates(): Promise<Candidate[]> {
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

  // FIXME interface with RemoteCAS
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

  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorEvent> {
    const anchorResponse = this.#anchors.get(tip.toString())
    const feed$ = this.#events.pipe(
      filter((asr) => asr.streamId.equals(streamId) && asr.cid.equals(tip))
    )
    if (anchorResponse) {
      return concat(of(anchorResponse), feed$)
    } else {
      return feed$
    }
  }

  async _process(leaf: Candidate): Promise<void> {
    this._startProcessingCandidate(leaf)
    // creates fake anchor commit
    const timestamp = Math.floor(Date.now() / 1000)
    const txHashCid = TestUtils.randomCID()
    const proofData: AnchorProof = {
      chainId: CHAIN_ID,
      txHash: txHashCid,
      root: leaf.cid,
      //TODO (NET-1657): Update the InMemoryAnchorService to mirror the behavior of the contract-based anchoring system
      txType: V1_PROOF_TYPE,
    }
    TRANSACTION_CACHE.set(txHashCid.toString(), timestamp)
    const proof = await this.#dispatcher.storeCommit(proofData)
    const commit = { proof, path: '', prev: leaf.cid, id: leaf.streamId.cid }
    const cid = await this.#dispatcher.storeCommit(commit as any)

    const witnessCar = await this._buildWitnessCAR(proof, cid)

    this.#events.next({
      status: AnchorRequestStatusName.COMPLETED,
      streamId: leaf.streamId,
      cid: leaf.cid,
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

  /**
   * Builds the CAR file that the AnchorService responds to Ceramic with for a successfully anchored
   * request. Contains the AnchorCommit, AnchorProof, and the merkle tree path to the anchored commit.
   * For the InMemoryAnchorService, however, the tree is always of size one, so there are no
   * intermediate objects from the merkle tree.
   */
  async _buildWitnessCAR(proofCid: CID, anchorCommitCid: CID): Promise<CAR> {
    const car = carFactory.build()
    car.blocks.put(await this.#dispatcher.getIpfsBlock(proofCid))
    car.blocks.put(await this.#dispatcher.getIpfsBlock(anchorCommitCid))
    car.roots.push(anchorCommitCid)
    return car
  }

  // FIXME interface with RemoteCAS
  async get(streamId: StreamID, tip: CID): Promise<AnchorEvent> {
    const found = this.#anchors.get(tip.toString())
    if (found) {
      return found
    }
    return firstValueFrom(
      this.#events.pipe(filter((asr) => asr.streamId.equals(streamId) && asr.cid.equals(tip)))
    )
  }

  async failPendingAnchors(): Promise<void> {
    const candidates = await this._findCandidates()
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

  /**
   * Sets all pending anchors to PROCESSING status. Useful for testing.
   */
  async startProcessingPendingAnchors(reset = false): Promise<void> {
    const candidates = await this._findCandidates()
    for (const candidate of candidates) {
      this._startProcessingCandidate(candidate, 'anchor is being processed')
    }
    if (reset) {
      this.#queue = []
    }
  }

  async close() {
    this.#events.complete()
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
  #ceramic: Ceramic
  #dispatcher: Dispatcher

  readonly #anchorOnRequest: boolean
  readonly #events: Subject<AnchorEvent>

  // Maps CID of a specific anchor request to the current status of that request
  readonly #anchors: Map<string, AnchorEvent> = new Map()

  #queue: Candidate[] = []
  #store: AnchorRequestStore | undefined
  #cas: InMemoryCAS
  #maxPollTime = MAX_POLL_TIME
  #logger: DiagnosticsLogger

  readonly url = '<inmemory>'
  readonly events: Observable<AnchorEvent>
  readonly validator: AnchorValidator
  #pollInterval = DEFAULT_POLL_INTERVAL

  constructor(
    _config: Partial<InMemoryAnchorConfig> = {},
    dispatcher: Dispatcher,
    logger: DiagnosticsLogger
  ) {
    this.#anchorOnRequest = _config.anchorOnRequest ?? true
    this.#store = undefined
    this.#events = new Subject()
    // Remember the most recent AnchorEvent for each anchor request
    this.#events.subscribe((event) => {
      this.#anchors.set(event.cid.toString(), event)
    })
    this.#dispatcher = dispatcher
    this.#cas = new InMemoryCAS(_config.anchorOnRequest ?? true, dispatcher)
    this.events = this.#events
    this.validator = new InMemoryAnchorValidator()
    this.#logger = logger
  }

  async init(store: AnchorRequestStore, onEvent: HandleEventFn): Promise<void> {
    // FIXME add onEvent
    this.#store = store
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service
   */
  async getSupportedChains(): Promise<Array<string>> {
    return this.#cas.supportedChains()
  }

  /**
   * Anchor requests
   */
  async anchor(): Promise<void> {
    await this.#cas.anchor()
    // const candidates = await this._findCandidates()
    // for (const candidate of candidates) {
    //   await this._process(candidate)
    // }
    //
    // this.#queue = [] // reset
  }

  /**
   * Fails all pending anchors. Useful for testing.
   */
  async failPendingAnchors(): Promise<void> {
    await this.#cas.failPendingAnchors()
  }

  /**
   * Sets all pending anchors to PROCESSING status. Useful for testing.
   */
  async startProcessingPendingAnchors(): Promise<void> {
    await this.#cas.startProcessingPendingAnchors()
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: Ceramic) {
    this.#ceramic = ceramic
    this.#dispatcher = this.#ceramic.dispatcher
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
    // FIXME Before
    // const carFileReader = new AnchorRequestCarFileReader(carFile)
    // const candidate = Candidate.fromCarFileReader(carFileReader)
    // if (this.#anchorOnRequest) {
    //   this._process(candidate).catch((error) => {
    //     this.#events.next({
    //       status: AnchorRequestStatusName.FAILED,
    //       streamId: candidate.streamId,
    //       cid: candidate.cid,
    //       message: error.message,
    //     })
    //   })
    // } else {
    //   this.#queue.push(candidate)
    // }
    // this.#events.next({
    //   status: AnchorRequestStatusName.PENDING,
    //   streamId: carFileReader.streamId,
    //   cid: carFileReader.tip,
    //   message: 'Sending anchoring request',
    // })
    // return this.pollForAnchorResponse(carFileReader.streamId, carFileReader.tip)
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
      tap((event) => this.#events.next(event))
    )
  }

  /**
   * Sends anchor commit to Ceramic node and instructs it to publish the commit to pubsub
   * @param streamId
   * @param commit
   */
  async _publishAnchorCommit(streamId: StreamID, commit: AnchorCommit): Promise<CID> {
    const anchorCid = await this.#dispatcher.storeCommit(commit as any)
    await new Promise<void>((resolve) => {
      this.#dispatcher.publishTip(streamId, anchorCid).add(resolve)
    })
    return anchorCid
  }

  async close(): Promise<void> {
    this.#events.complete()
  }
}
