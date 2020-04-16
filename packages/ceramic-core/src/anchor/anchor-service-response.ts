import CID from 'cids'

export default class AnchorServiceResponse {
    public readonly status: string;
    public readonly message: string;
    public readonly scheduledFor: number;
    public readonly anchorRecord?: CID;

    constructor(status?: string, message?: string, scheduledFor?: number, anchorRecord?: CID) {
        this.status = status;
        this.message = message;
        this.scheduledFor = scheduledFor;
        this.anchorRecord = anchorRecord;
    }
}