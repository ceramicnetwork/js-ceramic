import { jest } from '@jest/globals'
import { MessageSignerWalletAdapterProps } from '@solana/wallet-adapter-base'
import { SOLANA_MAINNET_CHAIN_REF, SolanaAuthProvider } from '../solana.js'
import { Keypair } from '@solana/web3.js'
import { sign } from '@stablelib/ed25519'
import * as uint8arrays from 'uint8arrays'

const did = 'did:3:bafysdfwefwe'
const privKey =
  'mdqVWeFekT7pqy5T49+tV12jO0m+ESW7ki4zSU9JiCgbL0kJbj5dvQ/PqcDAzZLZqzshVEs01d1KZdmLh4uZIg=='
const chainRef = SOLANA_MAINNET_CHAIN_REF

class MyWalletAdapter implements MessageSignerWalletAdapterProps {
  readonly _keyPair: Keypair

  constructor(keyPair: Keypair) {
    this._keyPair = keyPair
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return sign(this._keyPair.secretKey, message)
  }
}

let keyPairEd25519: Keypair

beforeAll(() => {
  keyPairEd25519 = Keypair.fromSecretKey(uint8arrays.fromString(privKey, 'base64'))
  global.Date.now = jest.fn().mockImplementation(() => 666000)
})

afterAll(() => {
  jest.clearAllMocks()
})

describe('Blockchain: Solana', () => {
  describe('createLink', () => {
    test(`create proof for ${chainRef}`, async () => {
      const provider = new MyWalletAdapter(keyPairEd25519)
      const authProvider = new SolanaAuthProvider(
        provider,
        keyPairEd25519.publicKey.toString(),
        chainRef
      )
      const proof = await authProvider.createLink(did)
      expect(proof).toMatchSnapshot()
    })
  })

  describe('authenticate', () => {
    test(`create proof for ${chainRef}`, async () => {
      const provider = new MyWalletAdapter(keyPairEd25519)
      const authProvider = new SolanaAuthProvider(
        provider,
        keyPairEd25519.publicKey.toString(),
        chainRef
      )
      const result = await authProvider.authenticate('msg')
      expect(result).toMatchSnapshot()
    })
  })
})
