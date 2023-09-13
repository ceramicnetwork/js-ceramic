import { CID } from 'multiformats/cid'
import { Observable, Subject, concat, of } from 'rxjs'
import { filter } from 'rxjs/operators'
import {
  AnchorProof,
  AnchorService,
  AnchorValidator,
  AnchorCommit,
  TestUtils,
  AnchorEvent,
} from '@ceramicnetwork/common'
import type { Dispatcher } from '../../dispatcher.js'
import { Ceramic } from '../../ceramic.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { LRUCache } from 'least-recent'
import { CAR, CarBlock, CARFactory } from 'cartonne'
import * as DAG_JOSE from 'dag-jose'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { AnchorRequestStatusName, type CASResponse } from '@ceramicnetwork/codecs'

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

// Caches recent anchor txn hashes and the timestamp when they were anchored
// This is intentionally global and not a member of InMemoryAnchorService. This is so that when
// multiple InMemoryAnchorServices are being used simultaneously in the same process (usually by
// tests that use multiple Ceramic nodes), they can share the set of recent transactions and thus
// can successfully validate each others transactions.
const txnCache: LRUCache<string, number> = new LRUCache(100)
const carFactory = new CARFactory()
carFactory.codecs.add(DAG_JOSE)

/**
 * In-memory anchor service - used locally, not meant to be used in production code
 */
export class InMemoryAnchorService implements AnchorService, AnchorValidator {
  #ceramic: Ceramic
  #dispatcher: Dispatcher

  readonly #anchorDelay: number
  readonly #anchorOnRequest: boolean
  readonly #feed: Subject<CASResponse> = new Subject()

  // Maps CID of a specific anchor request to the current status of that request
  readonly #anchors: Map<string, CASResponse> = new Map()

  #queue: Candidate[] = []

  readonly events: Observable<AnchorEvent>

  readonly chainId = CHAIN_ID
  readonly url = '<inmemory>'
  readonly ethereumRpcEndpoint = null

  constructor(_config: Partial<InMemoryAnchorConfig> = {}) {
    this.#anchorDelay = _config.anchorDelay ?? 0
    this.#anchorOnRequest = _config.anchorOnRequest ?? true

    // Remember the most recent CASResponse for each anchor request
    this.#feed.subscribe((asr) => this.#anchors.set(asr.cid.toString(), asr))
    this.events = new Observable()
  }

