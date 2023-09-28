import type { CID } from 'multiformats/cid'
import type { Observable } from 'rxjs'
import type { CeramicApi } from './ceramic-api.js'
import type { FetchRequest } from './utils/http-utils.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CAR } from 'cartonne'
import type { NotCompleteStatusName } from '@ceramicnetwork/codecs'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'

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
