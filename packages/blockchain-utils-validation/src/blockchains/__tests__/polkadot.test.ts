import polkadot from '../polkadot'
import { Signer, SignerResult } from '@polkadot/api/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { SignerPayloadRaw } from '@polkadot/types/types'
import { TypeRegistry } from '@polkadot/types/create'
import { createTestKeyring } from '@polkadot/keyring/testing'
import { assert, hexToU8a, u8aToHex } from '@polkadot/util'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { cryptoWaitReady } from '@polkadot/util-crypto'

const did = 'did:3:bafysdfwefwe'
const seed = hexToU8a('0xabf8e00000000000000000000000000000000000000000000000000000000000')

// primary and supported by polkadot extension
const keyringSr25519 = createTestKeyring({ type: 'sr25519' })
const keyringEd25519 = createTestKeyring({ type: 'ed25519' })
const keyringSecp256k = createTestKeyring({ type: 'ecdsa' })

class SingleAccountSigner implements Signer {
  readonly #keyringPair: KeyringPair

  constructor(registry: TypeRegistry, keyringPair: KeyringPair) {
    this.#keyringPair = keyringPair
  }

  public async signRaw({ address, data }: SignerPayloadRaw): Promise<SignerResult> {
    assert(address === this.#keyringPair.address, 'Signer does not have the keyringPair')

    return new Promise((resolve): void => {
      const signature = u8aToHex(this.#keyringPair.sign(hexToU8a(data)))
      resolve({ id: 1, signature })
    })
  }
}

describe('Blockchain: Polkadot', () => {
  const registry = new TypeRegistry()
  let keyPairSr25519: KeyringPair, keyPairEd25519: KeyringPair, keyPairSecp256k: KeyringPair

  beforeAll(async () => {
    await cryptoWaitReady()
    keyPairSr25519 = keyringSr25519.addFromSeed(seed)
    keyPairEd25519 = keyringEd25519.addFromSeed(seed)
    keyPairSecp256k = keyringSecp256k.addFromSeed(seed)
  })

  describe('validateLink', () => {
    test('validate proof with sr25519', async () => {
      const provider = new SingleAccountSigner(registry, keyPairSr25519)
      const authProvider = new linking.polkadot.PolkadotAuthProvider(
        provider,
        keyPairSr25519.address
      )
      const proof = await authProvider.createLink(did)
      await expect(polkadot.validateLink(proof)).resolves.toEqual(proof)
    })
    test('validate proof with ed25519', async () => {
      const provider = new SingleAccountSigner(registry, keyPairEd25519)
      const authProvider = new linking.polkadot.PolkadotAuthProvider(
        provider,
        keyPairEd25519.address
      )
      const proof = await authProvider.createLink(did)
      await expect(polkadot.validateLink(proof)).resolves.toEqual(proof)
    })
    test('validate proof with secp256k', async () => {
      const provider = new SingleAccountSigner(registry, keyPairSecp256k)
      const authProvider = new linking.polkadot.PolkadotAuthProvider(
        provider,
        keyPairSecp256k.address
      )
      const proof = await authProvider.createLink(did)
      await expect(polkadot.validateLink(proof)).resolves.toEqual(proof)
    })
  })

  // describe('authenticate', () => {
  //     test('authenticate with sr25519', async () => {
  //         const account = addressToAccountID(keyPairSr25519.address)
  //         const provider = new SingleAccountSigner(registry, keyPairSr25519)
  //         const authSecret = await polkadot.authenticate('msg', account, provider)
  //         expect(authSecret).toMatchSnapshot()
  //     })
  //     test('authenticate with ed25519', async () => {
  //         const account = addressToAccountID(keyPairEd25519.address)
  //         const provider = new SingleAccountSigner(registry, keyPairEd25519)
  //         const authSecret = await polkadot.authenticate('msg', account, provider)
  //         expect(authSecret).toMatchSnapshot()
  //     })
  //     test('authenticate with secp256k', async () => {
  //         const account = addressToAccountID(keyPairSecp256k.address)
  //         const provider = new SingleAccountSigner(registry, keyPairSecp256k)
  //         const authSecret = await polkadot.authenticate('msg', account, provider)
  //         expect(authSecret).toMatchSnapshot()
  //     })
  // })
})
