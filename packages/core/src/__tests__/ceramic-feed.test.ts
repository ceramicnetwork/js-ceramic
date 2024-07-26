import { expect, describe, test, beforeEach, afterEach } from '@jest/globals'
import { EventType, type IpfsApi, Networks } from '@ceramicnetwork/common'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import type { Ceramic } from '../ceramic.js'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { FeedDocument } from '../feed.js'
import { createCeramic } from './create-ceramic.js'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { Utils } from '../utils.js'

let n = 0
function modelDefinition(): ModelDefinition {
  n += 1
  return {
    name: `INT-MODEL-${n}`,
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

describe('Ceramic feed', () => {
  let ipfs1: IpfsApi
  let ipfs2: IpfsApi
  let ceramic1: Ceramic
  let ceramic2: Ceramic
  beforeEach(async () => {
    ipfs1 = await createIPFS()
    ipfs2 = await createIPFS()
    ceramic1 = await createCeramic(ipfs1)
    ceramic2 = await createCeramic(ipfs2)
    await swarmConnect(ipfs2, ipfs1)
  })

  afterEach(async () => {
    await ceramic1.close()
    await ceramic2.close()
    await ipfs1.stop()
    await ipfs2.stop()
  })

  test('add entry after creating/updating stream', async () => {
    const emissions: FeedDocument[] = []
    const readable1 = ceramic1.feed.aggregation.documents()
    const writable1 = new WritableStream({
      write(chunk) {
        emissions.push(chunk)
      },
    })
    const abortController = new AbortController()
    const doneStreaming = readable1
      .pipeTo(writable1, { signal: abortController.signal })
      .catch(() => {
        // Ignore, as it is an Abort Signal
      })
    const model = await Model.create(ceramic1, modelDefinition())
    const document = await ModelInstanceDocument.create(
      ceramic1,
      { myData: 0 },
      { model: model.id }
    )
    await document.replace({ myData: 1 }, undefined, { anchor: false })

    await TestUtils.waitForConditionOrTimeout(async () => emissions.length === 3, 5000)

    // Model.create
    expect(String(emissions[0].commitId)).toEqual(String(model.commitId))
    // document.create
    expect(String(emissions[1].commitId)).toEqual(String(document.allCommitIds[0].toString()))
    // document.replace
    expect(String(emissions[2].commitId)).toEqual(String(document.allCommitIds[1]))
    abortController.abort()
    await doneStreaming
  })

  test('add entry after anchoring stream', async () => {
    const emissions: Array<FeedDocument> = []
    const readable1 = ceramic1.feed.aggregation.documents()
    const writable1 = new WritableStream({
      write(chunk) {
        emissions.push(chunk)
      },
    })
    const abortController = new AbortController()
    const doneStreaming = readable1
      .pipeTo(writable1, { signal: abortController.signal })
      .catch(() => {
        // Ignore, as it is an Abort Signal
      })
    const model = await Model.create(ceramic1, modelDefinition())
    const document = await ModelInstanceDocument.create(
      ceramic1,
      { myData: 0 },
      { model: model.id },
      { anchor: true }
    )
    await Utils.anchorUpdate(ceramic1, document)

    await TestUtils.waitForConditionOrTimeout(async () => {
      return emissions.length >= 4 // Recon gives you more events :(
    }, 5000)
    // model.create
    expect(String(emissions[0].commitId)).toEqual(String(model.allCommitIds[0]))
    // document.create
    expect(String(emissions[1].commitId)).toEqual(String(document.allCommitIds[0]))
    // model.anchor
    expect(String(emissions[2].commitId.baseID)).toEqual(String(model.id))
    expect(emissions[2].eventType).toEqual(EventType.TIME)
    // document.anchor
    expect(String(emissions[3].commitId)).toEqual(String(document.allCommitIds[1]))
    abortController.abort()
    await doneStreaming
  })

  test('add entry on creating an indexed model', async () => {
    const emissions: FeedDocument[] = []

    const abortController = new AbortController()
    const readable = ceramic2.feed.aggregation.documents()
    const writable = new WritableStream({
      write(chunk) {
        emissions.push(chunk)
        abortController.abort()
      },
    })

    const doneStreaming = readable
      .pipeTo(writable, { signal: abortController.signal })
      .catch(() => {
        // Abort Signal, hence ignore
      })
    // create model on different node
    const model = await Model.create(ceramic2, modelDefinition())
    await doneStreaming
    expect(emissions.length).toEqual(1)
    expect(emissions[0].content).toEqual(model.state.content)
    expect(emissions[0].metadata).toEqual(model.state.metadata)
    expect(emissions[0].commitId).toEqual(model.commitId)
    expect(emissions[0].eventType).toBe(EventType.INIT)
  })
})
