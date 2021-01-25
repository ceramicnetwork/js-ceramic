import CID from "cids";
import * as uint8arrays from "uint8arrays";

import * as didJwt from "did-jwt";
import {
  AnchorProof,
  AnchorService,
  AnchorStatus,
  CeramicApi,
  DoctypeUtils,
} from "@ceramicnetwork/common";

import type Dispatcher from "../../dispatcher";
import Ceramic from "../../ceramic";
import DocID from "@ceramicnetwork/docid";

const DID_MATCHER =
  "^(did:([a-zA-Z0-9_]+):([a-zA-Z0-9_.-]+(:[a-zA-Z0-9_.-]+)*)((;[a-zA-Z0-9_.:%-]+=[a-zA-Z0-9_.:%-]*)*)(/[^#?]*)?)([?][^#]*)?(#.*)?";
const CHAIN_ID = "inmemory:12345";

class Candidate {
  constructor(
    readonly cid: CID,
    readonly docId?: DocID,
    readonly log?: CID[]
  ) {}

  get key(): string {
    return this.docId.toString();
  }
}

interface InMemoryAnchorConfig {
  anchorDelay?: number;
  anchorOnRequest?: boolean;
  verifySignatures?: boolean;
}

const SAMPLE_ETH_TX_HASH =
  "bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova";

/**
 * In-memory anchor service - used locally, not meant to be used in production code
 */
class InMemoryAnchorService extends AnchorService {
  #ceramic: Ceramic;
  #dispatcher: Dispatcher;

  readonly #anchorDelay: number;
  readonly #anchorOnRequest: boolean;
  readonly #verifySignatures: boolean;

  #queue: Candidate[] = [];

  constructor(_config: InMemoryAnchorConfig) {
    super();

    this.#anchorDelay = _config?.anchorDelay ?? 0;
    this.#anchorOnRequest = _config?.anchorOnRequest ?? true;
    this.#verifySignatures = _config?.verifySignatures ?? true;
  }

