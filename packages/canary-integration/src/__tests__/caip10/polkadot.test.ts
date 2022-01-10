import { createCeramic } from '../../create-ceramic'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { Signer, SignerResult } from '@polkadot/api/types'
import * as linking from '@ceramicnetwork/blockchain-utils-linking'
import { KeyringPair } from '@polkadot/keyring/types'
import { TypeRegistry } from '@polkadot/types/create'
import { SignerPayloadRaw } from '@polkadot/types/types'
import { assert, hexToU8a, u8aToHex } from '@polkadot/util'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { createTestKeyring } from '@polkadot/keyring/testing'
import { clearDid, happyPath, wrongProof } from './caip-flows'

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

const seed = hexToU8a('0xabf8e00000000000000000000000000000000000000000000000000000000000')
const registry = new TypeRegistry()
// primary and supported by polkadot extension
const keyringSr25519 = createTestKeyring({ type: 'sr25519' })
const keyringEd25519 = createTestKeyring({ type: 'ed25519' })
const keyringSecp256k = createTestKeyring({ type: 'ecdsa' })

let keyPairSr25519: KeyringPair, keyPairEd25519: KeyringPair, keyPairSecp256k: KeyringPair

let ceramic: CeramicApi
let ipfs: IpfsApi

beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)
  await cryptoWaitReady()
  keyPairSr25519 = keyringSr25519.addFromSeed(seed)
  keyPairEd25519 = keyringEd25519.addFromSeed(seed)
  keyPairSecp256k = keyringSecp256k.addFromSeed(seed)
}, 120000)

afterAll(async () => {
  await ceramic.close()
  await ipfs?.stop()
}, 120000)

test('happy path', async () => {
  await Promise.all(
    [keyPairSr25519, keyPairEd25519, keyPairSecp256k].map(async (keyPair) => {
      const provider = new SingleAccountSigner(registry, keyPair)
      const authProvider = new linking.PolkadotAuthProvider(provider, keyPair.address)
      await happyPath(ceramic, authProvider)
    })
  )
}, 120000)

test('wrong proof', async () => {
  await Promise.all(
    [keyPairSr25519, keyPairEd25519, keyPairSecp256k].map(async (keyPair) => {
      const provider = new SingleAccountSigner(registry, keyPair)
      const authProvider = new linking.PolkadotAuthProvider(provider, keyPair.address)
      await wrongProof(ceramic, authProvider)
    })
  )
}, 120000)

test('clear did', async () => {
  await Promise.all(
    [keyPairSr25519, keyPairEd25519, keyPairSecp256k].map(async (keyPair) => {
      const provider = new SingleAccountSigner(registry, keyPair)
      const authProvider = new linking.PolkadotAuthProvider(provider, keyPair.address)
      await clearDid(ceramic, authProvider)
    })
  )
}, 120000)
