/// <reference types="node" />
declare module '@zondax/filecoin-signing-tools' {
  export type MessageParams = {
    From: string
    To: string
    Value: string
    Method: 0
    GasPrice: string
    GasLimit: 1000
    Nonce: 0
    Params: string
    GasFeeCap: string
    GasPremium: string
  }

  export function transactionSerialize(message: MessageParams): string
  export function verifySignature(
    signature: string | Buffer,
    message: MessageParams | string
  ): boolean
}
