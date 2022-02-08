import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { Wallet } from 'ethers'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as PkhDidResolver from 'pkh-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { SiweMessage, Cacao } from 'ceramic-cacao'
import { createCeramic } from '../create-ceramic.js'

let ipfs: IpfsApi
let ceramic: CeramicApi

beforeAll(async () => {
  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs)
}, 60000)

afterAll(async () => {
  await ipfs.stop()
  await ceramic.close()
})

test('verifies capability with signed commit', async () => {
  // Create a did:pkh for the user
  const wallet = Wallet.fromMnemonic(
    'despair voyage estate pizza main slice acquire mesh polar short desk lyrics'
  )
  const didPkh = new DID({ resolver: PkhDidResolver.getResolver() })
  // Create a determinstic tiledocument owned by the user
  const deterministicDocument = await TileDocument.deterministic(
    ceramic,
    {
      deterministic: true,
      family: 'testCapabilities',
    },
    {
      asDID: didPkh,
    }
  )
  const streamId = deterministicDocument.id

  // Create did:key for the dApp
  const seed = new Uint8Array([
    69, 90, 79, 1, 19, 168, 234, 177, 16, 163, 37, 8, 233, 244, 36, 102, 130, 190, 102, 10, 239, 51,
    191, 199, 40, 13, 2, 63, 94, 119, 183, 225,
  ])
  const didKeyProvider = new Ed25519Provider(seed)
  const didKey = new DID({ provider: didKeyProvider, resolver: KeyDidResolver.getResolver() })
  await didKey.authenticate()

  // Create CACAO with did:key as aud
  const siweMessage = new SiweMessage({
    domain: 'service.org',
    address: wallet.address,
    statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
    uri: didKey.id,
    version: '1',
    nonce: '23423423',
    issuedAt: new Date().toISOString(),
    resources: [`ceramic://${streamId.toString()}`],
  })
  // Sign CACAO with did:pkh
  const signature = await wallet.signMessage(siweMessage.toMessage())
  siweMessage.signature = signature
  const capability = Cacao.fromSiweMessage(siweMessage)
  // Create new did:key with capability attached
  const didKeyWithCapability = didKey.withCapability(capability)
  await didKeyWithCapability.authenticate()

  await deterministicDocument.update({ foo: 'bar' }, null, {
    asDID: didKeyWithCapability,
    anchor: false,
    publish: false,
  })

  expect(deterministicDocument.content).toEqual({ foo: 'bar' })
}, 30000)

test('fails to verify capability with invalid resource', async () => {
  // Create a did:pkh for the user
  const wallet = Wallet.fromMnemonic(
    'despair voyage estate pizza main slice acquire mesh polar short desk lyrics'
  )
  const didPkh = new DID({ resolver: PkhDidResolver.getResolver() })
  // Create a determinstic tiledocument owned by the user
  const deterministicDocument = await TileDocument.deterministic(
    ceramic,
    {
      deterministic: true,
      family: 'testCapabilities',
    },
    {
      asDID: didPkh,
    }
  )

  // Create did:key for the dApp
  const seed = new Uint8Array([
    69, 90, 79, 1, 19, 168, 234, 177, 16, 163, 37, 8, 233, 244, 36, 102, 130, 190, 102, 10, 239, 51,
    191, 199, 40, 13, 2, 63, 94, 119, 183, 225,
  ])
  const didKeyProvider = new Ed25519Provider(seed)
  const didKey = new DID({ provider: didKeyProvider, resolver: KeyDidResolver.getResolver() })
  await didKey.authenticate()

  // Create bad CACAO with did:key as aud
  const badSiweMessage = new SiweMessage({
    domain: 'service.org',
    address: wallet.address,
    statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
    uri: didKey.id,
    version: '1',
    nonce: '23423423',
    issuedAt: new Date().toISOString(),
    resources: [`ceramic://abcdef`],
  })
  // Sign CACAO with did:pkh
  const badSignature = await wallet.signMessage(badSiweMessage.toMessage())
  badSiweMessage.signature = badSignature
  const badCapability = Cacao.fromSiweMessage(badSiweMessage)
  // Create new did:key with capability attached
  const badDidKeyWithCapability = didKey.withCapability(badCapability)
  await badDidKeyWithCapability.authenticate()

  await expect(
    deterministicDocument.update({ foo: 'baz' }, null, {
      asDID: badDidKeyWithCapability,
      anchor: false,
      publish: false,
    })
  ).rejects.toThrowError(
    'Capability does not have appropriate permissions to update this TileDocument'
  )
})
