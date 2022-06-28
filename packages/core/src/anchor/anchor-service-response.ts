import type { CID } from 'multiformats/cid'

/**
 * Describes anchor service response
 */
export interface AnchorServiceResponse {
  readonly cid: CID
  readonly status: string
  readonly message: string
  /**
   * 'anchorScheduledFor' is not an accurate representation of when the stream will be anchored, and will be removed
   * in a future version
   * @deprecated
   */
  readonly anchorScheduledFor?: number
  readonly anchorCommit?: CID
}
