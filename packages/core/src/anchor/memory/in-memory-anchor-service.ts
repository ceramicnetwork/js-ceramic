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
        const did = await this.verifySignedRecord(record)

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

      // naive implementation for finding the "valid" commit for the document.
      // the decision making is going to change once the anchoring service becomes aware of Doctypes
      let selected: Candidate
      for (const c1 of candidates) {
        selected = c1
        let isIncluded = false

        for (const c2 of candidates) {
          if (c1 === c2) {
            continue
          }

          if (c2.log.some(c => c.toString() === c1.cid.toString())) {
            isIncluded = true
            break
          }
        }

        if (!isIncluded) {
          result.push(selected)
          break
        }
      }
    }
    return result
  }

  /**
   * Load candidate log.
   *
   * Note: this method will be replaced once CAS becomes aware of documents, not just individual commits
   *
   * @param commitId - Start CID
   * @private
   */
  async _loadCommitHistory(commitId: CID): Promise<CID[]> {
    const history: CID[] = []

    let currentCommitId = commitId
    for (; ;) {
      const currentCommit = (await this._ceramic.ipfs.dag.get(currentCommitId)).value
      if (DoctypeUtils.isAnchorRecord(currentCommit)) {
        return history
      }

      let prevCommitId: CID
      if (DoctypeUtils.isSignedRecord(currentCommit)) {
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
    this._ceramic = ceramic as Ceramic
    this._dispatcher = this._ceramic.dispatcher
  }

  /**
   * Send request to the anchoring service
   * @param docId - Document ID
   * @param cid - Record CID
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
    // creates fake anchor record
    const proofData: AnchorProof = {
      chainId: CHAIN_ID,
      blockNumber: Date.now(),
      blockTimestamp: Date.now(),
      txHash: new CID(this.SAMPLE_ETH_TX_HASH),
      root: leaf.cid,
    }
    const proof = await this._dispatcher.storeRecord(proofData)
    const record = { proof, path: '', prev: leaf.cid }
    const cid = await this._dispatcher.storeRecord(record)

    // add a delay
    const handle = setTimeout(() => {
      this.emit(leaf.docId, { status: 'COMPLETED', message: 'CID successfully anchored.', anchorRecord: cid })
      clearTimeout(handle)
    }, this._anchorDelay)
  }

  /**
   * Verifies record signature
   * @param record - Record data
   * @return DID
   * @private
   */
  async verifySignedRecord(record: Record<string, unknown>): Promise<string> {
    const { payload, signatures } = record
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