  async init(): Promise<void> {
    return
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service
   */
  async getSupportedChains(): Promise<Array<string>> {
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
   * Fails all pending anchors. Useful for testing.
   */
  async failPendingAnchors(): Promise<void> {
    const candidates = await this._findCandidates()
    for (const candidate of candidates) {
      this.#feed.next({
        id: '',
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
  async startProcessingPendingAnchors(): Promise<void> {
    const candidates = await this._findCandidates()
    for (const candidate of candidates) {
      this._startProcessingCandidate(candidate, 'anchor is being processed')
    }

    this.#queue = [] // reset
  }

  /**
   * Filter candidates by stream and DIDs
   * @private
   */
  async _findCandidates(): Promise<Candidate[]> {
    const groupedCandidates = await this._groupCandidatesByStreamId(this.#queue)
    return this._selectValidCandidates(groupedCandidates)
  }

  async _groupCandidatesByStreamId(candidates: Candidate[]): Promise<Record<string, Candidate[]>> {
    const result: Record<string, Candidate[]> = {}
    for (const req of candidates) {
      if (!result[req.key]) {
        result[req.key] = []
      }
      if (result[req.key].find((c) => c.cid.equals(req.cid))) {
        // If we already have an identical request for the exact same commit on the same,
        // streamid, don't create duplicate Candidates
        continue
      }

      const candidate = new Candidate(req.streamId, req.cid, req.key)

      result[candidate.key].push(candidate)
    }
    return result
  }

  _selectValidCandidates(groupedCandidates: Record<string, Candidate[]>): Candidate[] {
    return Object.values(groupedCandidates).map((candidates) => {
      const init = candidates.slice(0, candidates.length - 1)
      const last = candidates[candidates.length - 1]
      for (const replaced of init) {
        this.#feed.next({
          id: '',
          status: AnchorRequestStatusName.FAILED,
          streamId: replaced.streamId,
          cid: replaced.cid,
          message: 'replaced',
        })
      }
      return last
    })
  }

  _startProcessingCandidate(candidate: Candidate, message?: string): void {
    if (!message) {
      message = `Processing request to anchor CID ${candidate.cid.toString()} for stream ${candidate.streamId.toString()}`
    }
    this.#feed.next({
      id: '',
      status: AnchorRequestStatusName.PROCESSING,
      streamId: candidate.streamId,
      cid: candidate.cid,
      message,
    })
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
  async requestAnchor(
    carFile: CAR,
    waitForConfirmation: boolean
  ): Promise<Observable<CASResponse>> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const candidate = Candidate.fromCarFileReader(carFileReader)
    if (this.#anchorOnRequest) {
      this._process(candidate).catch((error) => {
        this.#feed.next({
          id: '',
          status: AnchorRequestStatusName.FAILED,
          streamId: candidate.streamId,
          cid: candidate.cid,
          message: error.message,
        })
      })
    } else {
      this.#queue.push(candidate)
    }
    this.#feed.next({
      id: '',
      status: AnchorRequestStatusName.PENDING,
      streamId: carFileReader.streamId,
      cid: carFileReader.tip,
      message: 'Sending anchoring request',
    })
    return this.pollForAnchorResponse(carFileReader.streamId, carFileReader.tip)
  }

  /**
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<CASResponse> {
    const anchorResponse = this.#anchors.get(tip.toString())
    const feed$ = this.#feed.pipe(
      filter((asr) => asr.streamId.equals(streamId) && asr.cid.equals(tip))
    )
    if (anchorResponse) {
      return concat(of(anchorResponse), feed$)
    } else {
      return feed$
    }
  }

  async _storeRecord(record: Record<string, unknown>): Promise<CID> {
    let timeout: any

    const putPromise = this.#dispatcher.storeCommit(record).finally(() => {
      clearTimeout(timeout)
    })

    const timeoutPromise = new Promise((resolve) => {
      timeout = setTimeout(resolve, 30 * 1000)
    })

    return await Promise.race([
      putPromise,
      timeoutPromise.then(() => {
        throw new Error(`Timed out storing record in IPFS`)
      }),
    ])
  }

  /**
   * Sends anchor commit to Ceramic node and instructs it to publish the commit to pubsub
   * @param streamId
   * @param commit
   */
  async _publishAnchorCommit(streamId: StreamID, commit: AnchorCommit): Promise<CID> {
    const anchorCid = await this._storeRecord(commit as any)
    let resolved = false
    await new Promise<void>((resolve) => {
      this.#dispatcher.publishTip(streamId, anchorCid).add(() => {
        if (!resolved) {
          resolved = true
          resolve()
        }
      })
    })

    return anchorCid
  }

  /**
   * Builds the CAR file that the AnchorService responds to Ceramic with for a successfully anchored
   * request. Contains the AnchorCommit, AnchorProof, and the merkle tree path to the anchored commit.
   * For the InMemoryAnchorService, however, the tree is always of size one, so there are no
   * intermediate objects from the merkle tree.
   */
  async _buildWitnessCAR(proofCid: CID, anchorCommitCid: CID): Promise<CAR> {
    const car = carFactory.build()

    const cidToBlock = async (cid) => new CarBlock(cid, await this.#dispatcher.getIpfsBlock(cid))

    car.blocks.put(await cidToBlock(proofCid))
    car.blocks.put(await cidToBlock(anchorCommitCid))

    car.roots.push(anchorCommitCid)

    return car
  }

  /**
   * Process single candidate
   * @private
   */
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
    txnCache.set(txHashCid.toString(), timestamp)
    const proof = await this.#dispatcher.storeCommit(proofData)
    const commit = { proof, path: '', prev: leaf.cid, id: leaf.streamId.cid }
    const cid = await this._publishAnchorCommit(leaf.streamId, commit)

    const witnessCar = await this._buildWitnessCAR(proof, cid)

    // add a delay
    const handle = setTimeout(() => {
      this.#feed.next({
        id: '',
        status: AnchorRequestStatusName.COMPLETED,
        streamId: leaf.streamId,
        cid: leaf.cid,
        message: 'CID successfully anchored',
        anchorCommit: { cid: cid },
        witnessCar,
      })
      clearTimeout(handle)
    }, this.#anchorDelay)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateChainInclusion(proof: AnchorProof): Promise<number> {
    const txHashString = proof.txHash.toString()
    if (!txnCache.has(txHashString)) {
      throw new Error(
        `Txn ${proof.txHash.toString()} was not recently anchored by the InMemoryAnchorService`
      )
    }

    return txnCache.get(txHashString)
  }
}
