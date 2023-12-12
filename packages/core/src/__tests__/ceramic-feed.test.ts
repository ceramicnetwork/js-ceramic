import { expect, describe, test, beforeEach, afterEach } from '@jest/globals'
import { TestUtils, type StreamState, type IpfsApi } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { createIPFS, swarmConnect, withFleet } from '@ceramicnetwork/ipfs-daemon'
import type { Ceramic } from '../ceramic.js'
import { createCeramic as vanillaCreateCeramic } from './create-ceramic.js'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import { take } from 'rxjs'
import { Document } from '../feed.js'

function createCeramic(
  ipfs: IpfsApi,
  anchorOnRequest = false,
  streamCacheLimit = 100
): Promise<Ceramic> {
  return vanillaCreateCeramic(ipfs, {
    anchorOnRequest,
    streamCacheLimit,
  })
}

describe('Ceramic feed', () => {
  let ipfs: IpfsApi
  let ceramic: Ceramic
  beforeEach(async () => {
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)
  })

  afterEach(async () => {
    await ceramic.close()
    await ipfs.stop()
  })

  test('add entry after creating/updating stream', async () => {
    const feed: Document[] = []
    const s = ceramic.feed.aggregation.streamStates.subscribe((s) => {
      feed.push(s)
    })

    const tile = await TileDocument.create(ceramic, { hello: `world-${Math.random()}` }, null, {
      anchor: false,
    })
    await tile.update({ hello: `world-1-${Math.random()}` }, undefined, { anchor: false })
    s.unsubscribe()
    // One entry after create, and another after update
    expect(feed.length).toEqual(2)

    expect(feed[0].id).not.toBe(feed[1].id)
    expect(feed[0].metadata).toStrictEqual(feed[1].metadata)
  })

  test('add entry after loading pinned stream/pubsub ', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs2, ipfs1)

      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)
      const content = { test: 1223 }
      const updatedContent = { test: 1335 }
      const feed1: Document[] = []
      const feed2: Document[] = []
      const s1 = await ceramic1.feed.aggregation.streamStates.subscribe((s) => {
        feed1.push(s)
      })

      const s2 = await ceramic2.feed.aggregation.streamStates.pipe(take(3)).subscribe((s) => {
        feed2.push(s)
      })
      const stream1 = await TileDocument.create(ceramic1, content, null, {
        anchor: false,
        publish: true,
      })
      // load stream on ceramic node 2
      await TileDocument.load(ceramic2, stream1.id)

      await stream1.update(updatedContent, null, { publish: true })
      await TestUtils.delay(500)

      expect(feed1.length).toEqual(3) // create + anchor + update
      expect(feed2.length).toEqual(2) //load + pubsub update
      expect(feed2[0].content.test).toBe(content.test)
      expect(feed2[0].id).toStrictEqual(feed1[0].id)
      // test pubsub propagating the update from stream1 being inside the feed
      expect(feed2[1].id).toStrictEqual(feed1[1].id)
      await ceramic1.close()
      await ceramic2.close()
      s1.unsubscribe()
      s2.unsubscribe()
    })
  }, 20000)

  test('add entry after loading indexed model', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs2, ipfs1)

      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)
      const MODEL_DEFINITION: ModelDefinition = {
        name: 'myModel',
        version: '1.0',
        schema: { type: 'object', additionalProperties: false },
        accountRelation: { type: 'list' },
      }
      const feed: Document[] = []

      const s = ceramic2.feed.aggregation.streamStates.subscribe((s) => {
        feed.push(s)
      })
      // create model on different node
      const model = await Model.create(ceramic1, MODEL_DEFINITION)

      // load model
      await Model.load(ceramic2, model.id)
      s.unsubscribe()
      expect(feed.length).toEqual(1)
      expect(feed[0].content).toEqual(model.state.content)
      expect(feed[0].metadata).toEqual(model.state.metadata)
      expect(feed[0].id).toStrictEqual(model.commitId)
      await ceramic1.close()
      await ceramic2.close()
    })
  })

  test('add entry after anchoring stream', async () => {
    const feed: Document[] = []
    const s = ceramic.feed.aggregation.streamStates.subscribe((s) => {
      feed.push(s)
    })

    const stream = await TileDocument.create(ceramic, { hello: `world-${Math.random()}` }, null, {
      anchor: false,
    })
    const state$ = await ceramic.repository.load(stream.id, {})
    // request anchor
    await ceramic.repository.anchor(state$, {})
    // process anchor
    await TestUtils.anchorUpdate(ceramic, stream)
    s.unsubscribe()

    expect(feed.length).toEqual(3)// create + anchor request + anchor update
    // between and request anchor
    expect(feed[0].content).toEqual(feed[1].content)
    expect(feed[0].metadata).toEqual(feed[1].metadata)
    expect(feed[0].id).toStrictEqual(feed[1].id)
    //between request anchor and process anchor
    expect(feed[1].content).toEqual(feed[2].content)
    expect(feed[1].metadata).toEqual(feed[2].metadata)
    expect(feed[1].id).toStrictEqual(feed[2].id)
  })
})
