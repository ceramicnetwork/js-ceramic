function safeSend (provider: any, data: Record<string, any>): Promise<any> {
  const send = (provider.sendAsync ? provider.sendAsync : provider.send).bind(provider)
  return new Promise((resolve, reject) => {
    send(data, function(err: any, result: any) {
      if (err) reject(err)
      else if (result.error) reject(result.error)
      else resolve(result.result)
    })
  })
}

function encodeRpcCall (method: any, params?: any, fromAddress?: any): Record<string, any> {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params,
    fromAddress
  }
}

async function callRpc (provider: any, method: any, params?: any, fromAddress?: any): Promise<any> {
  return safeSend(provider, encodeRpcCall(method, params, fromAddress))
}

export { safeSend, encodeRpcCall, callRpc }
