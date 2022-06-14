import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CeramicApi, CommitType, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { ModelInstanceDocument, ModelInstanceDocumentMetadata } from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { anchorUpdate } from '@ceramicnetwork/core/lib/state-management/__tests__/anchor-update'
import { Ceramic } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { StreamID } from '@ceramicnetwork/streamid'
import first from 'it-first'
import { Model, ModelAccountRelation, ModelDefinition } from '@ceramicnetwork/stream-model'

const CONTENT_VALID_1 = {
  arrayProperty: [0,2,3,4],
  stringArrayProperty: ["abcdef"],
  stringProperty: "abcdefgh",
  intProperty: 80,
  floatProperty:104,
}

const CONTENT_VALID_2 = {
  arrayProperty: [5,6,7,8],
  stringArrayProperty: ["ABCDEF"],
  stringProperty: "ABCDEFGH",
  intProperty: 81,
  floatProperty:104.1,
}

const CONTENT_VALID_3 = {
  arrayProperty: [1,2],
  stringArrayProperty: ["ABCDEF"],
  stringProperty: "ABCDEFGH",
  intProperty: 81,
  floatProperty:104.1,
}

const CONTENT_VALID_4 = {
  arrayProperty: [5,6,7,8],
  stringArrayProperty: ["ABCDEF", "abcdef"],
  stringProperty: "ABCDEFGH",
  intProperty: 45,
  floatProperty:18.1,
}

const CONTENT_NO_REQ_PROPS = {}

const CONTENT_MINS_NOT_RESPECTED = {
  arrayProperty: [0],
  stringArrayProperty: ["a"],
  stringProperty: "ab",
  intProperty: 1,
  floatProperty:2.9
}

const CONTENT_MAXS_NOT_RESPECTED = {
  arrayProperty: [0,2,3,4,5],
  stringArrayProperty: ["abcdefg"],
  stringProperty: "abcdefghi",
  intProperty: 101,
  floatProperty:115
}

const CONTENT_WITH_ADDITIONAL_PROPERTY = {
  arrayProperty: [0,2,3,4],
  stringArrayProperty: ["abcdef"],
  stringProperty: "abcdefgh",
  intProperty: 80,
  floatProperty:104,
  additionalProperty: "I should not be here"
}

async function isPinned(ceramic: CeramicApi, streamId: StreamID): Promise<boolean> {
  const iterator = await ceramic.pin.ls(streamId)
  return (await first(iterator)) == streamId.toString()
}

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  accountRelation: ModelAccountRelation.LIST,
  schema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    properties: {
      arrayProperty: {
        type: "array",
        items: {
          type: "integer"
        },
        minItems: 2,
        maxItems: 4
      },
      stringArrayProperty: {
        type: "array",
        items: {
          type: "string",
          maxLength: 6,
          minLength: 2
        }
      },
      stringProperty: {
        type: "string",
        maxLength: 8,
        minLength: 3
      },
      intProperty: {
        type: "integer",
        maximum: 100,
        minimum: 2
      },
      floatProperty: {
        type: "number",
        maximum: 110,
        minimum: 3
      }
    },
    required: [
      "arrayProperty",
      "stringArrayProperty",
      "stringProperty",
      "intProperty",
      "floatProperty"
    ]
  }
}

