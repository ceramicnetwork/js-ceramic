import { jest } from '@jest/globals'
import type { BaseQuery, IpfsApi } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import {
  ModelInstanceDocument,
  type ModelInstanceDocumentMetadataArgs,
} from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'

const MODEL_DEFINITION_SET: ModelDefinition = {
  name: 'MyModel',
  version: '2.0',
  interface: false,
  implements: [],
  accountRelation: { type: 'set', fields: ['unique'] },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      unique: {
        type: 'string',
        minLength: 3,
      },
      other: {
        type: 'string',
        minLength: 3,
      },
    },
    required: ['unique'],
  },
}

type SetContent = { unique: string; other?: string }

describe('Deterministic ModelInstanceDocument indexing', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let ceramic: Ceramic
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    ipfs = await createIPFS()
  }, 12000)

  beforeEach(async () => {
    ceramic = await createCeramic(ipfs)
    model = await Model.create(ceramic, MODEL_DEFINITION_SET)
    await ceramic.admin.startIndexingModels([model.id])
    midMetadata = { model: model.id }
  }, 12000)

  afterEach(async () => {
    await ceramic.close()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  async function count(query: Partial<BaseQuery> = {}): Promise<number> {
    return await ceramic.index.count({ models: [model.id], ...query })
  }

  async function loadContent(unique: string): Promise<ModelInstanceDocument<SetContent | null>> {
    return await ModelInstanceDocument.set<SetContent>(ceramic, midMetadata, [unique])
  }

  async function setContent(content: SetContent): Promise<ModelInstanceDocument<SetContent>> {
    const doc = await ModelInstanceDocument.set<SetContent>(ceramic, midMetadata, [content.unique])
    await doc.replace(content)
    return doc
  }

  test('looking up documents should not add them to the index', async () => {
    await expect(count()).resolves.toBe(0)
    // Loading streams should not cause them to get indexed
    await Promise.all([loadContent('one'), loadContent('two')])
    await expect(count()).resolves.toBe(0)
    // Setting the stream content should cause it to get indexed
    await setContent({ unique: 'one' })
    await expect(count()).resolves.toBe(1)
  })

  test('index queries should filter as expected', async () => {
    const docs = await Promise.all([
      setContent({ unique: 'one', other: 'test' }),
      setContent({ unique: 'two', other: 'hello' }),
      setContent({ unique: 'three' }),
      setContent({ unique: 'four', other: 'test' }),
      setContent({ unique: 'five', other: 'hello' }),
      setContent({ unique: 'six', other: 'hello' }),
      setContent({ unique: 'seven' }),
      setContent({ unique: 'height', other: 'hello' }),
      setContent({ unique: 'nine', other: 'goodbye' }),
      setContent({ unique: 'ten', other: 'goodbye' }),
    ])
    await expect(count()).resolves.toBe(10)

    const filterHello = { where: { other: { equalTo: 'hello' } } }
    await expect(count({ queryFilters: filterHello })).resolves.toBe(4)
    await Promise.all([docs[1].shouldIndex(false), docs[4].shouldIndex(false)])
    // Unindexed streams should not be returned
    await expect(count({ queryFilters: filterHello })).resolves.toBe(2)
  })
})
