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
function safeSend(provider, data) {
    const send = (provider.sendAsync ? provider.sendAsync : provider.send).bind(provider);
    return new Promise((resolve, reject) => {
        send(data, function (err, result) {
            if (err)
                reject(err);
            else if (result.error)
                reject(result.error);
            else
                resolve(result.result);
        });
    });
}
exports.safeSend = safeSend;
function encodeRpcCall(method, params, fromAddress) {
    return {
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
        fromAddress
    };
}
exports.encodeRpcCall = encodeRpcCall;
function callRpc(provider, method, params, fromAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        return safeSend(provider, encodeRpcCall(method, params, fromAddress));
    });
}
exports.callRpc = callRpc;
//# sourceMappingURL=utils.js.map