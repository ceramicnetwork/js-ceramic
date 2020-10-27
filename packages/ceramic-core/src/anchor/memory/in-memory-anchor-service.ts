import CID from 'cids'

import * as didJwt from 'did-jwt'
import { AnchorProof, AnchorService, CeramicApi, DoctypeUtils } from "@ceramicnetwork/ceramic-common"

import base64url from "base64url"

import type Dispatcher from '../../dispatcher'
import Ceramic, { CeramicConfig } from "../../ceramic"

interface CidDoc {
  readonly cid: CID;
  readonly docId: string;
}

/**
 * In-memory anchor service - used locally, not meant to be used in production code
 */
class InMemoryAnchorService extends AnchorService {
  private _ceramic: Ceramic
  private _dispatcher: Dispatcher

  private readonly _anchorDelay = 0
  private readonly _anchorOnRequest = true

  private _queue: CidDoc[] = []

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
    const filtered = await this._filterByDocs()
    for (const pair of filtered) {
      await this._process(pair)
    }

    this._queue = [] // reset
  }

  /**
   * Filter pairs by document and nonces
   * @private
   */
  async _filterByDocs(): Promise<CidDoc[]> {
    const result: CidDoc[] = []

    const groupedByDocIds = this._queue.reduce( (r: Record<string, CidDoc[]>, a: CidDoc) => {
      r[a.docId] = r[a.docId] || [];
      r[a.docId].push(a);
      return r;
    }, {})

    for (const docId of Object.keys(groupedByDocIds)) {
      const pairs = groupedByDocIds[docId]

      let nonce = 0
      let selectedPair = null

      for (const pair of pairs) {
        const anchorRecord = await this._dispatcher.retrieveRecord(pair.cid)

        let currentNonce
        if (DoctypeUtils.isSignedRecord(anchorRecord)) {
          const payload = await this._dispatcher.retrieveRecord(anchorRecord.link)
          currentNonce = payload.header?.nonce || 0
        } else {
          currentNonce = anchorRecord.header?.nonce || 0
        }
        if (selectedPair == null || currentNonce > nonce) {
          selectedPair = pair
          nonce = currentNonce
        }
      }
      result.push(selectedPair)
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
    const pair: CidDoc = {
      docId, cid,
    }

    if (this._anchorOnRequest) {
      await this._process(pair)
    } else {
      this._queue.push(pair)
    }
  }

  /**
   * Process single pair
   * @param cidDoc - Document-CID pair
   * @private
   */
  async _process(cidDoc: CidDoc): Promise<void> {
    await this.verifyCid(cidDoc.cid)

    // creates fake anchor record
    const proofData: AnchorProof = {
      chainId: 'eip155:1',
      blockNumber: Date.now(),
      blockTimestamp: Date.now(),
      txHash: new CID(this.SAMPLE_ETH_TX_HASH),
      root: cidDoc.cid,
    }
    const proof = await this._dispatcher.storeRecord(proofData)
    const record = { proof, path: '', prev: cidDoc.cid }
    const cid = await this._dispatcher.storeRecord(record)

    // add a delay
    const handle = setTimeout(() => {
      this.emit(cidDoc.docId, { status: 'COMPLETED', message: 'CID successfully anchored.', anchorRecord: cid });
      clearTimeout(handle)
    }, this._anchorDelay)
  }

  /**
   * Verify record
   * @param cid - Record CID
   */
  async verifyCid(cid: CID): Promise<boolean> {
    const record = (await this._ceramic.context.ipfs.dag.get(cid)).value;
    if (!DoctypeUtils.isSignedRecord(record)) {
      return true; // if not signed, always valid
    }

    const { payload, signatures } = record;
    const { signature, protected: _protected } = signatures[0];

    const decodedHeader = JSON.parse(base64url.decode(_protected));
    const { kid } = decodedHeader;

    const { publicKey } = await this._ceramic.context.resolver.resolve(kid);
    const jws = [_protected, payload, signature].join(".");
    try {
      await didJwt.verifyJWS(jws, publicKey)
    } catch (e) {
      return false;
    }
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateChainInclusion (proof: AnchorProof): Promise<void> {
    // always valid
  }

}

export default InMemoryAnchorService
