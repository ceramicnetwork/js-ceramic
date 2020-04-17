import CID from 'cids'

export default interface AnchorServiceResponse {
    readonly status: string;
    readonly message: string;
    readonly scheduledFor?: number;
    readonly anchorRecord?: CID;
}