describe('ModelInstanceDocument API http-client tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let core: Ceramic
  let daemon: CeramicDaemon
  let ceramic: CeramicClient
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadata

  beforeAll(async () => {
    ipfs = await createIPFS()
    core = await createCeramic(ipfs)

    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(core, DaemonConfig.fromObject({ 'http-api': { port } }))
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.setDID(core.did)

    model = await Model.create(ceramic, MODEL_DEFINITION)
    midMetadata = { model: model.id }
  }, 12000)

  afterAll(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
    await ipfs.stop()
  })

  test('Fails when trying to create with missing required properties', async () => {
    await expect(
      ModelInstanceDocument.create(ceramic, CONTENT_NO_REQ_PROPS, midMetadata)
    ).rejects.toThrow(/data must have required property 'arrayProperty', data must have required property 'stringArrayProperty', data must have required property 'stringProperty', data must have required property 'intProperty', data must have required property 'floatProperty'/)
  })

  test('Fails when trying to create without respecting minimal values', async () => {
    await expect(
      ModelInstanceDocument.create(
        ceramic,
        CONTENT_MINS_NOT_RESPECTED,
        midMetadata
      )
    ).rejects.toThrow(/data\/intProperty must be >= 2, data\/arrayProperty must NOT have fewer than 2 items, data\/floatProperty must be >= 3, data\/stringProperty must NOT have fewer than 3 characters, data\/stringArrayProperty\/0 must NOT have fewer than 2 characters/)
  })

  test('Fails when trying to create without respecting maximal values', async () => {
    await expect(
      ModelInstanceDocument.create(
        ceramic,
        CONTENT_MAXS_NOT_RESPECTED,
        midMetadata
      )
    ).rejects.toThrow(/data\/intProperty must be <= 100, data\/arrayProperty must NOT have more than 4 items, data\/floatProperty must be <= 110, data\/stringProperty must NOT have more than 8 characters, data\/stringArrayProperty\/0 must NOT have more than 6 characters/)
  })

  test('Fails when trying to create additional property', async () => {
    await expect(
      ModelInstanceDocument.create(
        ceramic,
        CONTENT_WITH_ADDITIONAL_PROPERTY,
        midMetadata
      )
    ).rejects.toThrow(/data must NOT have additional properties/)
  })

  test(`Create a valid doc`, async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    expect(doc.id.type).toEqual(ModelInstanceDocument.STREAM_TYPE_ID)
    expect(doc.content).toEqual(CONTENT_VALID_1)
    expect(doc.state.log.length).toEqual(1)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(doc.metadata.model.toString()).toEqual(model.id.toString())
    expect(doc.metadata.unique instanceof Uint8Array).toBeTruthy()
    await expect(isPinned(ceramic, doc.id)).resolves.toBeTruthy()
  })

  test('Fails when trying to update with missing required properties', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    expect(doc.content).toEqual(CONTENT_VALID_1)

    await expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      doc.replace(CONTENT_NO_REQ_PROPS)
    ).rejects.toThrow(/data must have required property 'arrayProperty', data must have required property 'stringArrayProperty', data must have required property 'stringProperty', data must have required property 'intProperty', data must have required property 'floatProperty'/)
  })

  test('Fails when trying to update without respecting minimal values', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    expect(doc.content).toEqual(CONTENT_VALID_1)

    await expect(
      doc.replace(CONTENT_MINS_NOT_RESPECTED)
    ).rejects.toThrow(/data\/intProperty must be >= 2, data\/arrayProperty must NOT have fewer than 2 items, data\/floatProperty must be >= 3, data\/stringProperty must NOT have fewer than 3 characters, data\/stringArrayProperty\/0 must NOT have fewer than 2 characters/)
  })

  test('Fails when trying to update without respecting maximal values', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    expect(doc.content).toEqual(CONTENT_VALID_1)

    await expect(
      doc.replace(CONTENT_MAXS_NOT_RESPECTED)
    ).rejects.toThrow(/data\/intProperty must be <= 100, data\/arrayProperty must NOT have more than 4 items, data\/floatProperty must be <= 110, data\/stringProperty must NOT have more than 8 characters, data\/stringArrayProperty\/0 must NOT have more than 6 characters/)
  })

  test('Fails when trying to update with additional property', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    await expect(
      doc.replace(CONTENT_WITH_ADDITIONAL_PROPERTY)
    ).rejects.toThrow(/data must NOT have additional properties/)
  })

  test('Create and update doc', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    expect(doc.content).toEqual(CONTENT_VALID_1)

    await doc.replace(CONTENT_VALID_2)

    expect(doc.content).toEqual(CONTENT_VALID_2)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
  })

  test('Anchor genesis', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT_VALID_1)
  })

  test('Anchor after updating', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    await doc.replace(CONTENT_VALID_2)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(3)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT_VALID_2)
  })

  test('multiple updates', async () => {
    const doc = await ModelInstanceDocument.create(
      ceramic,
      CONTENT_VALID_1,
      midMetadata
    )
    await doc.replace(CONTENT_VALID_2)

    await anchorUpdate(core, doc)
    await doc.sync()

    await doc.replace(CONTENT_VALID_3)
    await doc.replace(CONTENT_VALID_4)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(6)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(doc.state.log[3].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[4].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[5].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT_VALID_4)
  })

  test('ModelInstanceDocuments are created uniquely', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT_VALID_1, midMetadata)
    const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT_VALID_1, midMetadata)

    expect(doc1.id.toString()).not.toEqual(doc2.id.toString())
    expect(doc1.metadata.unique.toString()).not.toEqual(doc2.metadata.unique.toString())
  })

  test('Can load a stream', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT_VALID_1, midMetadata)
    await doc.replace(CONTENT_VALID_2)
    await anchorUpdate(core, doc)
    await doc.sync()

    const loaded = await ModelInstanceDocument.load(ceramic, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })

  test('create respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT_VALID_1, midMetadata, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('create respects pin flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT_VALID_1, midMetadata, { pin: false })
    await expect(isPinned(ceramic, doc.id)).resolves.toBeFalsy()
  })

  test('replace respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT_VALID_1, midMetadata, { anchor: false })
    await doc.replace(CONTENT_VALID_2, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('replace respects pin flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT_VALID_1, midMetadata)
    await expect(isPinned(ceramic, doc.id)).resolves.toBeTruthy()
    await doc.replace(CONTENT_VALID_2, { pin: false })
    await expect(isPinned(ceramic, doc.id)).resolves.toBeFalsy()
  })
})
