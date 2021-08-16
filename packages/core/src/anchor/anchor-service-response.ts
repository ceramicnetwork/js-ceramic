import CID from 'cids'

/**
 * Describes anchor service response
 */
export default interface AnchorServiceResponse {
  readonly cid: CID
  readonly status: string
  readonly message: string
  readonly anchorScheduledFor?: number
  readonly anchorCommit?: CID
}
