import CID from "cids";
import type { Observable } from "rxjs";
import { AnchorProof, AnchorStatus } from "./doctype";
import { CeramicApi } from "./ceramic-api";
import DocID from "@ceramicnetwork/docid";

export interface AnchorServicePending {
  readonly status: AnchorStatus.PENDING;
  readonly docId: DocID;
  readonly cid: CID;
  readonly message: string;
  readonly anchorScheduledFor: number;
}

export interface AnchorServiceProcessing {
  readonly status: AnchorStatus.PROCESSING;
  readonly docId: DocID;
  readonly cid: CID;
  readonly message: string;
}

export interface AnchorServiceAnchored {
  readonly status: AnchorStatus.ANCHORED;
  readonly docId: DocID;
  readonly cid: CID;
  readonly message: string;
  readonly anchorRecord: CID;
}

export interface AnchorServiceFailed {
  readonly status: AnchorStatus.FAILED;
  readonly docId: DocID;
  readonly cid: CID;
  readonly message: string;
}

/**
 * Describes anchor service response
 */
export type AnchorServiceResponse =
  | AnchorServicePending
  | AnchorServiceProcessing
  | AnchorServiceAnchored
  | AnchorServiceFailed;

/**
 * Describes anchoring service behavior
 */
export interface AnchorService {
  /**
   * Performs whatever initialization work is required by the specific anchor service implementation
   */
  init(): Promise<void>;

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  ceramic: CeramicApi;

  /**
   * Request anchor commit on blockchain
   * @param docId - Document ID
   * @param tip - CID tip
   */
  requestAnchor(docId: DocID, tip: CID): Observable<AnchorServiceResponse>;

  /**
   * Validate anchor proof commit
   * @param anchorProof - Proof of blockchain inclusion
   */
  validateChainInclusion(anchorProof: AnchorProof): Promise<void>;

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  getSupportedChains(): Promise<Array<string>>;
}
