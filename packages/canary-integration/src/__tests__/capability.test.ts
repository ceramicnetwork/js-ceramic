import { CeramicApi, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { Wallet } from 'ethers'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as KeyDidResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'
import { SiweMessage, Cacao } from 'ceramic-cacao'
import { createCeramic } from '../create-ceramic.js'

const addCapToDid = async (wallet, didKey, resource) => {
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
    resources: [resource],
  })
  // Sign CACAO with did:pkh
  const signature = await wallet.signMessage(siweMessage.toMessage())
  siweMessage.signature = signature
  const capability = Cacao.fromSiweMessage(siweMessage)
  // Create new did:key with capability attached
  const didKeyWithCapability = didKey.withCapability(capability)
  await didKeyWithCapability.authenticate()
  return didKeyWithCapability
}

describe('CACAO Integration test', () => {
  let ipfs: IpfsApi
  let ceramic: CeramicApi
  let wallet: Wallet
  let didKey: DID
  let didKeyWithParent: DID

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
    didKeyWithParent = new DID({
      provider: didKeyProvider,
      resolver: KeyDidResolver.getResolver(),
      parent: `did:pkh:eip155:1:${wallet.address}`,
    })
    await didKeyWithParent.authenticate()
  }, 120000)

  afterAll(async () => {
    await ipfs.stop()
    await ceramic.close()
  }, 30000)

  describe('Updates without CACAO should fail', () => {
    test('can not update with stream without capability', async () => {
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testCapabilities1',
        controllers: [`did:pkh:eip155:1:${wallet.address}`],
      })
      const streamId = deterministicDocument.id

      await expect(
        deterministicDocument.update({ foo: 'bar' }, null, {
          asDID: didKey,
          anchor: false,
          publish: false,
        })
      ).rejects.toThrowError(/invalid_jws: not a valid verificationMethod for issuer:/)
    }, 30000)

    test('can not create new stream without capability', async () => {
      const family = 'testFamily1'
      await expect(
        TileDocument.create(
          ceramic,
          { foo: 'bar' },
          {
            family: `${family}`,
            controllers: [`did:pkh:eip155:1:${wallet.address}`],
          },
          {
            asDID: didKey,
            anchor: false,
            publish: false,
          }
        )
      ).rejects.toThrowError(/invalid_jws: not a valid verificationMethod for issuer:/)
    }, 30000)
  })

  describe('Resources using StreamId', () => {
    test('can update with streamId in capability', async () => {
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testCapabilities1',
        controllers: [`did:pkh:eip155:1:${wallet.address}`],
      })
      const streamId = deterministicDocument.id
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://${streamId.toString()}`
      )

      await deterministicDocument.update({ foo: 'bar' }, null, {
        asDID: didKeyWithCapability,
        anchor: false,
        publish: false,
      })

      expect(deterministicDocument.content).toEqual({ foo: 'bar' })
    }, 30000)

    test('fails to update if cacao issuer is not document controller', async () => {
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testCapabilities2',
      })
      const streamId = deterministicDocument.id
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://${streamId.toString()}`
      )

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
      const badDidKeyWithCapability = await addCapToDid(wallet, didKey, `ceramic://abcdef`)

      await expect(
        deterministicDocument.update({ foo: 'baz' }, null, {
          asDID: badDidKeyWithCapability,
          anchor: false,
          publish: false,
        })
      ).rejects.toThrowError(
        'Capability does not have appropriate permissions to update this Stream'
      )
    }, 30000)
  })

  describe('Resources using family', () => {
    describe('Update stream', () => {
      test('fails to update using capability with wrong family resource', async () => {
        const family = 'testFamily2'
        // Create a determinstic tiledocument owned by the user
        const deterministicDocument = await TileDocument.deterministic(ceramic, {
          deterministic: true,
          family,
          controllers: [`did:pkh:eip155:1:${wallet.address}`],
        })
        const streamId = deterministicDocument.id
        const didKeyWithCapability = await addCapToDid(
          wallet,
          didKey,
          `ceramic://*?family=${family}-wrong`
        )

        await expect(
          deterministicDocument.update({ foo: 'baz' }, null, {
            asDID: didKeyWithCapability,
            anchor: false,
            publish: false,
          })
        ).rejects.toThrowError(
          'Capability does not have appropriate permissions to update this Stream'
        )
      }, 30000)

      test('fails to update using capability with empty family resource', async () => {
        const family = 'testFamily3'
        // Create a determinstic tiledocument owned by the user
        const deterministicDocument = await TileDocument.deterministic(ceramic, {
          deterministic: true,
          family,
          controllers: [`did:pkh:eip155:1:${wallet.address}`],
        })
        const streamId = deterministicDocument.id
        const didKeyWithCapability = await addCapToDid(wallet, didKey, `ceramic://*?family=`)

        await expect(
          deterministicDocument.update({ foo: 'baz' }, null, {
            asDID: didKeyWithCapability,
            anchor: false,
            publish: false,
          })
        ).rejects.toThrowError(
          'Capability does not have appropriate permissions to update this Stream'
        )
      }, 30000)

      test('fails to update if cacao issuer is not document controller using family resource', async () => {
        const family = 'testFamily4'
        // Create a determinstic tiledocument owned by the user
        const deterministicDocument = await TileDocument.deterministic(ceramic, {
          deterministic: true,
          family,
        })
        const streamId = deterministicDocument.id
        const didKeyWithCapability = await addCapToDid(
          wallet,
          didKey,
          `ceramic://*?family=${family}`
        )

        await expect(
          deterministicDocument.update({ foo: 'baz' }, null, {
            asDID: didKeyWithCapability,
            anchor: false,
            publish: false,
          })
        ).rejects.toThrow(/invalid_jws/)
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
        const didKeyWithCapability = await addCapToDid(
          wallet,
          didKey,
          `ceramic://*?family=${family}`
        )

        await deterministicDocument.update({ foo: 'bar' }, null, {
          asDID: didKeyWithCapability,
          anchor: false,
          publish: false,
        })

        expect(deterministicDocument.content).toEqual({ foo: 'bar' })
      }, 30000)
    })

    describe('Create stream', () => {
      test('can not create new stream with wrong family', async () => {
        const family = 'testFamily1'
        const didKeyWithCapability = await addCapToDid(
          wallet,
          didKey,
          `ceramic://*?family=${family}`
        )

        await expect(
          TileDocument.create(
            ceramic,
            { foo: 'bar' },
            {
              family: `${family}-wrong`,
              controllers: [`did:pkh:eip155:1:${wallet.address}`],
            },
            {
              asDID: didKeyWithCapability,
              anchor: false,
              publish: false,
            }
          )
        ).rejects.toThrowError(
          'Capability does not have appropriate permissions to update this Stream'
        )
      }, 30000)

      test('can create new stream with family resource', async () => {
        const family = 'testFamily1'
        const didKeyWithCapability = await addCapToDid(
          wallet,
          didKey,
          `ceramic://*?family=${family}`
        )

        const doc = await TileDocument.create(
          ceramic,
          { foo: 'bar' },
          {
            family,
            controllers: [`did:pkh:eip155:1:${wallet.address}`],
          },
          {
            asDID: didKeyWithCapability,
            anchor: false,
            publish: false,
          }
        )

        expect(doc.content).toEqual({ foo: 'bar' })
        expect(doc.metadata.controllers).toEqual([`did:pkh:eip155:1:${wallet.address}`])
        expect(doc.metadata.family).toEqual(family)
      }, 30000)
    })
  })

  describe('Resources using wildcard', () => {
    test('update using capability with wildcard * resource', async () => {
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testfamily',
        controllers: [`did:pkh:eip155:1:${wallet.address}`],
      })
      const didKeyWithCapability = await addCapToDid(wallet, didKey, `ceramic://*`)

      await deterministicDocument.update({ foo: 'bar' }, null, {
        asDID: didKeyWithCapability,
        anchor: false,
        publish: false,
      })

      expect(deterministicDocument.content).toEqual({ foo: 'bar' })
    }, 30000)

    test('create the c', async () => {
      const didKeyWithCapability = await addCapToDid(wallet, didKey, `ceramic://*`)

      const doc = await TileDocument.create(
        ceramic,
        { foo: 'bar' },
        {
          controllers: [`did:pkh:eip155:1:${wallet.address}`],
        },
        {
          asDID: didKeyWithCapability,
          anchor: false,
          publish: false,
        }
      )

      expect(doc.content).toEqual({ foo: 'bar' })
      expect(doc.metadata.controllers).toEqual([`did:pkh:eip155:1:${wallet.address}`])
    }, 30000)
  })

  describe('Ceramic dids instance with capability/parent', () => {
    test('can update with streamId in capability', async () => {
      ceramic.did = didKeyWithParent
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testCapabilities1',
      })
      const streamId = deterministicDocument.id
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://${streamId.toString()}`
      )
      ceramic.did = didKeyWithCapability

      await deterministicDocument.update({ foo: 'bar' }, null, {
        anchor: false,
        publish: false,
      })

      expect(deterministicDocument.content).toEqual({ foo: 'bar' })
    }, 30000)

    test('can create new stream with family resource', async () => {
      const family = 'testFamily1'
      const didKeyWithCapability = await addCapToDid(wallet, didKey, `ceramic://*?family=${family}`)
      ceramic.did = didKeyWithCapability

      const doc = await TileDocument.create(
        ceramic,
        { foo: 'bar' },
        {
          family,
        },
        {
          anchor: false,
          publish: false,
        }
      )

      expect(doc.content).toEqual({ foo: 'bar' })
      expect(doc.metadata.controllers).toEqual([`did:pkh:eip155:1:${wallet.address}`])
      expect(doc.metadata.family).toEqual(family)
    }, 30000)

    test('create with wildcard * resource', async () => {
      const didKeyWithCapability = await addCapToDid(wallet, didKey, `ceramic://*`)
      ceramic.did = didKeyWithCapability
      const doc = await TileDocument.create(
        ceramic,
        { foo: 'bar' },
        {},
        {
          anchor: false,
          publish: false,
        }
      )

      expect(doc.content).toEqual({ foo: 'bar' })
      expect(doc.metadata.controllers).toEqual([`did:pkh:eip155:1:${wallet.address}`])
    }, 30000)
  })
})
