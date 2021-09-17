import { AccountID } from 'caip'
import { AuthProvider } from './auth-provider'
import { getConsentMessage, LinkProof } from './util'
import { hash } from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'

const stringEncode = (str: string): Uint8Array => {
  return uint8arrays.fromString((str), 'base64pad')
}

const makeUint8 = (str: string): Uint8Array => {
    const utf8Encode = new TextEncoder()
    return utf8Encode.encode(str)
}

export class NearAuthProvider implements AuthProvider {
  readonly isAuthProvider = true

    constructor(
      private readonly keyPair: any,
      private readonly address: string,
      private readonly chainRef: string) 
      {}

    async authenticate(message: string): Promise<string>  {
        const encodedMsg = stringEncode(message)
        const { signature } = await this.keyPair.sign(encodedMsg)
        const digest = hash(signature)
        return `0x${uint8arrays.toString(digest, 'base16')}`
    }

    async createLink(did: string): Promise<LinkProof> {
       
        const { message, timestamp } = getConsentMessage(did, true)
        const altered = makeUint8(message)
        const { signature } = await this.keyPair.sign(altered)
        const sig = uint8arrays.toString(signature, 'base64pad')
        const account = await this.accountId()

        const proof = {
            version: 2,
            type: 'near',
            message,
            signature: sig,
            account: account.toString(),
            timestamp,
        }
        return proof
    }

    async accountId(): Promise<AccountID> {
        return new AccountID({
            address: this.address,
            chainId: `near:${this.chainRef}`,
        })
    }

    withAddress(address: string): AuthProvider {
        return new NearAuthProvider(this.keyPair, address, this.chainRef)
    }
}
