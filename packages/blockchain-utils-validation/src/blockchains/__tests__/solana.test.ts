import { validateLink } from '../solana'
import { Keypair } from '@solana/web3.js';
import { MessageSignerWalletAdapterProps } from '@solana/wallet-adapter-base';
import { SolanaAuthProvider } from '@ceramicnetwork/blockchain-utils-linking'
import { sign } from '@stablelib/ed25519'

const did = 'did:3:bafysdfwefwe'
const privKey = 'mdqVWeFekT7pqy5T49+tV12jO0m+ESW7ki4zSU9JiCgbL0kJbj5dvQ/PqcDAzZLZqzshVEs01d1KZdmLh4uZIg=='
const chainRef = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
const keyPairEd25519 = Keypair.fromSecretKey(Buffer.from(privKey, 'base64'))

class MyWalletAdapter implements MessageSignerWalletAdapterProps {
  readonly _keyPair: Keypair

  constructor(keyPair: Keypair) {
    this._keyPair = keyPair
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return sign(this._keyPair.secretKey, message)
  }
}

describe('Blockchain: Solana', () => {
  describe('validateLink', () => {
    test(`validate proof for ${chainRef}`, async () => {
      const provider = new MyWalletAdapter(keyPairEd25519)
      const authProvider = new SolanaAuthProvider(provider, keyPairEd25519.publicKey.toString(), chainRef)
      const proof = await authProvider.createLink(did)
      await expect(validateLink(proof)).resolves.toEqual(proof)
    })
  })
})
