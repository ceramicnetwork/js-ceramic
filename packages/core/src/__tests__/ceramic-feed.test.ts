import { expect, describe, test, beforeAll, afterAll } from '@jest/globals'
import { EventType, type IpfsApi, Networks } from '@ceramicnetwork/common'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import type { Ceramic } from '../ceramic.js'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { FeedDocument } from '../feed.js'
import { createCeramic } from './create-ceramic.js'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

describe('Ceramic feed', () => {
  let ipfs1: IpfsApi
  let ipfs2: IpfsApi
  let ceramic1: Ceramic
  let ceramic2: Ceramic
  beforeAll(async () => {
    ipfs1 = await createIPFS({
      rust: {
        type: 'binary',
        network: Networks.INMEMORY,
      },
    })
    ipfs2 = await createIPFS({
      rust: {
        type: 'binary',
        network: Networks.INMEMORY,
      },
    })
    ceramic1 = await createCeramic(ipfs1)
    ceramic2 = await createCeramic(ipfs2)
    await swarmConnect(ipfs2, ipfs1)
  })

  afterAll(async () => {
    await ceramic1.close()
    await ceramic2.close()
    await ipfs1.stop()
    await ipfs2.stop()
  })

  test('add entry after loading indexed model', async () => {
    const MODEL_DEFINITION: ModelDefinition = {
      name: 'myModel',
      version: '1.0',
      schema: { type: 'object', additionalProperties: false },
      accountRelation: { type: 'list' },
    }
    const emissions: FeedDocument[] = []

    const readable1 = ceramic1.feed.aggregation.documentsA()
    const writable1 = new WritableStream({
      write(chunk) {
        emissions.push(chunk)
      },
    })
    const abortController = new AbortController()
    const doneStreaming = readable1.pipeTo(writable1, { signal: abortController.signal }).catch(() => {
      // Ignore, as it is an Abort Signal
    })

    // create model on different node
    const model = await Model.create(ceramic2, MODEL_DEFINITION)

    // wait for model to be received
    if (process.env.CERAMIC_RECON_MODE) {
      await TestUtils.waitForEvent(ceramic1.repository.recon, model.tip)
    }

    // load model
    await Model.load(ceramic1, model.id)
    await TestUtils.waitForConditionOrTimeout(async () => emissions.length === 1, 3000)

    expect(emissions.length).toEqual(1)
    expect(emissions[0].content).toEqual(model.state.content)
    expect(emissions[0].metadata).toEqual(model.state.metadata)
    expect(emissions[0].commitId).toEqual(model.commitId)
    expect(emissions[0].eventType).toBe(EventType.INIT)
    abortController.abort()
    await doneStreaming
  })

  test('add entry on creating an indexed model', async () => {
    const MODEL_DEFINITION: ModelDefinition = {
      name: 'myModel',
      version: '1.0',
      schema: { type: 'object', additionalProperties: false },
      accountRelation: { type: 'list' },
    }
    const emissions: FeedDocument[] = []

    const abortController = new AbortController()
    const readable = ceramic2.feed.aggregation.documentsA()
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
    const model = await Model.create(ceramic2, MODEL_DEFINITION)
    await doneStreaming
    expect(emissions.length).toEqual(1)
    expect(emissions[0].content).toEqual(model.state.content)
    expect(emissions[0].metadata).toEqual(model.state.metadata)
    expect(emissions[0].commitId).toEqual(model.commitId)
    expect(emissions[0].eventType).toBe(EventType.INIT)
  })
})
