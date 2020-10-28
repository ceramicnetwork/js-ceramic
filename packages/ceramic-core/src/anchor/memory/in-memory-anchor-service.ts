import CID from 'cids'

import * as didJwt from 'did-jwt'
import { AnchorProof, AnchorService, CeramicApi, DoctypeUtils } from "@ceramicnetwork/ceramic-common"

import base64url from "base64url"

import type Dispatcher from '../../dispatcher'
import Ceramic, { CeramicConfig } from "../../ceramic"

const DID_MATCHER = '^(did:([a-zA-Z0-9_]+):([a-zA-Z0-9_.-]+(:[a-zA-Z0-9_.-]+)*)((;[a-zA-Z0-9_.:%-]+=[a-zA-Z0-9_.:%-]*)*)(/[^#?]*)?)([?][^#]*)?(#.*)?';

class Candidate {
  public cid: CID;
  public docId: string;

  public did?: string;

  constructor(cid: CID, docId?: string, did?: string) {
    this.cid = cid;
    this.docId = docId;
    this.did = did;
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
   * Filter candidates by document, DIDs and nonces
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

        const candidate = new Candidate(new CID(req.cid), req.docId, did)
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

      let nonce = 0
      let selected: Candidate = null

      for (const candidate of candidates) {
        const record = (await this._ceramic.ipfs.dag.get(candidate.cid)).value

        let currentNonce
        if (DoctypeUtils.isSignedRecord(record)) {
          const payload = (await this._ceramic.ipfs.dag.get(record.link)).value
          currentNonce = payload.header?.nonce || 0
        } else {
          currentNonce = record.header?.nonce || 0
        }
        if (selected == null || currentNonce > nonce) {
          selected = candidate
          nonce = currentNonce
        }
      }
      result.push(selected)
    }
    return result
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
      chainId: 'eip155:1',
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
  async verifySignedRecord(record: any): Promise<string> {
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
