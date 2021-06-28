import CID from "cids";
import { Observable, Subject, concat, of } from "rxjs";
import { filter } from "rxjs/operators";
import {
  AnchorProof,
  AnchorService,
  AnchorStatus,
  StreamUtils,
  AnchorServiceResponse,
  AnchorValidator,
} from "@ceramicnetwork/common";

import type { Dispatcher } from "../../dispatcher";
import Ceramic from "../../ceramic";
import StreamID from "@ceramicnetwork/streamid";
import { DiagnosticsLogger } from "@ceramicnetwork/common";
import type { DagJWS } from 'dids'

const DID_MATCHER =
  "^(did:([a-zA-Z0-9_]+):([a-zA-Z0-9_.-]+(:[a-zA-Z0-9_.-]+)*)((;[a-zA-Z0-9_.:%-]+=[a-zA-Z0-9_.:%-]*)*)(/[^#?]*)?)([?][^#]*)?(#.*)?";
const CHAIN_ID = "inmemory:12345";

class Candidate {
  constructor(
    readonly cid: CID,
    readonly streamId?: StreamID,
    readonly log?: CID[]
  ) {}

  get key(): string {
    return this.streamId.toString();
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
class InMemoryAnchorService implements AnchorService, AnchorValidator {
  #ceramic: Ceramic;
  #dispatcher: Dispatcher;
  #logger: DiagnosticsLogger;

  readonly #anchorDelay: number;
  readonly #anchorOnRequest: boolean;
  readonly #verifySignatures: boolean;
  readonly #feed: Subject<AnchorServiceResponse> = new Subject();

  // Maps CID of a specific anchor request to the current status of that request
  readonly #anchors: Map<string, AnchorServiceResponse> = new Map()

  #queue: Candidate[] = [];

  constructor(_config: InMemoryAnchorConfig) {
    this.#anchorDelay = _config?.anchorDelay ?? 100;
    this.#anchorOnRequest = _config?.anchorOnRequest ?? true;
    this.#verifySignatures = _config?.verifySignatures ?? true;

    // Remember the most recent AnchorServiceResponse for each anchor request
    this.#feed.subscribe(asr => this.#anchors.set(asr.cid.toString(), asr))
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
   * Filter candidates by stream and DIDs
   * @private
   */
  async _findCandidates(): Promise<Candidate[]> {
    const groupedCandidates = await this._groupCandidatesByStreamId(this.#queue);
    return this._selectValidCandidates(groupedCandidates);
  }

  async _groupCandidatesByStreamId(
    candidates: Candidate[]
  ): Promise<Record<string, Candidate[]>> {
    const result: Record<string, Candidate[]> = {};
    await Promise.all(
      candidates.map(async (req) => {
        try {
          const record = await this.#dispatcher.retrieveCommit(req.cid, req.streamId);
          if (this.#verifySignatures) {
            await this.verifySignedCommit(record);
          }

          const log = await this._loadCommitHistory(req.cid);
          const candidate = new Candidate(req.cid, req.streamId, log);

          if (!result[candidate.key]) {
            result[candidate.key] = [];
          }
          result[candidate.key].push(candidate);
        } catch (e) {
          this.#logger.err(e)
          this._failCandidate(req, e.message);
        }
      })
    );
    return result;
  }

  _selectValidCandidates(
    groupedCandidates: Record<string, Candidate[]>
  ): Candidate[] {
    const result: Candidate[] = [];
    for (const compositeKey of Object.keys(groupedCandidates)) {
      const candidates = groupedCandidates[compositeKey];

      // When there are multiple valid candidate tips to anchor for the same streamId, pick the one
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
      message = `Rejecting request to anchor CID ${candidate.cid.toString()} for stream ${candidate.streamId.toString()} because there is a better CID to anchor for the same stream`;
    }
    this.#feed.next({
      status: AnchorStatus.FAILED,
      streamId: candidate.streamId,
      cid: candidate.cid,
      message,
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
      const currentCommit = await this.#dispatcher.retrieveCommit(
        currentCommitId
      );
      if (StreamUtils.isAnchorCommit(currentCommit)) {
        return history;
      }

      let prevCommitId: CID;
      if (StreamUtils.isSignedCommit(currentCommit)) {
        const payload = await this.#dispatcher.retrieveCommit(
          currentCommit.link
        );
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
  set ceramic(ceramic: Ceramic) {
    this.#ceramic = ceramic;
    this.#dispatcher = this.#ceramic.dispatcher;
    this.#logger = this.#ceramic?.context?.loggerProvider.getDiagnosticsLogger();
  }

  get url() {
    return "<inmemory>"
  }

  /**
   * Send request to the anchoring service
   * @param streamId - Stream ID
   * @param tip - Commit CID
   */
  requestAnchor(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse> {
    const candidate = new Candidate(tip, streamId);
    if (this.#anchorOnRequest) {
      this._process(candidate).catch((error) => {
        this.#feed.next({
          status: AnchorStatus.FAILED,
          streamId: candidate.streamId,
          cid: candidate.cid,
          message: error.message,
        });
      });
    } else {
      this.#queue.push(candidate);
    }
    this.#feed.next({
      status: AnchorStatus.PENDING,
      streamId: streamId,
      cid: tip,
      message: "Sending anchoring request",
      anchorScheduledFor: null,
    })
    return this.pollForAnchorResponse(streamId, tip)
  }

  /**
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse> {
    const anchorResponse = this.#anchors.get(tip.toString())
    const feed$ = this.#feed.pipe(
      filter((asr) => asr.streamId.equals(streamId) && asr.cid.equals(tip))
    );

    if (anchorResponse) {
      return concat(
        of<AnchorServiceResponse>(anchorResponse),
        feed$
      );
    } else {
      return of<AnchorServiceResponse>({
          status: AnchorStatus.FAILED,
          streamId,
          cid: tip,
          message: "Request not found",
        });
    }
  }

  /**
   * Process single candidate
   * @private
   */
  async _process(leaf: Candidate): Promise<void> {
    // creates fake anchor commit
    const timestamp = Math.floor(Date.now() / 1000)
    const proofData: AnchorProof = {
      chainId: CHAIN_ID,
      blockNumber: timestamp,
      blockTimestamp: timestamp,
      txHash: new CID(SAMPLE_ETH_TX_HASH),
      root: leaf.cid,
    };
    const proof = await this.#dispatcher.storeCommit(proofData);
    const commit = { proof, path: "", prev: leaf.cid };
    const cid = await this.#dispatcher.storeCommit(commit, leaf.streamId);

    // add a delay
    const handle = setTimeout(() => {
      this.#feed.next({
        status: AnchorStatus.ANCHORED,
        streamId: leaf.streamId,
        cid: leaf.cid,
        message: "CID successfully anchored",
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
  async verifySignedCommit(commit: DagJWS): Promise<string> {
    try {
      const { kid } = await this.#ceramic.did.verifyJWS(commit)
      return kid.match(RegExp(DID_MATCHER))[1];
    } catch (e) {
      throw new Error('Invalid signature for signed commit. ' + e)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateChainInclusion(proof: AnchorProof): Promise<void> {
    // always valid
  }
}

export default InMemoryAnchorService;
