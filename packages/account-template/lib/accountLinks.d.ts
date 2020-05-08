import type { CeramicApi, CeramicDocument } from './types';
declare class AccountLinks {
    ceramicDoc: CeramicDocument;
    private _ceramic;
    provider?: any;
    private _accountLinkDocuments;
    constructor(ceramicDoc: CeramicDocument, _ceramic: CeramicApi, provider?: any);
    getLinkedAddresses(): Array<string>;
    linkAddress(address: string, proof?: Record<string, any>): Promise<void>;
    unlinkAddress(address: string): Promise<void>;
    _loadAccountLinkDocs(): Promise<void>;
    _convertToCaip10(address: string): Promise<string>;
    static load(docId: string, ceramic: CeramicApi, provider?: any): Promise<AccountLinks>;
    static build(owner: string, ceramic: CeramicApi, provider?: any): Promise<AccountLinks>;
}
export default AccountLinks;
