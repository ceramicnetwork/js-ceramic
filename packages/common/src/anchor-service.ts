import type { CID } from 'multiformats/cid'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CAR } from 'cartonne'

export enum AnchorRequestStatusName {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  READY = 'READY',
  REPLACED = 'REPLACED',
}

export type NotCompleteStatusName =
  | AnchorRequestStatusName.PENDING
  | AnchorRequestStatusName.PROCESSING
  | AnchorRequestStatusName.FAILED
  | AnchorRequestStatusName.READY
  | AnchorRequestStatusName.REPLACED

/**
 * Describes all anchor statuses
 */
export enum AnchorStatus {
  NOT_REQUESTED = 0,
  PENDING = 1,
  PROCESSING = 2,
  ANCHORED = 3,
  FAILED = 4,
  REPLACED = 5,
}

export enum AnchorServiceAuthMethods {
  DID = 'did',
}

export type AnchorProof = {
  chainId: string
  txHash: CID
  root: CID
  txType?: string
}

export type NotCompleteAnchorEvent = {
  status: NotCompleteStatusName
  message: string
  streamId: StreamID
  cid: CID
}

export type CompleteAnchorEvent = {
  status: AnchorRequestStatusName.COMPLETED
  message: string
  streamId: StreamID
  cid: CID
  witnessCar: CAR
}

export type AnchorEvent = NotCompleteAnchorEvent | CompleteAnchorEvent
