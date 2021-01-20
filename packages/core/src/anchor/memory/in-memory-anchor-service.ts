import CID from 'cids'

import * as didJwt from 'did-jwt'
import { AnchorProof, AnchorService, CeramicApi, DoctypeUtils } from "@ceramicnetwork/common"

import base64url from "base64url"

import type Dispatcher from '../../dispatcher'
import Ceramic, { CeramicConfig } from "../../ceramic"

const DID_MATCHER = '^(did:([a-zA-Z0-9_]+):([a-zA-Z0-9_.-]+(:[a-zA-Z0-9_.-]+)*)((;[a-zA-Z0-9_.:%-]+=[a-zA-Z0-9_.:%-]*)*)(/[^#?]*)?)([?][^#]*)?(#.*)?';
const CHAIN_ID = 'inmemory:12345'

class Candidate {
  public cid: CID
  public did?: string
  public docId: string

  public readonly log: CID[]

  constructor(cid: CID, docId?: string, did?: string, log?: CID[]) {
    this.cid = cid
    this.docId = docId
    this.did = did
    this.log = log
  }

  get key(): string {
    return this.docId + this.did
  }

}

/**
 * In-memory anchor service - used locally, not meant to be used in production code
 */
class InMemoryAnchorService extends AnchorService {
  private _ceramic: Ceramic
  private _dispatcher: Dispatcher

  private readonly _anchorDelay = 0
  private readonly _anchorOnRequest = true

  private _queue: Candidate[] = []

  private SAMPLE_ETH_TX_HASH = 'bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'

  constructor (private _config: CeramicConfig) {
    super()

    if (this._config) {
      this._anchorDelay = _config.anchorDelay ? _config.anchorDelay : 0
      this._anchorOnRequest = 'anchorOnRequest' in _config ? _config.anchorOnRequest : true
    }
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
    const filtered = await this._filter()
    for (const candidate of filtered) {
      await this._process(candidate)
    }

    this._queue = [] // reset
  }

  /**
   * Filter candidates by document and DIDs
   * @private
   */
  async _filter(): Promise<Candidate[]> {
    const result: Candidate[] = []
    const validCandidates: Record<string, Candidate[]> = {}

    let req = null
    for (let index = 0; index < this._queue.length; index++) {
      try {
        req = this._queue[index]
        const record = (await this._ceramic.ipfs.dag.get(req.cid)).value
        const did = await this.verifySignedCommit(record)

        const log = await this._loadCommitHistory(req.cid)
        const candidate = new Candidate(new CID(req.cid), req.docId, did, log)

        if (!validCandidates[candidate.key]) {
          validCandidates[candidate.key] = []
        }
        validCandidates[candidate.key].push(candidate)
      } catch (e) {
        // do nothing
      }
    }

    for (const compositeKey of Object.keys(validCandidates)) {
      const candidates: Candidate[] = validCandidates[compositeKey]

      // When there are multiple valid candidate tips to anchor for the same docId, pick the one
      // with the largest log
      let maxLogLength = -1
      let selected: Candidate
      for (const c of candidates) {
        if (c.log.length > maxLogLength) {
          selected = c
          maxLogLength = c.log.length
        } else if (selected && c.log.length == maxLogLength && c.cid.bytes < selected.cid.bytes) {
          // If there are two conflicting candidates with the same log length, we must choose
          // which to anchor deterministically. We use the same arbitrary but deterministic strategy
          // that js-ceramic conflict resolution does: choosing the record whose CID is smaller
          selected = c
        }
      }

      result.push(selected)
    }
    return result
  }

  /**
   * Load candidate log.
   *
   * @param commitId - Start CID
   * @private
   */
  async _loadCommitHistory(commitId: CID): Promise<CID[]> {
    const history: CID[] = []

    let currentCommitId = commitId
    for (; ;) {
      const currentCommit = (await this._ceramic.ipfs.dag.get(currentCommitId)).value
      if (DoctypeUtils.isAnchorCommit(currentCommit)) {
        return history
      }

      let prevCommitId: CID
      if (DoctypeUtils.isSignedCommit(currentCommit)) {
        const payload = (await this._ceramic.ipfs.dag.get(currentCommit.link)).value
        prevCommitId = payload.prev
      } else {
        prevCommitId = currentCommit.prev
      }

      if (prevCommitId == null) {
        return history
      }

      history.push(prevCommitId)
      currentCommitId = prevCommitId
    }
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    this._ceramic = ceramic as unknown as Ceramic
    this._dispatcher = this._ceramic.dispatcher
  }

  /**
   * Send request to the anchoring service
   * @param docId - Document ID
   * @param cid - Commit CID
   */
  async requestAnchor(docId: string, cid: CID): Promise<void> {
    const candidate: Candidate = new Candidate(cid, docId)

    if (this._anchorOnRequest) {
      await this._process(candidate)
    } else {
      this._queue.push(candidate)
    }
  }

  /**
   * Process single candidate
   * @private
   */
  async _process(leaf: Candidate): Promise<void> {
    // creates fake anchor commit
    const proofData: AnchorProof = {
      chainId: CHAIN_ID,
      blockNumber: Date.now(),
      blockTimestamp: Date.now(),
      txHash: new CID(this.SAMPLE_ETH_TX_HASH),
      root: leaf.cid,
    }
    const proof = await this._dispatcher.storeCommit(proofData)
    const commit = { proof, path: '', prev: leaf.cid }
    const cid = await this._dispatcher.storeCommit(commit)

    // add a delay
    const handle = setTimeout(() => {
      this.emit(leaf.docId, { status: 'COMPLETED', message: 'CID successfully anchored.', anchorRecord: cid })
      clearTimeout(handle)
    }, this._anchorDelay)
  }

  /**
   * Verifies commit signature
   * @param commit - Commit data
   * @return DID
   * @private
   */
  async verifySignedCommit(commit: Record<string, unknown>): Promise<string> {
    const { payload, signatures } = commit
    const { signature, protected: _protected } = signatures[0]

    const decodedHeader = JSON.parse(base64url.decode(_protected))
    const { kid } = decodedHeader

    const didDoc = await this._ceramic.context.resolver.resolve(kid)
    const jws = [_protected, payload, signature].join(".")
    await didJwt.verifyJWS(jws, didDoc.publicKey)
    return kid.match(RegExp(DID_MATCHER))[1]
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateChainInclusion (proof: AnchorProof): Promise<void> {
    // always valid
  }

}

export default InMemoryAnchorService
