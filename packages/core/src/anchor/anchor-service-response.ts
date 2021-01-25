import CID from "cids";
import { AnchorStatus } from "@ceramicnetwork/common";
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
