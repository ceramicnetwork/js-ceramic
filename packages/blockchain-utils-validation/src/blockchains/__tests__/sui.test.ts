import { validateLink } from '../sui'
import { Base64DataBuffer, Ed25519Keypair } from "@mysten/sui.js";
import { SuiAuthProvider } from '@ceramicnetwork/blockchain-utils-linking'


const did = 'did:3:bafysdfwefwe'
const privKey = 'mdqVWeFekT7pqy5T49+tV12jO0m+ESW7ki4zSU9JiCgbL0kJbj5dvQ/PqcDAzZLZqzshVEs01d1KZdmLh4uZIg=='
const chainRef = 'mainnet'
const keyPairEd25519 = Ed25519Keypair.fromSecretKey(Buffer.from(privKey, 'base64'))

class MyWalletAdapter {
  readonly _keyPair: Ed25519Keypair

  constructor(keyPair: Ed25519Keypair) {
    this._keyPair = keyPair
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const msg = new Base64DataBuffer(message);
    const signature = this._keyPair.signData(msg);
    return signature.getData()
  }
}

describe('Blockchain: ', () => {
  describe('validateLink', () => {
    test(`validate proof for ${chainRef}`, async () => {
      const provider = new MyWalletAdapter(keyPairEd25519)
      const authProvider = new SuiAuthProvider(provider, keyPairEd25519.getPublicKey().toString(), chainRef)
      const proof = await authProvider.createLink(did)
      await expect(validateLink(proof)).resolves.toEqual(proof)
    })
  })
})