import { AnchorStatus, CeramicSigner, IpfsApi, SyncOptions } from '@ceramicnetwork/common'
import { Ceramic, Utils as CoreUtils } from '@ceramicnetwork/core'
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
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { jest } from '@jest/globals'
import type { CID } from 'multiformats/cid'
import type { CAR } from 'cartonne'
import { describeIfV3, testIfV3 } from '@ceramicnetwork/common-test-utils'

function getModelDef(name: string): ModelDefinition {
  return {
    name: name,
    version: '1.0',
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

// should pass on v4 if updated from TileDocument

describe('CACAO Integration test', () => {
  let ipfs: IpfsApi
  let ceramic: Ceramic
  let wallet: Wallet
  let didKey: DID
  let didKeyWithParent: DID
  let didKey2: DID
  let wallet2: Wallet
  let METADATA: ModelInstanceDocumentMetadata
  let MODEL_STREAM_ID_2: StreamID
  let PARENT_WALLET_ADDRESS: string

  beforeAll(async () => {
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)
    // Create a did:pkh for the user
    wallet = Wallet.fromMnemonic(
      'despair voyage estate pizza main slice acquire mesh polar short desk lyrics'
    )
    wallet2 = Wallet.fromMnemonic(
      'gap heavy cliff slab victory despair wage tiny physical tray situate primary'
    )
    // eip55 allows mixed case addresses, but we expect lowercase for historical reasons
    PARENT_WALLET_ADDRESS = `did:pkh:eip155:1:${wallet.address.toLowerCase()}`
    // Create did:key for the dApp
    const didKeyProvider = new Ed25519Provider(randomBytes(32))
    didKey = new DID({ provider: didKeyProvider, resolver: KeyDidResolver.getResolver() })
    await didKey.authenticate()
    didKeyWithParent = new DID({
      provider: didKeyProvider,
      resolver: KeyDidResolver.getResolver(),
      parent: PARENT_WALLET_ADDRESS,
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

  describeIfV3('Updates without CACAO should fail', () => {
    test('can not update with stream without capability', async () => {
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testCapabilities1',
        controllers: [PARENT_WALLET_ADDRESS],
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
            controllers: [PARENT_WALLET_ADDRESS],
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

  describeIfV3('Resources using StreamId', () => {
    test('can update with streamId in capability', async () => {
      // Create a determinstic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testCapabilities1',
        controllers: [PARENT_WALLET_ADDRESS],
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
        controllers: [PARENT_WALLET_ADDRESS],
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
          controller: PARENT_WALLET_ADDRESS,
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
        controller: PARENT_WALLET_ADDRESS,
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
          controller: PARENT_WALLET_ADDRESS,
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
        controller: PARENT_WALLET_ADDRESS,
      })

      const didKeyWithBadCapability = await addCapToDid(
        wallet2,
        didKey2,
        `ceramic://*?model=${METADATA.model.toString()}`
      )

      await expect(
        doc.replace(CONTENT1, undefined, {
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
        controller: PARENT_WALLET_ADDRESS,
      })

      expect(doc.content).toEqual(CONTENT0)
      expect(doc.metadata.controller).toEqual(PARENT_WALLET_ADDRESS)
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
        controller: PARENT_WALLET_ADDRESS,
      })

      await doc.replace(CONTENT1, {
        asDID: didKeyWithCapability,
        anchor: false,
        publish: false,
      })

      expect(doc.content).toEqual(CONTENT1)
    }, 30000)
  })

  describeIfV3('Resources using wildcard', () => {
    test('update using capability with wildcard * resource', async () => {
      // Create a deterministic tiledocument owned by the user
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: 'testfamily',
        controllers: [PARENT_WALLET_ADDRESS],
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
          controllers: [PARENT_WALLET_ADDRESS],
        },
        {
          asDID: didKeyWithCapability,
          anchor: false,
          publish: false,
        }
      )

      expect(doc.content).toEqual({ foo: 'bar' })
      expect(doc.metadata.controllers).toEqual([PARENT_WALLET_ADDRESS])
    }, 30000)
  })

  describe('Ceramic dids instance with capability/parent', () => {
    testIfV3(
      'can update tile stream with streamId in capability',
      async () => {
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
      },
      30000
    )

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
      expect(doc.metadata.controller).toEqual(PARENT_WALLET_ADDRESS)
      expect(doc.metadata.model.toString()).toEqual(METADATA.model.toString())

      await doc.replace(CONTENT1, {
        anchor: false,
        publish: false,
      })

      expect(doc.content).toEqual(CONTENT1)
    }, 30000)

    testIfV3(
      'create with wildcard * resource',
      async () => {
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
        expect(doc.metadata.controllers).toEqual([PARENT_WALLET_ADDRESS])
      },
      30000
    )
  })

  describe('CACAO Expiration', () => {
    let didKeyWithCapability
    let opts
    const CACAO_EXPIRATION_WINDOW = 1000 * 60 * 10 // 10 minutes
    const expirationTime = new Date(new Date().valueOf() + CACAO_EXPIRATION_WINDOW)

    // Set current time forward far enough into the future that the CACAO being used has expired
    function expireCacao() {
      const twoDays = 48 * 3600 * 1000 // in ms
      MockDate.set(new Date(new Date().valueOf() + twoDays).toISOString()) // Plus 2 days
    }

    beforeEach(async () => {
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
      jest.resetAllMocks()
    })

    test(
      'Cannot create with expired capability',
      async () => {
        expireCacao()

        await expect(
          ModelInstanceDocument.create(
            ceramic,
            CONTENT0,
            {
              model: METADATA.model,
              controller: PARENT_WALLET_ADDRESS,
            },
            opts
          )
        ).rejects.toThrow(/Capability is expired, cannot create a valid signature/)
      },
      1000 * 60
    )

    test(
      'Cannot apply genesis commit with expired capability',
      async () => {
        // Create genesis commit before capability is expired
        const genesis = await ModelInstanceDocument.makeGenesis(
          CeramicSigner.fromDID(didKeyWithCapability),
          CONTENT0,
          {
            model: METADATA.model,
            controller: PARENT_WALLET_ADDRESS,
          }
        )

        expireCacao()

        // Now attempt to apply genesis commit after capability has expired.
        await expect(
          ceramic.createStreamFromGenesis(ModelInstanceDocument.STREAM_TYPE_ID, genesis, opts)
        ).rejects.toThrow(/Can not verify signature for commit .* CACAO has expired/)
      },
      1000 * 60
    )

    test(
      'Cannot create update with expired capability',
      async () => {
        const doc = await ModelInstanceDocument.create(
          ceramic,
          CONTENT0,
          {
            model: METADATA.model,
            controller: PARENT_WALLET_ADDRESS,
          },
          opts
        )

        expireCacao()

        await expect(doc.replace(CONTENT1, null, opts)).rejects.toThrow(
          /Capability is expired, cannot create a valid signature/
        )
      },
      1000 * 60
    )

    test(
      'Cannot apply update with expired capability',
      async () => {
        const doc = await ModelInstanceDocument.create(
          ceramic,
          CONTENT0,
          {
            model: METADATA.model,
            controller: PARENT_WALLET_ADDRESS,
          },
          { ...opts, anchor: true }
        )

        // Anchor genesis commit so that the CACAO for the genesis commit stays valid.
        await CoreUtils.anchorUpdate(ceramic, doc)

        // Make the commit before the CACAO has expired
        const commit = await ModelInstanceDocument.makeUpdateCommit(
          CeramicSigner.fromDID(didKeyWithCapability),
          doc.commitId,
          doc.content,
          CONTENT1
        )

        expireCacao()

        // Now attempt to apply the commit after the CACAO has expired
        await expect(ceramic.applyCommit(doc.id, commit, opts)).rejects.toThrow(
          /Can not verify signature for commit .* CACAO has expired/
        )
      },
      1000 * 60
    )

    test(
      'Can update with expired capability within 24 hour grace period',
      async () => {
        const doc = await ModelInstanceDocument.create(
          ceramic,
          CONTENT0,
          {
            model: METADATA.model,
            controller: PARENT_WALLET_ADDRESS,
          },
          opts
        )

        // Make the commit before the CACAO has expired
        const commit = await ModelInstanceDocument.makeUpdateCommit(
          CeramicSigner.fromDID(didKeyWithCapability),
          doc.commitId,
          doc.content,
          CONTENT1
        )

        // Ceramic uses a 24 hour grace period during which it continues to accept expired CACAOs.
        // So we set the current time to 12 hours past the CACAO expiration time, which should still
        // be considered within the grace period.
        const twelveHours = 1000 * 60 * 60 * 12 // in ms
        const withinGracePeriod = new Date(expirationTime.valueOf() + twelveHours)
        MockDate.set(withinGracePeriod.toISOString())

        // Now attempt to apply the commit after the CACAO has expired
        // (but still inside the grace period)
        await ceramic.applyCommit(doc.id, commit, opts)
        await doc.sync()

        expect(doc.content).toEqual(CONTENT1)
      },
      1000 * 60
    )

    testIfV3(
      'overwrite expired capability when SYNC_ALWAYS',
      async () => {
        const opts = { asDID: didKeyWithCapability, anchor: false, publish: false }
        const tile = await TileDocument.deterministic(
          ceramic,
          { controllers: [PARENT_WALLET_ADDRESS], family: 'loving-one' },
          opts
        )
        await tile.update({ a: 2 }, null, { ...opts, anchor: true })
        await CoreUtils.anchorUpdate(ceramic, tile)
        await tile.update({ a: 3 }, null, opts)

        // 1. While CACAO is valid: Loading is ok
        const loaded0 = await TileDocument.load(ceramic, tile.id, { sync: SyncOptions.SYNC_ALWAYS })
        const loaded1 = await TileDocument.load(ceramic, tile.id)
        expect(tile.content['a']).toEqual(3)
        expect(loaded0.state).toEqual(tile.state)
        expect(loaded1.state).toEqual(tile.state)
        // 2. It is expired: Rewrite the state!
        expireCacao()
        await expect(TileDocument.load(ceramic, tile.id)).rejects.toThrow(/CACAO expired/) // No sync options
        const loaded3 = await TileDocument.load(ceramic, tile.id, { sync: SyncOptions.SYNC_ALWAYS })
        expect(loaded3.content['a']).toEqual(2)
        expect(loaded3.state.log).toEqual(tile.state.log.slice(0, 3))
        const loaded4 = await TileDocument.load(ceramic, tile.id) // Has the state been rewritten?
        expect(loaded4.state.log).toEqual(loaded3.state.log) // Rewritten!
      },
      30000
    )

    testIfV3(
      'overwrite expired capability when using SYNC_ON_ERROR',
      async () => {
        const opts = { asDID: didKeyWithCapability, anchor: false, publish: false }
        const tile = await TileDocument.deterministic(
          ceramic,
          { controllers: [PARENT_WALLET_ADDRESS], family: 'loving-two' },
          opts
        )
        await tile.update({ a: 2 }, null, { ...opts, anchor: true })
        await CoreUtils.anchorUpdate(ceramic, tile)
        await tile.update({ a: 3 }, null, opts)

        // 1. While CACAO is valid: Loading is ok
        const loaded0 = await TileDocument.load(ceramic, tile.id, { sync: SyncOptions.SYNC_ALWAYS })
        const loaded1 = await TileDocument.load(ceramic, tile.id)
        expect(tile.content['a']).toEqual(3)
        expect(loaded0.state).toEqual(tile.state)
        expect(loaded1.state).toEqual(tile.state)
        // 2. It is expired: Rewrite the state!
        expireCacao()
        await expect(TileDocument.load(ceramic, tile.id)).rejects.toThrow(/CACAO expired/) // No sync options
        const loaded3 = await TileDocument.load(ceramic, tile.id, {
          sync: SyncOptions.SYNC_ON_ERROR,
        })
        expect(loaded3.content['a']).toEqual(2)
        expect(loaded3.state.log).toEqual(tile.state.log.slice(0, 3))
        const loaded4 = await TileDocument.load(ceramic, tile.id) // Has the state been rewritten?
        expect(loaded4.state.log).toEqual(loaded3.state.log) // Rewritten!
      },
      30000
    )

    test(
      'Load anchored stream at CommitID after CACAO expiration',
      async () => {
        const opts = { asDID: didKeyWithCapability, anchor: false, publish: false }
        const doc = await ModelInstanceDocument.create(
          ceramic,
          CONTENT0,
          { model: METADATA.model, controller: PARENT_WALLET_ADDRESS },
          opts
        )
        await doc.replace(CONTENT1, null, { ...opts, anchor: true })
        await CoreUtils.anchorUpdate(ceramic, doc)

        expireCacao()

        // Updating the doc with an expired CACAO should fail
        await expect(doc.replace({ invalidUpdate: 'shouldFail' }, null, opts)).rejects.toThrow(
          /Capability is expired/
        )

        const docCopy = await ModelInstanceDocument.load(ceramic, doc.id, {
          sync: SyncOptions.SYNC_ALWAYS,
        })
        const docAtGenesisCommit = await ModelInstanceDocument.load(ceramic, doc.allCommitIds[0])
        const docAtUpdateCommit = await ModelInstanceDocument.load(ceramic, doc.allCommitIds[1])
        const docAtAnchorCommit = await ModelInstanceDocument.load(ceramic, doc.allCommitIds[2])

        expect(docCopy.content).toEqual(CONTENT1)
        expect(docCopy.state.log.length).toEqual(3)
        expect(docCopy.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

        expect(docAtGenesisCommit.content).toEqual(CONTENT0)
        expect(docAtGenesisCommit.state.log.length).toEqual(1)
        expect(docAtGenesisCommit.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

        expect(docAtUpdateCommit.content).toEqual(CONTENT1)
        expect(docAtUpdateCommit.state.log.length).toEqual(2)
        expect(docAtUpdateCommit.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

        expect(docAtAnchorCommit.content).toEqual(CONTENT1)
        expect(docAtAnchorCommit.state.log.length).toEqual(3)
        expect(docAtAnchorCommit.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      },
      1000 * 30
    )

    test('Load at anchor CommitID to inform node of anchor meaning CACAO from genesis isnt actually expired', async () => {
      const updateStateIfPinnedSpy = jest.spyOn(ceramic.repository, '_updateStateIfPinned')
      const pinStateSpy = jest.spyOn(ceramic.repository, '_pin_UNSAFE')
      // Override repository so nothing gets stored in the state store
      updateStateIfPinnedSpy.mockImplementation((_) => Promise.resolve())
      pinStateSpy.mockImplementation((_) => Promise.resolve())

      const doc = await ModelInstanceDocument.create(
        ceramic,
        CONTENT0,
        {
          model: METADATA.model,
          controller: PARENT_WALLET_ADDRESS,
        },
        { asDID: didKeyWithCapability, anchor: true, publish: false }
      )

      // Anchor the update but ensure the Ceramic node doesn't learn about the anchor commit
      const dispatcher = ceramic.dispatcher
      const handleAnchorSpy = jest.spyOn(ceramic.repository, '_handleAnchorCommit')
      const anchorCommitPromise = new Promise<CID>((resolve) => {
        handleAnchorSpy.mockImplementation(async (_, tip, witnessCar: CAR) => {
          // Import CAR but do not apply the commit
          if (doc.tip.equals(tip)) {
            await dispatcher.importCAR(witnessCar, doc.id)
            const anchorCommit = witnessCar.roots[0]
            resolve(anchorCommit)
          }
        })
      })

      const anchorService = ceramic.anchorService
      await anchorService.anchor()

      const anchorCommitCID = await anchorCommitPromise

      await doc.sync({ sync: SyncOptions.NEVER_SYNC })
      expect(doc.state.log).toHaveLength(1) // no anchor commit found

      // Expire the CACAO, loading should fail
      expireCacao()
      // Make sure the node doesn't have state saved in memory for the stream
      ceramic.repository._clearCache()

      await expect(ModelInstanceDocument.load(ceramic, doc.id)).rejects.toThrow(/CACAO has expired/)
      const commitIdBeforeAnchor = doc.commitId
      await expect(ModelInstanceDocument.load(ceramic, commitIdBeforeAnchor)).rejects.toThrow(
        /CACAO has expired/
      )

      // Loading at the anchor commits CommitID should succeed
      const commitIDAtAnchor = CommitID.make(doc.id, anchorCommitCID)
      const loadedAtAnchorCommit = await ModelInstanceDocument.load(ceramic, commitIDAtAnchor)
      expect(loadedAtAnchorCommit.state.log).toHaveLength(2)
      expect(loadedAtAnchorCommit.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Now loading the stream should work because the node now knows about the anchor
      const loaded = await ModelInstanceDocument.load(ceramic, doc.id)
      expect(loaded.state.log).toHaveLength(2)
      expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Loading at the CommitID before the AnchorCommit should still work because the timestamp
      // information from the anchor is copied over even though the anchor commit itself isn't
      // included in the state.
      const loadedAtCommitBeforeAnchor = await ModelInstanceDocument.load(
        ceramic,
        commitIdBeforeAnchor
      )
      expect(loadedAtCommitBeforeAnchor.state.log).toHaveLength(1)
      expect(loadedAtCommitBeforeAnchor.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      // Resyncing outdated handle with the server should pick up the anchor commit
      expect(doc.state.log).toHaveLength(1)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.ANCHORED)
      await doc.sync()
      expect(doc.state.log).toHaveLength(2)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      jest.restoreAllMocks()
    }, 30000)

    test('Load at anchor CommitID to inform node of anchor meaning CACAO from update isnt actually expired', async () => {
      const updateStateIfPinnedSpy = jest.spyOn(ceramic.repository, '_updateStateIfPinned')
      const pinStateSpy = jest.spyOn(ceramic.repository, '_pin_UNSAFE')
      // Override repository so nothing gets stored in the state store
      updateStateIfPinnedSpy.mockImplementation((_) => Promise.resolve())
      pinStateSpy.mockImplementation((_) => Promise.resolve())

      const opts = { asDID: didKeyWithCapability, anchor: false, publish: false }
      const doc = await ModelInstanceDocument.create(
        ceramic,
        CONTENT0,
        {
          model: METADATA.model,
          controller: PARENT_WALLET_ADDRESS,
        },
        opts
      )
      await doc.replace(CONTENT1, null, { ...opts, anchor: true })

      // Anchor the update but ensure the Ceramic node doesn't learn about the anchor commit
      const dispatcher = ceramic.dispatcher
      const handleAnchorSpy = jest.spyOn(ceramic.repository, '_handleAnchorCommit')
      const anchorCommitPromise = new Promise<CID>((resolve) => {
        handleAnchorSpy.mockImplementation(async (_, tip, witnessCar: CAR) => {
          // Import CAR but do not apply the commit
          if (doc.tip.equals(tip)) {
            await dispatcher.importCAR(witnessCar, doc.id)
            const anchorCommit = witnessCar.roots[0]
            resolve(anchorCommit)
          }
        })
      })

      const anchorService = ceramic.anchorService
      await anchorService.anchor()

      const anchorCommitCID = await anchorCommitPromise

      await doc.sync({ sync: SyncOptions.NEVER_SYNC })
      expect(doc.state.log).toHaveLength(2) // no anchor commit found

      // Expire the CACAO, loading should fail
      expireCacao()
      // Make sure the node doesn't have state saved in memory for the stream
      ceramic.repository._clearCache()

      await expect(ModelInstanceDocument.load(ceramic, doc.id)).rejects.toThrow(/CACAO has expired/)
      const commitIdBeforeAnchor = doc.commitId
      await expect(ModelInstanceDocument.load(ceramic, commitIdBeforeAnchor)).rejects.toThrow(
        /CACAO has expired/
      )

      // Loading at the anchor commits CommitID should succeed
      const commitIDAtAnchor = CommitID.make(doc.id, anchorCommitCID)
      const loadedAtAnchorCommit = await ModelInstanceDocument.load(ceramic, commitIDAtAnchor)
      expect(loadedAtAnchorCommit.state.log).toHaveLength(3)
      expect(loadedAtAnchorCommit.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Now loading the stream should work because the node now knows about the anchor
      const loaded = await ModelInstanceDocument.load(ceramic, doc.id)
      expect(loaded.state.log).toHaveLength(3)
      expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Loading at the CommitID before the AnchorCommit should still work because the timestamp
      // information from the anchor is copied over even though the anchor commit itself isn't
      // included in the state.
      const loadedAtCommitBeforeAnchor = await ModelInstanceDocument.load(
        ceramic,
        commitIdBeforeAnchor
      )
      expect(loadedAtCommitBeforeAnchor.state.log).toHaveLength(2)
      expect(loadedAtCommitBeforeAnchor.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      // Resyncing outdated handle with the server should pick up the anchor commit
      expect(doc.state.log).toHaveLength(2)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.ANCHORED)
      await doc.sync()
      expect(doc.state.log).toHaveLength(3)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      jest.restoreAllMocks()
    }, 30000)

    test(
      'Genesis commit applied with valid capability that later expires without being anchored',
      async () => {
        const doc = await ModelInstanceDocument.create(
          ceramic,
          CONTENT0,
          {
            model: METADATA.model,
            controller: PARENT_WALLET_ADDRESS,
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
          doc.replace(CONTENT1, null, {
            ...opts,
            asDID: didKeyWithCurrentCapability,
          })
        ).rejects.toThrow(/CACAO expired/)

        // Update was not applied, but stream handle wasn't reset.
        expect(doc.content).toEqual(CONTENT0)

        // Cannot repair stream even with SyncOptions.SYNC_ALWAYS if it is the genesis commit that
        // messed up.
        await expect(doc.sync()).rejects.toThrow(/CACAO expired/)
        await expect(doc.sync({ sync: SyncOptions.SYNC_ALWAYS })).rejects.toThrow(/CACAO.*expired/)
        expect(doc.content).toEqual(CONTENT0)
      },
      1000 * 60
    )

    testIfV3(
      'Update applied with valid capability that later expires without being anchored',
      async () => {
        const doc = await ModelInstanceDocument.create(
          ceramic,
          CONTENT0,
          {
            model: METADATA.model,
            controller: PARENT_WALLET_ADDRESS,
          },
          { ...opts, anchor: true }
        )
        await CoreUtils.anchorUpdate(ceramic, doc)

        await doc.replace(CONTENT1, null, opts)

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
          doc.replace(CONTENT2, null, {
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
