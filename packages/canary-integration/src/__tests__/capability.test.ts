import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { Wallet } from 'ethers'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as PkhDidResolver from 'pkh-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'
import { SiweMessage, Cacao } from 'ceramic-cacao'
import { createCeramic } from '../create-ceramic.js'

let ipfs: IpfsApi
let ceramic: CeramicApi
let wallet: Wallet
let didKey: DID

describe('CACAO Integration test', () => {
  beforeAll(async () => {
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)
    // Create a did:pkh for the user
    wallet = Wallet.fromMnemonic(
      'despair voyage estate pizza main slice acquire mesh polar short desk lyrics'
    )
    // Create did:key for the dApp
    const didKeyProvider = new Ed25519Provider(randomBytes(32))
    didKey = new DID({ provider: didKeyProvider, resolver: KeyDidResolver.getResolver() })
    await didKey.authenticate()
  }, 120000)

  afterAll(async () => {
    await ipfs.stop()
    await ceramic.close()
  })

  test('can update with streamId in capability', async () => {
    // Create a determinstic tiledocument owned by the user
    const deterministicDocument = await TileDocument.deterministic(ceramic, {
      deterministic: true,
      family: 'testCapabilities1',
      controllers: [`did:pkh:eip155:1:${wallet.address}`],
    })

    const streamId = deterministicDocument.id


    // Create CACAO with did:key as aud
    const siweMessage = new SiweMessage({
      domain: 'service.org',
      address: wallet.address,
      chainId: '1',
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

  test('does not allow updating if cacao issuer is not document controller', async () => {
    // Create a determinstic tiledocument owned by the user
    const deterministicDocument = await TileDocument.deterministic(ceramic, {
      deterministic: true,
      family: 'testCapabilities2',
    })

    const streamId = deterministicDocument.id

    // Create CACAO with did:key as aud
    const siweMessage = new SiweMessage({
      domain: 'service.org',
      address: wallet.address,
      chainId: '1',
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

    await expect(
      deterministicDocument.update({ foo: 'baz' }, null, {
        asDID: didKeyWithCapability,
        anchor: false,
        publish: false,
      })
    ).rejects.toThrow(/invalid_jws/)
  }, 30000)

  test('fails to update using capability with invalid resource', async () => {
    // Create a determinstic tiledocument owned by the user
    const deterministicDocument = await TileDocument.deterministic(ceramic, {
      deterministic: true,
      family: 'testCapabilities3',
      controllers: [`did:pkh:eip155:1:${wallet.address}`],
    })

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
  }, 30000)

  test('can update stream with family resource', async () => {
    const family = 'testFamily1'
    // Create a determinstic tiledocument owned by the user
    const deterministicDocument = await TileDocument.deterministic(ceramic, {
      deterministic: true,
      family,
      controllers: [`did:pkh:eip155:1:${wallet.address}`],
    })

    const streamId = deterministicDocument.id

    // Create CACAO with did:key as aud
    const siweMessage = new SiweMessage({
      domain: 'service.org',
      address: wallet.address,
      chainId: '1',
      statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
      uri: didKey.id,
      version: '1',
      nonce: '23423423',
      issuedAt: new Date().toISOString(),
      resources: [`ceramic://*?family=${family}`],
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

  test('fails to update using capability with wrong family resource', async () => {
    const family = 'testFamily1'
    // Create a determinstic tiledocument owned by the user
    const deterministicDocument = await TileDocument.deterministic(ceramic, {
      deterministic: true,
      family,
      controllers: [`did:pkh:eip155:1:${wallet.address}`],
    })

    const streamId = deterministicDocument.id

    // Create CACAO with did:key as aud
    const siweMessage = new SiweMessage({
      domain: 'service.org',
      address: wallet.address,
      chainId: '1',
      statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
      uri: didKey.id,
      version: '1',
      nonce: '23423423',
      issuedAt: new Date().toISOString(),
      resources: [`ceramic://*?family=${family}-wrong`],
    })
    // Sign CACAO with did:pkh
    const signature = await wallet.signMessage(siweMessage.toMessage())
    siweMessage.signature = signature
    const capability = Cacao.fromSiweMessage(siweMessage)
    // Create new did:key with capability attached
    const didKeyWithCapability = didKey.withCapability(capability)
    await didKeyWithCapability.authenticate()

    await expect(
      deterministicDocument.update({ foo: 'baz' }, null, {
        asDID: didKeyWithCapability,
        anchor: false,
        publish: false,
      })
    ).rejects.toThrowError(
      'Capability does not have appropriate permissions to update this TileDocument'
    )
  }, 30000)

  test('fails to update using capability with empty family resource', async () => {
    const family = 'testFamily1'
    // Create a determinstic tiledocument owned by the user
    const deterministicDocument = await TileDocument.deterministic(ceramic, {
      deterministic: true,
      family,
      controllers: [`did:pkh:eip155:1:${wallet.address}`],
    })

    const streamId = deterministicDocument.id

    // Create CACAO with did:key as aud
    const siweMessage = new SiweMessage({
      domain: 'service.org',
      address: wallet.address,
      chainId: '1',
      statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
      uri: didKey.id,
      version: '1',
      nonce: '23423423',
      issuedAt: new Date().toISOString(),
      resources: [`ceramic://*?family=`],
    })
    // Sign CACAO with did:pkh
    const signature = await wallet.signMessage(siweMessage.toMessage())
    siweMessage.signature = signature
    const capability = Cacao.fromSiweMessage(siweMessage)
    // Create new did:key with capability attached
    const didKeyWithCapability = didKey.withCapability(capability)
    await didKeyWithCapability.authenticate()

    await expect(
      deterministicDocument.update({ foo: 'baz' }, null, {
        asDID: didKeyWithCapability,
        anchor: false,
        publish: false,
      })
    ).rejects.toThrowError(
      'Capability does not have appropriate permissions to update this TileDocument'
    )
  }, 30000)
})
