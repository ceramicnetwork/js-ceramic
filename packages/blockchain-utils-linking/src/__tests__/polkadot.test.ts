import { jest } from '@jest/globals'
import { Signer, SignerResult } from '@polkadot/api/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { SignerPayloadRaw } from '@polkadot/types/types'
import { TypeRegistry } from '@polkadot/types/create'
import { createTestKeyring } from '@polkadot/keyring/testing'
import { assert, hexToU8a, u8aToHex } from '@polkadot/util'
import { PolkadotAuthProvider } from '../polkadot.js'
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

const registry = new TypeRegistry()
let keyPairSr25519: KeyringPair, keyPairEd25519: KeyringPair, keyPairSecp256k: KeyringPair

beforeAll(async () => {
  await cryptoWaitReady()
  keyPairSr25519 = keyringSr25519.addFromSeed(seed)
  keyPairEd25519 = keyringEd25519.addFromSeed(seed)
  keyPairSecp256k = keyringSecp256k.addFromSeed(seed)
  global.Date.now = jest.fn().mockImplementation(() => 666000)
})

afterAll(() => {
  jest.clearAllMocks()
})

test('accountId', async () => {
  const provider = new SingleAccountSigner(registry, keyPairSr25519)
  const authProvider = new PolkadotAuthProvider(provider, keyPairSr25519.address)
  await expect(authProvider.accountId()).resolves.toMatchSnapshot()
})

describe('createLink', () => {
  test('create proof with sr25519', async () => {
    const provider = new SingleAccountSigner(registry, keyPairSr25519)
    const authProvider = new PolkadotAuthProvider(provider, keyPairSr25519.address)
    const proof = await authProvider.createLink(did)
    expect(proof.account).toMatchSnapshot()
    expect(proof.message).toMatchSnapshot()
    expect(proof.type).toMatchSnapshot()
  })
  test('create proof with ed25519', async () => {
    const provider = new SingleAccountSigner(registry, keyPairEd25519)
    const authProvider = new PolkadotAuthProvider(provider, keyPairEd25519.address)
    const proof = await authProvider.createLink(did)
    expect(proof).toMatchSnapshot()
  })
  test('create proof with secp256k', async () => {
    const provider = new SingleAccountSigner(registry, keyPairSecp256k)
    const authProvider = new PolkadotAuthProvider(provider, keyPairSecp256k.address)
    const proof = await authProvider.createLink(did)
    expect(proof).toMatchSnapshot()
  })
  test('address mismatch', async () => {
    const provider = new SingleAccountSigner(registry, keyPairEd25519)
    const authProvider = new PolkadotAuthProvider(provider, keyPairSecp256k.address)
    await expect(authProvider.createLink(did)).rejects.toThrow()
  })
})

test('authenticate', async () => {
  const provider = new SingleAccountSigner(registry, keyPairEd25519)
  const authProvider = new PolkadotAuthProvider(provider, keyPairSecp256k.address)
  await expect(authProvider.authenticate('msg')).rejects.toThrow('Not Implemented')
})
