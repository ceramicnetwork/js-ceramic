import { jest, test, expect, describe, beforeAll, afterAll } from '@jest/globals'
import { IpfsApi } from '@ceramicnetwork/common'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import {
  ModelInstanceDocument,
  ModelInstanceDocumentMetadataArgs,
} from '@ceramicnetwork/stream-model-instance'
import { createCeramic } from '../create-ceramic.js'
import { Ceramic } from '@ceramicnetwork/core'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      updates: {
        type: 'integer',
        maximum: 10000,
        minimum: 0,
      },
    },
    required: ['updates'],
  },
}

// This test should only run with recon.
const describeIfVPrime = process.env.CERAMIC_RECON_MODE ? describe : describe.skip
describeIfVPrime('Tests that sync streams with many updates', () => {
  jest.setTimeout(1000 * 30)

  let ipfs0: IpfsApi
  let ceramic0: Ceramic
  let model: Model
  let midMetadata: ModelInstanceDocumentMetadataArgs

  beforeAll(async () => {
    ipfs0 = await createIPFS()

    ceramic0 = await createCeramic(ipfs0)

    model = await Model.create(ceramic0, MODEL_DEFINITION)
    midMetadata = { model: model.id }

    await ceramic0.admin.startIndexingModelData([{ streamID: model.id }])
  }, 80000)

  afterAll(async () => {
    await ceramic0.close()
    await ipfs0.stop()
  })

  const NUM_UPDATES = 100

  test('sync large doc', async () => {
    // Create a stream with many updates
    const doc = await ModelInstanceDocument.create(ceramic0, { updates: 0 }, midMetadata, {
      anchor: false,
    })
    for (let i = 1; i < NUM_UPDATES; i++) {
      await doc.replace({ updates: i }, null, { anchor: false })
    }

    // Start a second Ceramic node
    const ipfs1 = await createIPFS()
    const ceramic1 = await createCeramic(ipfs1)
    await swarmConnect(ipfs0, ipfs1)

    // Instruct the second node to sync the Model.
    await TestUtils.waitForEvent(ceramic1.repository.recon, model.tip)
    await ceramic1.admin.startIndexingModelData([{ streamID: model.id }])

    // Wait for all updates to the stream to be delivered
    await TestUtils.waitForEvent(ceramic1.repository.recon, doc.tip)

    // Assert that the states are equal between the two nodes
    const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)
    expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))

    // Cleanup
    await ceramic1.close()
    await ipfs1.stop()
  })
})
