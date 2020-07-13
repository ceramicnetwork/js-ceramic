import CID from 'cids'

export default interface AnchorServiceResponse {
    readonly status: string;
    readonly message: string;
    readonly anchorScheduledFor?: number;
    readonly anchorRecord?: CID;
}