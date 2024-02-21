import { expect, describe, test, beforeAll, afterAll } from '@jest/globals'
import { EventType, type IpfsApi, Networks } from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '@ceramicnetwork/core'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import type { Ceramic } from '../ceramic.js'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { take } from 'rxjs'
import { FeedDocument } from '../feed.js'
import { createCeramic } from './create-ceramic.js'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

// Should  pass on v4 if updated from TileDocument
const describeIfV3 = process.env.CERAMIC_RECON_MODE ? describe.skip : describe

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

  describeIfV3('tile document', () => {
    test('add entry after creating/updating stream', async () => {
      const feed: FeedDocument[] = []
      const s = ceramic1.feed.aggregation.documents.subscribe((s) => {
        feed.push(s)
      })
      const original = `world-${Math.random()}`
      const tile = await TileDocument.create(ceramic1, { hello: original }, null, {
        anchor: false,
      })
      const updated = `world-1-${Math.random()}`
      await tile.update({ hello: updated }, undefined, { anchor: false })
      s.unsubscribe()
      // One entry after create, and another after update
      expect(feed.length).toEqual(2)

      expect(feed[0].commitId).not.toBe(feed[1].commitId)
      expect(feed[0].metadata).toStrictEqual(feed[1].metadata)
      expect(feed[0].content).toStrictEqual({ hello: original })
      expect(feed[1].content).toStrictEqual({ hello: updated })
      expect(feed[0].eventType).toBe(EventType.INIT)
      expect(feed[1].eventType).toBe(EventType.DATA)
    })

    test('add entry after loading pinned stream/pubsub', async () => {
      const content = { test: 1223 }
      const updatedContent = { test: 1335 }
      const feed1: FeedDocument[] = []
      const feed2: FeedDocument[] = []

      const s1 = await ceramic1.feed.aggregation.documents.subscribe((s) => {
        feed1.push(s)
      })
      const s2 = await ceramic2.feed.aggregation.documents.pipe(take(3)).subscribe((s) => {
        feed2.push(s)
      })
      const stream1 = await TileDocument.create(ceramic1, content, null, {
        anchor: false,
        publish: true,
      })

      // load stream on ceramic node 2
      await TileDocument.load(ceramic2, stream1.id)
      await stream1.update(updatedContent, null, { anchor: false, publish: true })
      await TestUtils.delay(500)

      expect(feed1.length).toEqual(2) // create + update
      expect(feed1[0].eventType).toBe(EventType.INIT)
      expect(feed1[1].eventType).toBe(EventType.DATA)
      expect(feed2.length).toEqual(2) //load + pubsub update
      expect(feed2[0].eventType).toBe(EventType.INIT)
      expect(feed2[1].eventType).toBe(EventType.DATA)
      expect(feed2[0].content.test).toBe(content.test)
      expect(feed2[0].commitId).toStrictEqual(feed1[0].commitId)
      // test pubsub propagating the update from stream1 being inside the feed
      expect(feed2[1].commitId).toStrictEqual(feed1[1].commitId)
      expect(feed2[1].metadata).toStrictEqual(feed1[1].metadata)
      expect(feed2[1].content).toStrictEqual(updatedContent)

      s1.unsubscribe()
      s2.unsubscribe()
    }, 20000)

    test('add entry after anchoring stream', async () => {
      const feed: FeedDocument[] = []
      const s = ceramic1.feed.aggregation.documents.subscribe((s) => {
        feed.push(s)
      })

      const stream = await TileDocument.create(
        ceramic1,
        { hello: `world-${Math.random()}` },
        null,
        {
          anchor: true,
        }
      )
      const state$ = await ceramic1.repository.load(stream.id, {})
      // request anchor
      await ceramic1.repository.anchor(state$, {})
      // process anchor
      await CoreUtils.anchorUpdate(ceramic1, stream)

      expect(feed.length).toEqual(2) // 2 commits = 1 genesis commit + 1 anchor commit
      expect(feed[0].content).toEqual(feed[1].content)
      expect(feed[0].metadata).toEqual(feed[1].metadata)
      expect(feed[0].commitId.equals(feed[1].commitId)).toEqual(false)
      expect(feed[0].eventType).toBe(EventType.INIT)
      expect(feed[1].eventType).toBe(EventType.TIME)
      s.unsubscribe()
    })
  })

  test('add entry after creating/loading indexed model', async () => {
    const MODEL_DEFINITION: ModelDefinition = {
      name: 'myModel',
      version: '1.0',
      schema: { type: 'object', additionalProperties: false },
      accountRelation: { type: 'list' },
    }
    const feed: FeedDocument[] = []

    const s1 = ceramic1.feed.aggregation.documents.subscribe((s) => {
      feed.push(s)
    })
    // create model on different node
    const model = await Model.create(ceramic2, MODEL_DEFINITION)

    // wait for model to be received
    await TestUtils.waitForEvent(ceramic1.repository.recon, model.tip)

    // load model
    await Model.load(ceramic1, model.id)

    expect(feed.length).toEqual(1)
    expect(feed[0].content).toEqual(model.state.content)
    expect(feed[0].metadata).toEqual(model.state.metadata)
    expect(feed[0].commitId).toEqual(model.commitId)
    expect(feed[0].eventType).toBe(EventType.INIT)
    s1.unsubscribe()
  })
})
