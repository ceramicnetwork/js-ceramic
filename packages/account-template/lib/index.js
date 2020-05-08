"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const did_1 = __importDefault(require("./did"));
const accountLinks_1 = __importDefault(require("./accountLinks"));
class Keychain {
    constructor(ceramicDoc, _ceramic) {
        this.ceramicDoc = ceramicDoc;
        this._ceramic = _ceramic;
    }
    static build(owner, ceramic) {
        return __awaiter(this, void 0, void 0, function* () {
            const genesisContent = {
                "privacy-policy-read-keys": [],
                "auth-public-keys": [],
                "auth-data": [],
                "legacy-data": []
            };
            const ceramicDoc = yield ceramic.createDocument(genesisContent, 'tile', { owners: [owner] });
            return new Keychain(ceramicDoc, ceramic);
        });
    }
}
class Profile {
    constructor(ceramicDoc, _ceramic) {
        this.ceramicDoc = ceramicDoc;
        this._ceramic = _ceramic;
    }
    static build(owner, ceramic) {
        return __awaiter(this, void 0, void 0, function* () {
            const genesisContent = {};
            const ceramicDoc = yield ceramic.createDocument(genesisContent, 'tile', { owners: [owner] });
            return new Profile(ceramicDoc, ceramic);
        });
    }
}
class Sources {
    constructor(ceramicDoc, _ceramic) {
        this.ceramicDoc = ceramicDoc;
        this._ceramic = _ceramic;
    }
    static build(owner, ceramic) {
        return __awaiter(this, void 0, void 0, function* () {
            const genesisContent = [];
            const ceramicDoc = yield ceramic.createDocument(genesisContent, 'tile', { owners: [owner] });
            return new Sources(ceramicDoc, ceramic);
        });
    }
}
class Services {
    constructor(ceramicDoc, _ceramic) {
        this.ceramicDoc = ceramicDoc;
        this._ceramic = _ceramic;
    }
    static build(owner, ceramic) {
        return __awaiter(this, void 0, void 0, function* () {
            const genesisContent = [];
            const ceramicDoc = yield ceramic.createDocument(genesisContent, 'tile', { owners: [owner] });
            return new Services(ceramicDoc, ceramic);
        });
    }
}
class ThreeIDAccount {
    constructor(ceramicDoc, didDocument, accountLinks, keychain, profile, sources, services, _ceramic, provider) {
        this.ceramicDoc = ceramicDoc;
        this.didDocument = didDocument;
        this.accountLinks = accountLinks;
        this.keychain = keychain;
        this.profile = profile;
        this.sources = sources;
        this.services = services;
        this._ceramic = _ceramic;
        this.provider = provider;
    }
    get DID() {
        return this.didDocument.did;
    }
    static build(did, ceramic, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const didDocument = yield did_1.default.load(did, ceramic);
            let ceramicDoc;
            if (didDocument.ceramicDoc.content.account) {
                ceramicDoc = yield ceramic.loadDocument(didDocument.ceramicDoc.content.account);
            }
            else {
                const genesisContent = {};
                ceramicDoc = yield ceramic.createDocument(genesisContent, 'tile', { owners: [didDocument.did] });
                yield didDocument.setAccountTile(ceramicDoc);
            }
            let accountLinks;
            if (ceramicDoc.content['account-links']) {
                accountLinks = yield accountLinks_1.default.load(ceramicDoc.content['account-links'], ceramic, provider);
            }
            else {
                accountLinks = yield accountLinks_1.default.build(did, ceramic, provider);
                yield ceramicDoc.change(Object.assign(Object.assign({}, ceramicDoc.content), { 'account-links': accountLinks.ceramicDoc.id }));
            }
            let keychain;
            if (ceramicDoc.content.keychain) {
                const subtileDocument = yield ceramic.loadDocument(ceramicDoc.content.keychain);
                keychain = new Keychain(subtileDocument, ceramic);
            }
            else {
                keychain = yield Keychain.build(did, ceramic);
                yield ceramicDoc.change(Object.assign(Object.assign({}, ceramicDoc.content), { keychain: keychain.ceramicDoc.id }));
            }
            let profile;
            if (ceramicDoc.content.profile) {
                const subtileDocument = yield ceramic.loadDocument(ceramicDoc.content.profile);
                profile = new Profile(subtileDocument, ceramic);
            }
            else {
                profile = yield Profile.build(did, ceramic);
                yield ceramicDoc.change(Object.assign(Object.assign({}, ceramicDoc.content), { profile: profile.ceramicDoc.id }));
            }
            let sources;
            if (ceramicDoc.content.sources) {
                const subtileDocument = yield ceramic.loadDocument(ceramicDoc.content.sources);
                sources = new Sources(subtileDocument, ceramic);
            }
            else {
                sources = yield Sources.build(did, ceramic);
                yield ceramicDoc.change(Object.assign(Object.assign({}, ceramicDoc.content), { sources: sources.ceramicDoc.id }));
            }
            let services;
            if (ceramicDoc.content.services) {
                const subtileDocument = yield ceramic.loadDocument(ceramicDoc.content.services);
                services = new Services(subtileDocument, ceramic);
            }
            else {
                services = yield Services.build(did, ceramic);
                yield ceramicDoc.change(Object.assign(Object.assign({}, ceramicDoc.content), { services: services.ceramicDoc.id }));
            }
            return new ThreeIDAccount(ceramicDoc, didDocument, accountLinks, keychain, profile, sources, services, ceramic, provider);
        });
    }
}
exports.default = ThreeIDAccount;
//# sourceMappingURL=index.js.map