import { AnchorStatus, CeramicApi, IpfsApi, SyncOptions, TestUtils } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { DID } from 'dids'
import { Wallet } from 'ethers'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as KeyDidResolver from 'key-did-resolver'
import { randomBytes } from '@stablelib/random'
import { Cacao, SiweMessage } from '@didtools/cacao'
import MockDate from 'mockdate'
import { createCeramic } from '../create-ceramic.js'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadata,
} from '@ceramicnetwork/stream-model-instance'
import { StreamID } from '@ceramicnetwork/streamid'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'

function getModelDef(name: string): ModelDefinition {
  return {
    name: name,
    accountRelation: { type: 'list' },
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      additionalProperties: false,
      properties: {
        myData: {
          type: 'integer',
          maximum: 10000,
          minimum: 0,
        },
      },
      required: ['myData'],
    },
  }
}

const MODEL_DEFINITION = getModelDef('MyModel')
const MODEL_DEFINITION_2 = getModelDef('MyModel_2')
const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }

async function addCapToDid(wallet: Wallet, didKey: DID, resource: string, expirationTime?: string) {
  // Create CACAO with did:key as aud
  const siwePayload: Partial<SiweMessage> = {
    domain: 'service.org',
    address: wallet.address,
    chainId: '1',
    statement: 'I accept the ServiceOrg Terms of Service: https://service.org/tos',
    uri: didKey.id,
    version: '1',
    nonce: '23423423',
    issuedAt: new Date().toISOString(),
    resources: [resource],
  }
  if (expirationTime) siwePayload.expirationTime = expirationTime
  const siweMessage = new SiweMessage(siwePayload)
  // Sign CACAO with did:pkh
  siweMessage.signature = await wallet.signMessage(siweMessage.toMessage())
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
  let didKey2: DID
  let wallet2: Wallet
  let METADATA: ModelInstanceDocumentMetadata
  let MODEL_STREAM_ID_2: StreamID

  beforeAll(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB = 'true'

    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)
    // Create a did:pkh for the user
    wallet = Wallet.fromMnemonic(
      'despair voyage estate pizza main slice acquire mesh polar short desk lyrics'
    )
    wallet2 = Wallet.fromMnemonic(
      'gap heavy cliff slab victory despair wage tiny physical tray situate primary'
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

    const didKeyProvider2 = new Ed25519Provider(randomBytes(32))
    didKey2 = new DID({ provider: didKeyProvider2, resolver: KeyDidResolver.getResolver() })
    await didKey2.authenticate()

    // Create models, get streamids
    const model = await Model.create(ceramic, MODEL_DEFINITION)
    const model2 = await Model.create(ceramic, MODEL_DEFINITION_2)
    MODEL_STREAM_ID_2 = model2.id
    METADATA = { model: model.id }
  }, 120000)

  afterAll(async () => {
    await ceramic.close()
    await ipfs.stop()
  }, 30000)

  describe('Updates without CACAO should fail', () => {
    test('can not update with stream without capability', async () => {
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testCapabilities1',
        controllers: [`did:pkh:eip155:1:${wallet.address}`],
      })

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

  describe('Model instance stream with resources using model', () => {
    test('fails to create using capability with wrong model resource', async () => {
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*?model=${MODEL_STREAM_ID_2.toString()}`
      )

      ceramic.did = didKeyWithCapability

      await expect(
        ModelInstanceDocument.create(ceramic, CONTENT0, {
          model: METADATA.model,
          controller: `did:pkh:eip155:1:${wallet.address}`,
        })
      ).rejects.toThrowError(
        'Capability does not have appropriate permissions to update this Stream'
      )
    }, 30000)

    test('fails to update using capability with wrong model resource', async () => {
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*?model=${METADATA.model.toString()}`
      )

      ceramic.did = didKeyWithCapability

      const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, {
        model: METADATA.model,
        controller: `did:pkh:eip155:1:${wallet.address}`,
      })

      const didKeyWithBadCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*?model=${MODEL_STREAM_ID_2.toString()}`
      )

      ceramic.did = didKeyWithBadCapability

      await expect(
        doc.replace(CONTENT1, {
          asDID: didKeyWithBadCapability,
          anchor: false,
          publish: false,
        })
      ).rejects.toThrowError(
        'Capability does not have appropriate permissions to update this Stream'
      )
    }, 30000)

    test('fails to create using capability with empty model resource', async () => {
      const didKeyWithCapability = await addCapToDid(wallet, didKey, `ceramic://*?model=`)
      ceramic.did = didKeyWithCapability

      await expect(
        ModelInstanceDocument.create(ceramic, CONTENT0, {
          model: METADATA.model,
          controller: `did:pkh:eip155:1:${wallet.address}`,
        })
      ).rejects.toThrowError(
        'Capability does not have appropriate permissions to update this Stream'
      )
    }, 30000)

    test('fails to create if cacao issuer is not document controller using model resource', async () => {
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey2,
        `ceramic://*?model=${METADATA.model.toString()}`
      )
      ceramic.did = didKeyWithCapability

      await expect(
        ModelInstanceDocument.create(ceramic, CONTENT0, {
          model: METADATA.model,
          controller: `did:key:z6MkwDAbu8iqPb2BbMs7jnGGErEu4U5zFYkVxWPb4zSAcg39#z6MkwDAbu8iqPb2BbMs7jnGGErEu4U5zFYkVxWPb4zSAcg39`,
        })
      ).rejects.toThrow(/invalid_jws/)
    }, 30000)

    test('fails to update if cacao issuer is not document controller using model resource', async () => {
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*?model=${METADATA.model.toString()}`
      )

      ceramic.did = didKeyWithCapability

      const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, {
        model: METADATA.model,
        controller: `did:pkh:eip155:1:${wallet.address}`,
      })

      const didKeyWithBadCapability = await addCapToDid(
        wallet2,
        didKey2,
        `ceramic://*?model=${METADATA.model.toString()}`
      )

      await expect(
        doc.replace(CONTENT1, {
          asDID: didKeyWithBadCapability,
          anchor: false,
          publish: false,
        })
      ).rejects.toThrow(/Failed/)
    }, 30000)

    test('can create stream with model resource', async () => {
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*?model=${METADATA.model.toString()}`
      )
      ceramic.did = didKeyWithCapability

      const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, {
        model: METADATA.model,
        controller: `did:pkh:eip155:1:${wallet.address}`,
      })

      expect(doc.content).toEqual(CONTENT0)
      expect(doc.metadata.controller).toEqual(`did:pkh:eip155:1:${wallet.address}`)
      expect(doc.metadata.model.toString()).toEqual(METADATA.model.toString())
    }, 30000)

    test('can create and update stream with model resource', async () => {
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*?model=${METADATA.model.toString()}`
      )
      ceramic.did = didKeyWithCapability

      const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, {
        model: METADATA.model,
        controller: `did:pkh:eip155:1:${wallet.address}`,
      })

      await doc.replace(CONTENT1, {
        asDID: didKeyWithCapability,
        anchor: false,
        publish: false,
      })

      expect(doc.content).toEqual(CONTENT1)
    }, 30000)
  })

  describe('Resources using wildcard', () => {
    test('update using capability with wildcard * resource', async () => {
      // Create a deterministic tiledocument owned by the user
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

    test('create using capability with wildcard * resource', async () => {
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
    test('can update tile stream with streamId in capability', async () => {
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

    test('can create and update new model stream with model resource', async () => {
      const didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*?model=${METADATA.model.toString()}`
      )

      ceramic.did = didKeyWithCapability
      const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, {
        model: METADATA.model,
      })

      expect(doc.content).toEqual(CONTENT0)
      expect(doc.metadata.controller).toEqual(`did:pkh:eip155:1:${wallet.address}`)
      expect(doc.metadata.model.toString()).toEqual(METADATA.model.toString())

      await doc.replace(CONTENT1, {
        anchor: false,
        publish: false,
      })

      expect(doc.content).toEqual(CONTENT1)
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

  describe('CACAO Expiration', () => {
    let didKeyWithCapability
    let opts
    const CACAO_EXPIRATION_WINDOW = 1000 * 60 * 10 // 10 minutes

    // Set curren time forward far enough into the future that the CACAO being used has expired
    function expireCacao() {
      const twoDays = 48 * 3600 * 1000 // in ms
      MockDate.set(new Date(new Date().valueOf() + twoDays).toISOString()) // Plus 2 days
    }

    beforeEach(async () => {
      const expirationTime = new Date(new Date().valueOf() + CACAO_EXPIRATION_WINDOW)
      didKeyWithCapability = await addCapToDid(
        wallet,
        didKey,
        `ceramic://*`,
        expirationTime.toISOString()
      )
      opts = { anchor: false, publish: false, asDID: didKeyWithCapability }
    })

    afterEach(() => {
      MockDate.reset()
    })

    test(
      'Cannot create with expired capability',
      async () => {
        expireCacao()

        await expect(
          TileDocument.create(
            ceramic,
            CONTENT0,
            {
              controllers: [`did:pkh:eip155:1:${wallet.address}`],
            },
            opts
          )
        ).rejects.toThrow(/Capability is expired, cannot create a valid signature/)
      },
      1000 * 60
    )

    test(
      'Cannot update with expired capability',
      async () => {
        const doc = await TileDocument.create(
          ceramic,
          CONTENT0,
          {
            controllers: [`did:pkh:eip155:1:${wallet.address}`],
          },
          opts
        )

        expireCacao()

        await expect(doc.update(CONTENT1, null, opts)).rejects.toThrow(
          /Capability is expired, cannot create a valid signature/
        )
      },
      1000 * 60
    )

    test('overwrite expired capability when SYNC_ALWAYS', async () => {
      const opts = { asDID: didKeyWithCapability, anchor: false, publish: false }
      const tile = await TileDocument.deterministic(
        ceramic,
        { controllers: [`did:pkh:eip155:1:${wallet.address}`], family: 'loving-one' },
        opts
      )
      await tile.update({ a: 2 }, null, opts)
      await tile.update({ a: 3 }, null, opts)

      // 1. While CACAO is valid: Loading is ok
      const loaded0 = await TileDocument.load(ceramic, tile.id, { sync: SyncOptions.SYNC_ALWAYS })
      const loaded1 = await TileDocument.load(ceramic, tile.id)
      expect(loaded0.state).toEqual(tile.state)
      expect(loaded1.state).toEqual(tile.state)
      // 2. It is expired: Rewrite the state!
      expireCacao()
      await expect(TileDocument.load(ceramic, tile.id)).rejects.toThrow(/CACAO expired/) // No sync options
      const loaded3 = await TileDocument.load(ceramic, tile.id, { sync: SyncOptions.SYNC_ALWAYS })
      expect(loaded3.state.log).toEqual(tile.state.log.slice(0, 1))
      const loaded4 = await TileDocument.load(ceramic, tile.id) // Has the state been rewritten?
      expect(loaded4.state.log).toEqual(loaded3.state.log) // Rewritten!
    }, 30000)

    test('Load anchored stream at CommitID after CACAO expiration', async () => {
      const content0 = { a: 0 }
      const content1 = { a: 1 }
      const opts = { asDID: didKeyWithCapability, anchor: false, publish: false }
      const doc = await TileDocument.create(
        ceramic,
        content0,
        { controllers: [`did:pkh:eip155:1:${wallet.address}`] },
        opts
      )
      await doc.update(content1, null, { ...opts, anchor: true })
      await TestUtils.anchorUpdate(ceramic, doc)

      expireCacao()

      // Updating the doc with an expired CACAO should fail
      await expect(doc.update({ invalidUpdate: 'shouldFail' }, null, opts)).rejects.toThrow(
        /Capability is expired/
      )

      const docCopy = await TileDocument.load(ceramic, doc.id)
      const docAtGenesisCommit = await TileDocument.load(ceramic, doc.allCommitIds[0])
      const docAtUpdateCommit = await TileDocument.load(ceramic, doc.allCommitIds[1])
      const docAtAnchorCommit = await TileDocument.load(ceramic, doc.allCommitIds[2])

      expect(docCopy.content).toEqual(content1)
      expect(docCopy.state.log.length).toEqual(3)
      expect(docCopy.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      expect(docAtGenesisCommit.content).toEqual(content0)
      expect(docAtGenesisCommit.state.log.length).toEqual(1)
      expect(docAtGenesisCommit.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      expect(docAtUpdateCommit.content).toEqual(content1)
      expect(docAtUpdateCommit.state.log.length).toEqual(2)
      expect(docAtUpdateCommit.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      expect(docAtAnchorCommit.content).toEqual(content1)
      expect(docAtAnchorCommit.state.log.length).toEqual(3)
      expect(docAtAnchorCommit.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    test(
      'Genesis commit applied with valid capability that later expires without being anchored',
      async () => {
        const doc = await TileDocument.create(
          ceramic,
          CONTENT0,
          {
            controllers: [`did:pkh:eip155:1:${wallet.address}`],
          },
          opts
        )

        expireCacao()

        // Time is now ahead, so the capability used for the genesis commit has expired, but we'll
        // use a new capability so the update is done with a valid capability.
        const didKeyWithCurrentCapability = await addCapToDid(wallet, didKey, `ceramic://*`)

        // Even though the capability for this update is valid, it builds on a commit that was
        // authored with an expired capability and so we should detect that and error.
        await expect(
          doc.update(CONTENT1, null, {
            ...opts,
            asDID: didKeyWithCurrentCapability,
          })
        ).rejects.toThrow(/CACAO expired/)

        // Update was not applied, but stream handle wasn't reset.
        expect(doc.content).toEqual(CONTENT0)

        // Cannot repair stream even with SyncOptions.SYNC_ALWAYS if it is the genesis commit that
        // messed up.
        await expect(doc.sync()).rejects.toThrow(/CACAO expired/)
        await expect(doc.sync({ sync: SyncOptions.SYNC_ALWAYS })).rejects.toThrow(/CACAO expired/)
        expect(doc.content).toEqual(CONTENT0)
      },
      1000 * 60
    )

    test(
      'Update applied with valid capability that later expires without being anchored',
      async () => {
        const doc = await TileDocument.create(
          ceramic,
          CONTENT0,
          {
            controllers: [`did:pkh:eip155:1:${wallet.address}`],
          },
          { ...opts, anchor: true }
        )

        await TestUtils.anchorUpdate(ceramic, doc)

        await doc.update(CONTENT1, null, opts)

        expect(doc.state.log.length).toEqual(3)

        expireCacao()

        // Time is now ahead, so the capability used for the first two updates has expired, but we'll
        // use a new capability so the new update is done with a valid capability.
        const didKeyWithCurrentCapability = await addCapToDid(wallet, didKey, `ceramic://*`)

        // Even though the capability for this update is valid, it builds on a commit that was
        // authored with an expired capability and so we should detect that, error, and revert the
        // state to the genesis state as the genesis state was anchored and so has a timestamp
        // within the capability's expiration window, while the update commit does not and so is
        // now expired
        await expect(
          doc.update(CONTENT2, null, {
            ...opts,
            asDID: didKeyWithCurrentCapability,
          })
        ).rejects.toThrow(/CACAO expired/)

        // Update was not applied, but stream handle wasn't reset.
        expect(doc.content).toEqual(CONTENT1)

        // Can reset the stream state with SyncOptions.SYNC_ALWAYS
        await expect(doc.sync()).rejects.toThrow(/CACAO expired/)
        await doc.sync({ sync: SyncOptions.SYNC_ALWAYS })
        expect(doc.content).toEqual(CONTENT0)
      },
      1000 * 60
    )
  })
})
