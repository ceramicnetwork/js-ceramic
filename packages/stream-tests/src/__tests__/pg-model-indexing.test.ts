import { jest } from '@jest/globals'
import { AnchorStatus, CommitType, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import pgSetup from '@databases/pg-test/jest/globalSetup'
import pgTeardown from '@databases/pg-test/jest/globalTeardown'

const INDEXED_MODEL_DEFINITION: ModelDefinition = {
  name: 'myIndexedModel',
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
      myStringData: {
        type: 'string',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

const SINGLE_INDEXED_MODEL_DEFINITION: ModelDefinition = {
  name: 'myIndexedModel',
  version: '1.0',
  accountRelation: { type: 'single' },
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
      myStringData: {
        type: 'string',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

describe('Postgres Model indexing tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let ceramic: Ceramic

  beforeEach(async () => {
    await pgSetup()
    const dbURL = process.env.DATABASE_URL || ''

    ipfs = await createIPFS()

    ceramic = await createCeramic(ipfs, {
      indexing: {
        db: dbURL,
        allowQueriesBeforeHistoricalSync: true,
        enableHistoricalSync: false,
        disableComposedb: false,
      },
    })
  }, 12000)

  afterEach(async () => {
    await ceramic.close()
    await ipfs.stop()

    await pgTeardown()
  })

  test('Create and index valid model', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create, index, and load valid model', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
        },
      ])
    ).resolves.not.toThrow()

    await expect(Model.load(ceramic, model.id)).resolves.not.toThrow()
  })

  test('Create and index a model with custom indices', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create and index a model with custom indices that is not pinned', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create, index, and load valid model with custom indices', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()

    await expect(Model.load(ceramic, model.id)).resolves.not.toThrow()
  })

  test('Create, index, load and index valid model with custom indices on create', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()

    const loadedModel = await Model.load(ceramic, model.id)

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: loadedModel.id,
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create, index, load and not index valid model with custom indices on load', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
        },
      ])
    ).resolves.not.toThrow()

    const loadedModel = await Model.load(ceramic, model.id)

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: loadedModel.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create, index, load and index valid model with less custom indices on load', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
            {
              fields: [{ path: ['myString'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()

    const loadedModel = await Model.load(ceramic, model.id)

    //TODO: this should throw
    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: loadedModel.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create, index, load and index valid model with different custom indices on load', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
            {
              fields: [{ path: ['myString'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()

    const loadedModel = await Model.load(ceramic, model.id)

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: loadedModel.id,
          indices: [
            {
              fields: [{ path: ['myString'] }],
            },
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create, index, load and index valid model with different custom indices on load', async () => {
    const model = await Model.create(ceramic, INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()

    const loadedModel = await Model.load(ceramic, model.id)

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: loadedModel.id,
          indices: [
            {
              fields: [{ path: ['myString'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create and index valid single model', async () => {
    const model = await Model.create(ceramic, SINGLE_INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(SINGLE_INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create and index valid single model with indices', async () => {
    const model = await Model.create(ceramic, SINGLE_INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(SINGLE_INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
          indices: [
            {
              fields: [{ path: ['myData'] }],
            },
          ],
        },
      ])
    ).resolves.not.toThrow()
  })

  test('Create, index, and load valid single model', async () => {
    const model = await Model.create(ceramic, SINGLE_INDEXED_MODEL_DEFINITION)

    expect(model.id.type).toEqual(Model.STREAM_TYPE_ID)
    expect(model.content).toEqual(SINGLE_INDEXED_MODEL_DEFINITION)
    expect(model.metadata).toEqual({ controller: ceramic.did.id.toString(), model: Model.MODEL })
    expect(model.state.log.length).toEqual(1)
    expect(model.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(model.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await expect(ceramic.admin.pin.add(model.id)).resolves.not.toThrow()

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: model.id,
        },
      ])
    ).resolves.not.toThrow()

    const loadedModel = await Model.load(ceramic, model.id)

    await expect(
      ceramic.admin.startIndexingModelData([
        {
          streamID: loadedModel.id,
        },
      ])
    ).resolves.not.toThrow()
  })
})
