import { jest } from '@jest/globals'
import getPort from 'get-port'
import { AnchorStatus, CeramicApi, CommitType, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadata,
} from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { anchorUpdate } from '@ceramicnetwork/core/lib/state-management/__tests__/anchor-update'
import { Ceramic, CeramicConfig } from '@ceramicnetwork/core'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { StreamID } from '@ceramicnetwork/streamid'
import first from 'it-first'
import { Model, ModelAccountRelation, ModelDefinition } from '@ceramicnetwork/stream-model'
import { SqliteIndexApi } from '@ceramicnetwork/core/lib/indexing/sqlite/sqlite-index-api'
import { listMidTables } from '@ceramicnetwork/core/lib/indexing/sqlite/init-tables'
import knex, { Knex } from 'knex'
import tmp from 'tmp-promise'

const INDEXING_MODELS = [
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s',
  'kjzl6hvfrbw6c8c8ks6ndp7elnd03csx3q7934qmacryhqoqn1para6sfpau6xi',
  'kjzl6cwe1jw145m7jxh4jpa6iw1ps3jcjordpo81e0w04krcpz8knxvg5ygiabd',
]
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }
const CONTENT3 = { myData: 3 }
const METADATA = { model: FAKE_STREAM_ID }

let tmpFolder: tmp.DirectoryResult
let dbConnection: Knex

beforeEach(async () => {
  tmpFolder = await tmp.dir({ unsafeCleanup: true })
  const filename = `${tmpFolder.path}/tmp-ceramic.sqlite`
  dbConnection = knex({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
      filename: filename,
    },
  })
})

afterEach(async () => {
  await dbConnection.destroy()
  await tmpFolder.cleanup()
})

describe('init', () => {
  describe('create tables', () => {
    test('create new table from scratch', async () => {
      const modelsToIndex = [FAKE_STREAM_ID]
      const indexApi = new SqliteIndexApi(dbConnection, modelsToIndex)
      await indexApi.init()
      const created = await listMidTables(dbConnection)
      const tableNames = modelsToIndex.map((m) => `mid_${m.toString()}`)
      expect(created).toEqual(tableNames)
    })
  })
})

describe('close', () => {
  test('destroys knex connection', async () => {
    const fauxDbConnection = {
      destroy: jest.fn(),
    } as unknown as Knex
    const indexApi = new SqliteIndexApi(fauxDbConnection, [])
    await indexApi.close()
    expect(fauxDbConnection.destroy).toBeCalled()
  })
})

