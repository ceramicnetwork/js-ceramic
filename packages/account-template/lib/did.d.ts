import type { CeramicApi, CeramicDocument } from './types';
declare class DIDDocument {
    ceramicDoc: CeramicDocument;
    private _ceramic;
    constructor(ceramicDoc: CeramicDocument, _ceramic: CeramicApi);
    get did(): string;
    setAccountTile(accountTile: CeramicDocument): Promise<void>;
    static load(did: string, ceramic: CeramicApi): Promise<DIDDocument>;
    static build(keys: {
        managementKey: string;
        signingKey: string;
        encryptionKey: string;
    }, ceramic: CeramicApi): Promise<DIDDocument>;
}
export default DIDDocument;
