import type { CASClient } from '../anchor-service.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/common'
import type {
  AnchorCommit,
  AnchorEvent,
  NotCompleteStatusName,
  AnchorProof,
} from '@ceramicnetwork/common'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { randomCID, StreamID } from '@ceramicnetwork/streamid'
import { CARFactory } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'
import { CID } from 'multiformats/cid'
import { Subject } from 'rxjs'
import type { LRUCache } from 'least-recent'

class Candidate {
  static fromCarFileReader(reader: AnchorRequestCarFileReader): Candidate {
    return new Candidate(reader.streamId, reader.tip, reader.streamId.toString())
  }

  constructor(readonly streamId: StreamID, readonly cid: CID, readonly key: string) {}
}

const V1_PROOF_TYPE = 'f(bytes32)'

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

export class InMemoryCAS implements CASClient {
  readonly #anchorOnRequest: boolean
  #queue: Candidate[]
  readonly #events: Subject<AnchorEvent>
  readonly #anchors: Map<string, AnchorEvent> = new Map() // Maps CID of a specific anchor request to the current status of that request
  readonly #chainId: string
  readonly #transactionCache: LRUCache<string, number>

  constructor(
    chainId: string,
    transactionCache: LRUCache<string, number>,
    anchorOnRequest: boolean
  ) {
    this.#chainId = chainId
    this.#transactionCache = transactionCache
    this.#anchorOnRequest = anchorOnRequest
    this.#queue = []
    this.#events = new Subject()
    this.#events.subscribe((event) => {
      this.#anchors.set(event.cid.toString(), event)
    })
  }

  assertCASAccessible(): void {
    // no-op
  }

  async supportedChains(): Promise<Array<string>> {
    return [this.#chainId]
  }

  /**
   * Anchor requests
   */
  anchor(): void {
    const candidates = this.findCandidates()
    for (const candidate of candidates) {
      const event = this.process(candidate)
      this.#events.next(event)
    }

    this.#queue = [] // reset
  }

  async create(carFileReader: AnchorRequestCarFileReader): Promise<AnchorEvent> {
    const candidate = Candidate.fromCarFileReader(carFileReader)
    const streamId = candidate.streamId
    const tip = candidate.cid
    let event: AnchorEvent
    if (this.#anchorOnRequest) {
      try {
        event = this.process(candidate)
      } catch (e) {
        event = {
          status: AnchorRequestStatusName.FAILED as const,
          streamId: streamId,
          cid: tip,
          message: e.message,
        }
      }
    } else {
      const found = this.#anchors.get(tip.toString())
      if (found) {
        return found
      }
      this.#queue.push(candidate)
      event = {
        status: AnchorRequestStatusName.PENDING as const,
        streamId: streamId,
        cid: tip,
        message: 'Sending anchoring request',
      }
    }
    this.#events.next(event)
    return event
  }

  async getStatusForRequest(streamId: StreamID, tip: CID): Promise<AnchorEvent> {
    const found = this.#anchors.get(tip.toString())
    if (found) {
      return found
    } else {
      throw new Error(`Not found`)
    }
  }

  /**
   * Filter candidates by stream and DIDs
   */
  private findCandidates(): Candidate[] {
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

  private process(candidate: Candidate): AnchorEvent {
    this.#events.next({
      status: AnchorRequestStatusName.PROCESSING,
      streamId: candidate.streamId,
      cid: candidate.cid,
      message: `Processing request to anchor CID ${candidate.cid.toString()} for stream ${candidate.streamId.toString()}`,
    })
    // creates fake anchor commit
    const timestamp = Math.floor(Date.now() / 1000)
    const txHashCid = randomCID()
    const proofData: AnchorProof = {
      chainId: this.#chainId,
      txHash: txHashCid,
      root: candidate.cid,
      //TODO (NET-1657): Update the InMemoryAnchorService to mirror the behavior of the contract-based anchoring system
      txType: V1_PROOF_TYPE,
    }
    this.#transactionCache.set(txHashCid.toString(), timestamp)
    const witnessCar = carFactory.build()
    const proofCid = witnessCar.put(proofData)
    const commit: AnchorCommit = {
      proof: proofCid,
      path: '',
      prev: candidate.cid,
      id: candidate.streamId.cid,
    }
    witnessCar.put(commit, { isRoot: true })

    return {
      status: AnchorRequestStatusName.COMPLETED,
      streamId: candidate.streamId,
      cid: candidate.cid,
      message: 'CID successfully anchored',
      witnessCar: witnessCar,
    }
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

  async close() {
    this.#events.complete()
  }
}
