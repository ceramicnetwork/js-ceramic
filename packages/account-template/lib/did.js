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
Object.defineProperty(exports, "__esModule", { value: true });
class DIDDocument {
    constructor(ceramicDoc, _ceramic) {
        this.ceramicDoc = ceramicDoc;
        this._ceramic = _ceramic;
    }
    get did() {
        return 'did:3:' + this.ceramicDoc.state.log[0];
    }
    setAccountTile(accountTile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.ceramicDoc.content.account) {
                throw new Error(`Account tile already linked: ${this.ceramicDoc.content.account}`);
            }
            yield this.ceramicDoc.change(Object.assign(Object.assign({}, this.ceramicDoc.content), { account: accountTile.id }));
        });
    }
    static load(did, ceramic) {
        return __awaiter(this, void 0, void 0, function* () {
            const didPrefix = 'did:3:';
            if (!did.startsWith(didPrefix)) {
                throw new Error('Only 3IDs allowed');
            }
            const cid = did.slice(didPrefix.length);
            const ceramicDoc = yield ceramic.loadDocument(`/ceramic/${cid}`);
            return new DIDDocument(ceramicDoc, ceramic);
        });
    }
    static build(keys, ceramic) {
        return __awaiter(this, void 0, void 0, function* () {
            const ceramicDoc = yield ceramic.createDocument({
                publicKeys: {
                    signing: keys.signingKey,
                    encryption: keys.encryptionKey
                }
            }, '3id', { owners: [keys.managementKey] });
            return new DIDDocument(ceramicDoc, ceramic);
        });
    }
}
exports.default = DIDDocument;
//# sourceMappingURL=did.js.map