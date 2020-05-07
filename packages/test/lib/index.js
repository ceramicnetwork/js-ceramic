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
const ceramic_account_1 = __importDefault(require("@ceramicnetwork/ceramic-account"));
const ceramic_core_1 = __importDefault(require("@ceramicnetwork/ceramic-core"));
const ipfs_1 = __importDefault(require("ipfs"));
const identity_wallet_1 = __importDefault(require("identity-wallet"));
const ceramic_http_client_1 = __importDefault(require("@ceramicnetwork/ceramic-http-client"));
const did = 'did:3:bafyreicsd4dnkghdrnggxvrrfndf2mdwbyrdqhpzbcsl6fzxnictwqyp34';
function getCeramic() {
    return __awaiter(this, void 0, void 0, function* () {
        const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184';
        const ipfs = yield ipfs_1.default.create({ config: { Bootstrap: [] } });
        const ceramic = yield ceramic_core_1.default.create(ipfs);
        const idWallet = new identity_wallet_1.default(() => __awaiter(this, void 0, void 0, function* () { return true; }), { seed });
        yield ceramic.setDIDProvider(idWallet.get3idProvider());
        return ceramic;
    });
}
function getCeramicClient() {
    return __awaiter(this, void 0, void 0, function* () {
        return new ceramic_http_client_1.default();
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const ceramic = yield getCeramicClient();
        const account = yield ceramic_account_1.default.build(did, ceramic);
        console.log({ tile: 'Account', state: account.ceramicDoc.state });
        for (const prop in account) {
            if (account[prop] && account[prop].ceramicDoc) {
                console.log({ tile: prop, state: account[prop].ceramicDoc.state });
            }
        }
    });
}
main()
    .then(() => {
    console.log('MAIN success');
})
    .catch((e) => {
    console.error('MAIN error:', e);
});
//# sourceMappingURL=index.js.map