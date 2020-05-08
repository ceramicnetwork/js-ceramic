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
const _3id_blockchain_utils_1 = require("3id-blockchain-utils");
const utils_1 = require("./utils");
class AccountLinks {
    constructor(ceramicDoc, _ceramic, provider) {
        this.ceramicDoc = ceramicDoc;
        this._ceramic = _ceramic;
        this.provider = provider;
        this._accountLinkDocuments = {};
        this.ceramicDoc.on('change', this._loadAccountLinkDocs.bind(this));
    }
    getLinkedAddresses() {
        return Object.keys(this._accountLinkDocuments);
    }
    linkAddress(address, proof) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!proof) {
                if (!this.provider) {
                    throw new Error('Provider must be set');
                }
                proof = yield _3id_blockchain_utils_1.createLink(this.ceramicDoc.state.owners[0], address, this.provider);
            }
            const caip10Address = yield this._convertToCaip10(address);
            if (this._accountLinkDocuments[caip10Address]) {
                throw new Error(`Address ${caip10Address} already linked`);
            }
            const accountLinkDoc = yield this._ceramic.createDocument(null, 'account-link', {
                owners: [caip10Address],
                onlyGenesis: true
            });
            if (accountLinkDoc.content !== this.ceramicDoc.state.owners[0]) {
                yield accountLinkDoc.change(proof);
            }
            yield this.ceramicDoc.change([...this.ceramicDoc.content, accountLinkDoc.id]);
            this._accountLinkDocuments[caip10Address] = accountLinkDoc;
        });
    }
    unlinkAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const caip10Address = yield this._convertToCaip10(address);
            if (!this._accountLinkDocuments[caip10Address]) {
                throw new Error(`Address ${caip10Address} not linked`);
            }
            yield this._accountLinkDocuments[caip10Address].change('');
            const newContent = this.ceramicDoc.content.filter((docId) => docId !== this._accountLinkDocuments[caip10Address].id);
            yield this.ceramicDoc.change(newContent);
            delete this._accountLinkDocuments[caip10Address];
        });
    }
    _loadAccountLinkDocs() {
        return __awaiter(this, void 0, void 0, function* () {
            const docs = yield Promise.all(this.ceramicDoc.content.map((docId) => this._ceramic.loadDocument(docId)));
            this._accountLinkDocuments = docs.reduce((acc, doc) => {
                acc[doc.state.owners[0]] = doc;
                return acc;
            }, {});
        });
    }
    _convertToCaip10(address) {
        return __awaiter(this, void 0, void 0, function* () {
            let [accountAddress, chainId] = address.split('@');
            if (!chainId) {
                let netVersion;
                try {
                    netVersion = yield utils_1.callRpc(this.provider, 'net_version');
                }
                catch (err) {
                    console.warn('Provider RPC error, defaulting net_version to "1"', err);
                    netVersion = '1';
                }
                chainId = 'eip155:' + netVersion;
            }
            return [accountAddress, chainId].join('@').toLowerCase();
        });
    }
    static load(docId, ceramic, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const ceramicDoc = yield ceramic.loadDocument(docId);
            const accountLinks = new AccountLinks(ceramicDoc, ceramic, provider);
            yield accountLinks._loadAccountLinkDocs();
            return accountLinks;
        });
    }
    static build(owner, ceramic, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const genesisContent = [];
            const ceramicDoc = yield ceramic.createDocument(genesisContent, 'tile', { owners: [owner] });
            const accountLinks = new AccountLinks(ceramicDoc, ceramic, provider);
            yield accountLinks._loadAccountLinkDocs();
            return accountLinks;
        });
    }
}
exports.default = AccountLinks;
//# sourceMappingURL=accountLinks.js.map