async function isPinned(ceramic: CeramicApi, streamId: StreamID): Promise<boolean> {
  const iterator = await ceramic.pin.ls(streamId)
  return (await first(iterator)) == streamId.toString()
}

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  accountRelation: ModelAccountRelation.LIST,
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
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    const filename = `${tmpFolder.path}/tmp-ceramic.sqlite`
    console.log(filename)
    const ceramicConfig: CeramicConfig = {
      indexing: {
        db: 'sqlite:///Users/Alex/Documents/GitHub/indexing.sqlite',
        models: INDEXING_MODELS,
      },
    }
    core = await createCeramic(ipfs, ceramicConfig)

    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({
        'http-api': { port },
        indexing: {
          db: 'sqlite:///Users/Alex/Documents/GitHub/indexing.sqlite',
          models: INDEXING_MODELS,
        },
      })
    )
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

  test('verifies the content against model schema when creating an MID', async () => {
    await expect(ModelInstanceDocument.create(ceramic, {}, midMetadata)).rejects.toThrow(
      /data must have required property 'myData'/
    )
  })

  test('verifies the content against model schema when updating an MID', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.content).toEqual(CONTENT0)

    await expect(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      doc.replace({})
    ).rejects.toThrow(/data must have required property 'myData'/)
  })

  test(`Create a valid doc`, async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.id.type).toEqual(ModelInstanceDocument.STREAM_TYPE_ID)
    expect(doc.content).toEqual(CONTENT0)
    expect(doc.state.log.length).toEqual(1)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(doc.metadata.model.toString()).toEqual(model.id.toString())
    expect(doc.metadata.unique instanceof Uint8Array).toBeTruthy()
    await expect(isPinned(ceramic, doc.id)).resolves.toBeTruthy()
  })

  test('Create and update doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.content).toEqual(CONTENT0)

    // confirm stream was added to index
    /*let result: Array<any> = await dataSource.query(`SELECT * FROM mid_${FAKE_STREAM_ID}`)
    expect(result.length).toEqual(1)
    let raw = result[0]
    expect(raw.stream_id).toEqual(doc.id)
    expect(raw.controller_did).toEqual(METADATA.controller)
    const updated_at_create = raw.updated_at
    expect(raw.last_anchored_at).toBeNull()*/

    await doc.replace(CONTENT1)

    expect(doc.content).toEqual(CONTENT1)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)

    // confirm updated_at timestamp was updated
    /*result = await dataSource.query(`SELECT * FROM mid_${FAKE_STREAM_ID}`)
    expect(result.length).toEqual(1)
    raw = result[0]
    expect(raw.updated_at).toBeGreaterThan(updated_at_create)*/
  })

  test('Anchor genesis', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(2)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT0)
  })

  test('Anchor after updating', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    await doc.replace(CONTENT1)
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await anchorUpdate(core, doc)
    await doc.sync()

    expect(doc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(doc.state.log.length).toEqual(3)
    expect(doc.state.log[0].type).toEqual(CommitType.GENESIS)
    expect(doc.state.log[1].type).toEqual(CommitType.SIGNED)
    expect(doc.state.log[2].type).toEqual(CommitType.ANCHOR)
    expect(doc.content).toEqual(CONTENT1)
  })

  test('multiple updates', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)

    await anchorUpdate(core, doc)
    await doc.sync()

    await doc.replace(CONTENT2)
    await doc.replace(CONTENT3)

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
    expect(doc.content).toEqual(CONTENT3)
  })

  test('ModelInstanceDocuments are created uniquely', async () => {
    const doc1 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    const doc2 = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)

    expect(doc1.id.toString()).not.toEqual(doc2.id.toString())
    expect(doc1.metadata.unique.toString()).not.toEqual(doc2.metadata.unique.toString())
  })

  test('Can load a stream', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)
    await anchorUpdate(core, doc)
    await doc.sync()

    const loaded = await ModelInstanceDocument.load(ceramic, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })

  test('create respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata, {
      anchor: false,
    })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('create respects pin flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata, { pin: false })
    await expect(isPinned(ceramic, doc.id)).resolves.toBeFalsy()
  })

  test('replace respects anchor flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata, {
      anchor: false,
    })
    await doc.replace(CONTENT1, { anchor: false })
    expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('replace respects pin flag', async () => {
    const doc = await ModelInstanceDocument.create(ceramic, CONTENT0, midMetadata)
    await expect(isPinned(ceramic, doc.id)).resolves.toBeTruthy()
    await doc.replace(CONTENT1, { pin: false })
    await expect(isPinned(ceramic, doc.id)).resolves.toBeFalsy()
  })
})

describe('ModelInstanceDocument API multi-node tests', () => {
  jest.setTimeout(1000 * 30)

  let ipfs0: IpfsApi
  let ipfs1: IpfsApi
  let ceramic0: Ceramic
  let ceramic1: Ceramic
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadata

  beforeAll(async () => {
    ipfs0 = await createIPFS()
    ipfs1 = await createIPFS()
    ceramic0 = await createCeramic(ipfs0)
    ceramic1 = await createCeramic(ipfs1)

    model = await Model.create(ceramic0, MODEL_DEFINITION)
    midMetadata = { model: model.id }
  }, 12000)

  afterAll(async () => {
    await ceramic0.close()
    await ceramic1.close()
    await ipfs0.stop()
    await ipfs1.stop()
  })

  test('load basic doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, midMetadata)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    const docState = doc.state
    const loadedState = loaded.state
    expect(docState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete docState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(1)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(docState))
  })

  test('load updated doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    const docState = doc.state
    const loadedState = loaded.state
    expect(docState.anchorStatus).toEqual(AnchorStatus.PENDING)
    expect(loadedState.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    delete docState.anchorStatus
    delete loadedState.anchorStatus
    expect(loadedState.log.length).toEqual(2)
    expect(JSON.stringify(loadedState)).toEqual(JSON.stringify(docState))
  })

  test('load updated and anchored doc', async () => {
    const doc = await ModelInstanceDocument.create(ceramic0, CONTENT0, midMetadata)
    await doc.replace(CONTENT1)
    await anchorUpdate(ceramic0, doc)

    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)

    expect(loaded.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(loaded.state.log.length).toEqual(3)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
  })
})