  async init(): Promise<void> {
    return;
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service
   */
  async getSupportedChains(): Promise<Array<string>> {
    return [CHAIN_ID];
  }

  /**
   * Anchor requests
   */
  async anchor(): Promise<void> {
    const candidates = await this._findCandidates();
    for (const candidate of candidates) {
      await this._process(candidate);
    }

    this.#queue = []; // reset
  }

  /**
   * Filter candidates by document and DIDs
   * @private
   */
  async _findCandidates(): Promise<Candidate[]> {
    const groupedCandidates = await this._groupCandidatesByDocId(this.#queue);
    return this._selectValidCandidates(groupedCandidates);
  }

  async _groupCandidatesByDocId(
    candidates: Candidate[]
  ): Promise<Record<string, Candidate[]>> {
    const result: Record<string, Candidate[]> = {};

    let req: Candidate = null;
    for (let index = 0; index < candidates.length; index++) {
      try {
        req = candidates[index];
        const record = (await this.#ceramic.ipfs.dag.get(req.cid)).value;
        if (this.#verifySignatures) {
          await this.verifySignedCommit(record);
        }

        const log = await this._loadCommitHistory(req.cid);
        const candidate = new Candidate(new CID(req.cid), req.docId, log);

        if (!result[candidate.key]) {
          result[candidate.key] = [];
        }
        result[candidate.key].push(candidate);
      } catch (e) {
        console.error(e.message);
        this._failCandidate(req, e.message);
      }
    }

    return result;
  }

  _selectValidCandidates(
    groupedCandidates: Record<string, Candidate[]>
  ): Candidate[] {
    const result: Candidate[] = [];
    for (const compositeKey of Object.keys(groupedCandidates)) {
      const candidates = groupedCandidates[compositeKey];

      // When there are multiple valid candidate tips to anchor for the same docId, pick the one
      // with the largest log
      let selected: Candidate = null;
      for (const c of candidates) {
        if (selected == null) {
          selected = c;
          continue;
        }

        if (c.log.length < selected.log.length) {
          this._failCandidate(c);
        } else if (c.log.length > selected.log.length) {
          this._failCandidate(selected);
          selected = c;
        } else {
          // If there are two conflicting candidates with the same log length, we must choose
          // which to anchor deterministically. We use the same arbitrary but deterministic strategy
          // that js-ceramic conflict resolution does: choosing the record whose CID is smaller
          if (c.cid.bytes < selected.cid.bytes) {
            this._failCandidate(selected);
            selected = c;
          } else {
            this._failCandidate(c);
          }
        }
      }

      result.push(selected);
    }

    return result;
  }

  _failCandidate(candidate: Candidate, message?: string): void {
    if (!message) {
      message = `Rejecting request to anchor CID ${candidate.cid.toString()} for document ${candidate.docId.toString()} because there is a better CID to anchor for the same document`;
    }
    this.emit(candidate.docId.toString(), {
      cid: candidate.cid,
      status: AnchorStatus.FAILED,
      message: message,
    });
  }

  /**
   * Load candidate log.
   *
   * @param commitId - Start CID
   * @private
   */
  async _loadCommitHistory(commitId: CID): Promise<CID[]> {
    const history: CID[] = [];

    let currentCommitId = commitId;
    for (;;) {
      const currentCommit = (await this.#ceramic.ipfs.dag.get(currentCommitId))
        .value;
      if (DoctypeUtils.isAnchorCommit(currentCommit)) {
        return history;
      }

      let prevCommitId: CID;
      if (DoctypeUtils.isSignedCommit(currentCommit)) {
        const payload = (await this.#ceramic.ipfs.dag.get(currentCommit.link))
          .value;
        prevCommitId = payload.prev;
      } else {
        prevCommitId = currentCommit.prev;
      }

      if (prevCommitId == null) {
        return history;
      }

      history.push(prevCommitId);
      currentCommitId = prevCommitId;
    }
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    this.#ceramic = (ceramic as unknown) as Ceramic;
    this.#dispatcher = this.#ceramic.dispatcher;
  }

  /**
   * Send request to the anchoring service
   * @param docId - Document ID
   * @param cid - Commit CID
   */
  async requestAnchor(docId: DocID, cid: CID): Promise<void> {
    const candidate: Candidate = new Candidate(cid, docId);

    if (this.#anchorOnRequest) {
      await this._process(candidate);
    } else {
      this.#queue.push(candidate);
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
      txHash: new CID(SAMPLE_ETH_TX_HASH),
      root: leaf.cid,
    };
    const proof = await this.#dispatcher.storeCommit(proofData);
    const commit = { proof, path: "", prev: leaf.cid };
    const cid = await this.#dispatcher.storeCommit(commit);

    // add a delay
    const handle = setTimeout(() => {
      this.emit(leaf.docId.toString(), {
        cid: leaf.cid,
        status: AnchorStatus.ANCHORED,
        message: "CID successfully anchored.",
        anchorRecord: cid,
      });
      clearTimeout(handle);
    }, this.#anchorDelay);
  }

  /**
   * Verifies commit signature
   * @param commit - Commit data
   * @return DID
   * @private
   */
  async verifySignedCommit(commit: Record<string, unknown>): Promise<string> {
    const { payload, signatures } = commit;
    const { signature, protected: _protected } = signatures[0];

    const jsonAsBase64url = uint8arrays.toString(
      uint8arrays.fromString(_protected, "base64url")
    );
    const decodedHeader = JSON.parse(jsonAsBase64url);
    const { kid } = decodedHeader;

    const didDoc = await this.#ceramic.context.resolver.resolve(kid);
    const jws = [_protected, payload, signature].join(".");
    await didJwt.verifyJWS(jws, didDoc.publicKey);
    return kid.match(RegExp(DID_MATCHER))[1];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateChainInclusion(proof: AnchorProof): Promise<void> {
    // always valid
  }
}

export default InMemoryAnchorService;
