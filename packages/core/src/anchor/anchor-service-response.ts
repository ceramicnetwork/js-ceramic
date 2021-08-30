import CID from 'cids'

/**
 * Describes anchor service response
 */
export default interface AnchorServiceResponse {
    readonly status: string;
    readonly message: string;
    readonly anchorScheduledFor?: number;
    readonly anchorCommit?: CID;
}
