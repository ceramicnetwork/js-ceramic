declare function safeSend(provider: any, data: Record<string, any>): Promise<any>;
declare function encodeRpcCall(method: any, params?: any, fromAddress?: any): Record<string, any>;
declare function callRpc(provider: any, method: any, params?: any, fromAddress?: any): Promise<any>;
export { safeSend, encodeRpcCall, callRpc };
