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
import { CommonTestUtils as TestUtils, describeIfRecon } from '@ceramicnetwork/common-test-utils'

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
describeIfRecon('Tests that sync streams with many updates', () => {
  jest.setTimeout(1000 * 60 * 10)

  let ipfs0: IpfsApi
  let ceramic0: Ceramic
  let ipfs1: IpfsApi
  let ceramic1: Ceramic
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

    await ceramic1?.close()
    await ipfs1?.stop()
  })

  const NUM_UPDATES_PER_STREAM = 100
  const NUM_STREAMS = 100

  test('sync large docs', async () => {
    // Create streams with many updates each
    const streams = []
    for (let i = 0; i < NUM_STREAMS; i++) {
      const doc = await ModelInstanceDocument.create(ceramic0, { updates: 0 }, midMetadata, {
        anchor: false,
      })
      for (let j = 1; j < NUM_UPDATES_PER_STREAM; j++) {
        await doc.replace({ updates: j }, null, { anchor: false })
      }
      streams.push(doc)
    }

    // Start a second Ceramic node
    ipfs1 = await createIPFS()
    ceramic1 = await createCeramic(ipfs1)
    await swarmConnect(ipfs0, ipfs1)

    // Instruct the second node to sync the Model.
    await TestUtils.waitForEvent(ceramic1.repository.recon, model.tip)
    await ceramic1.admin.startIndexingModelData([{ streamID: model.id }])

    // Wait for all updates to the streams to be delivered
    for (let i = 0; i < NUM_STREAMS; i++) {
      const doc = streams[i]
      await TestUtils.waitForInitEvent(ceramic1, doc.id)
      const loaded = await ModelInstanceDocument.load(ceramic1, doc.id)
      await TestUtils.waitForState(
        loaded,
        1000 * 60 * 10,
        (state) => state.log.length == NUM_UPDATES_PER_STREAM
      )

      // Assert that the states are equal between the two nodes
      expect(JSON.stringify(loaded.state)).toEqual(JSON.stringify(doc.state))
    }
  })
})
