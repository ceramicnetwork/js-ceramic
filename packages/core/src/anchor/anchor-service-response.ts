import type { CID } from 'multiformats/cid'

/**
 * Describes anchor service response
 */
export interface AnchorServiceResponse {
  readonly cid: CID
  readonly status: string
  readonly message: string
  readonly anchorScheduledFor?: number
  readonly anchorCommit?: CID
}
