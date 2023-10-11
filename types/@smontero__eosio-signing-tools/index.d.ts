declare module '@smontero/eosio-signing-tools' {
  type VerifySignatureArgs = {
    chainId: string
    account: string
    signature: string
    data: string
  }

  export class SigningTools {
    static verifySignature(args: VerifySignatureArgs): Promise<boolean>
  }
}
