import { type TypeOf, literal, optional, sparse, strict, string, union } from 'codeco'

import { cidAsString } from './ipld.js'
import { streamIdAsString } from './stream.js'
import { uint8array } from './binary.js'

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

export const AnchorProof = sparse(
  {
    chainId: string,
    txHash: cidAsString,
    root: cidAsString,
    txType: optional(string),
  },
  'AnchorProof'
)
export type AnchorProof = TypeOf<typeof AnchorProof>

export const AnchorCommit = strict(
  {
    id: cidAsString,
    prev: cidAsString,
    proof: cidAsString,
    path: string,
  },
  'AnchorCommit'
)
export type AnchorCommit = TypeOf<typeof AnchorCommit>

export const AnchorServicePending = strict(
  {
    status: literal(AnchorStatus.PENDING),
    streamId: streamIdAsString,
    cid: cidAsString,
    message: string,
  },
  'AnchorServicePending'
)
export type AnchorServicePending = TypeOf<typeof AnchorServicePending>

export const AnchorServiceProcessing = strict(
  {
    status: literal(AnchorStatus.PROCESSING),
    streamId: streamIdAsString,
    cid: cidAsString,
    message: string,
  },
  'AnchorServiceProcessing'
)
export type AnchorServiceProcessing = TypeOf<typeof AnchorServiceProcessing>

export const AnchorServiceAnchored = strict(
  {
    status: literal(AnchorStatus.ANCHORED),
    streamId: streamIdAsString,
    cid: cidAsString,
    message: string,
    anchorCommit: cidAsString,
    carBytes: optional(uint8array), // TODO(CDB-2519): make this required once all CAS envs are returning car files
  },
  'AnchorServiceAnchored'
)
export type AnchorServiceAnchored = TypeOf<typeof AnchorServiceAnchored>

export const AnchorServiceFailed = strict(
  {
    status: literal(AnchorStatus.FAILED),
    streamId: streamIdAsString,
    cid: cidAsString,
    message: string,
  },
  'AnchorServiceFailed'
)
export type AnchorServiceFailed = TypeOf<typeof AnchorServiceFailed>

export const AnchorServiceReplaced = strict(
  {
    status: literal(AnchorStatus.REPLACED),
    streamId: streamIdAsString,
    cid: cidAsString,
    message: string,
  },
  'AnchorServiceReplaced'
)
export type AnchorServiceReplaced = TypeOf<typeof AnchorServiceReplaced>

export const RequestAnchorParams = strict(
  {
    streamID: streamIdAsString,
    tip: cidAsString,
    timestampISO: string, // a result of Date.toISOString()
  },
  'RequestAnchorParams'
)
export type RequestAnchorParams = TypeOf<typeof RequestAnchorParams>

/**
 * Describes anchor service response
 */
export const AnchorServiceResponse = union(
  [
    AnchorServicePending,
    AnchorServiceProcessing,
    AnchorServiceAnchored,
    AnchorServiceFailed,
    AnchorServiceReplaced,
  ],
  'AnchorServiceResponse'
)
export type AnchorServiceResponse = TypeOf<typeof AnchorServiceResponse>
