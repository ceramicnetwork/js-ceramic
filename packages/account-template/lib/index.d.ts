import type { CeramicApi, CeramicDocument } from './types';
import DIDDocument from './did';
import AccountLinks from './accountLinks';
declare class Keychain {
    ceramicDoc: CeramicDocument;
    private _ceramic;
    constructor(ceramicDoc: CeramicDocument, _ceramic: CeramicApi);
    static build(owner: string, ceramic: CeramicApi): Promise<Keychain>;
}
declare class Profile {
    ceramicDoc: CeramicDocument;
    private _ceramic;
    constructor(ceramicDoc: CeramicDocument, _ceramic: CeramicApi);
    static build(owner: string, ceramic: CeramicApi): Promise<Profile>;
}
declare class Sources {
    ceramicDoc: CeramicDocument;
    private _ceramic;
    constructor(ceramicDoc: CeramicDocument, _ceramic: CeramicApi);
    static build(owner: string, ceramic: CeramicApi): Promise<Sources>;
}
declare class Services {
    ceramicDoc: CeramicDocument;
    private _ceramic;
    constructor(ceramicDoc: CeramicDocument, _ceramic: CeramicApi);
    static build(owner: string, ceramic: CeramicApi): Promise<Services>;
}
declare class ThreeIDAccount {
    ceramicDoc: CeramicDocument;
    didDocument: DIDDocument;
    accountLinks: AccountLinks;
    keychain: Keychain;
    profile: Profile;
    sources: Sources;
    services: Services;
    private _ceramic;
    provider?: any;
    [key: string]: any;
    constructor(ceramicDoc: CeramicDocument, didDocument: DIDDocument, accountLinks: AccountLinks, keychain: Keychain, profile: Profile, sources: Sources, services: Services, _ceramic: CeramicApi, provider?: any);
    get DID(): string;
    static build(did: string, ceramic: CeramicApi, provider?: any): Promise<ThreeIDAccount>;
}
export default ThreeIDAccount;
