import { jest, expect, describe, test, afterEach, beforeEach } from '@jest/globals'
import { type IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { StreamID } from '@ceramicnetwork/streamid'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from './create-ceramic.js'
import { MsgType, PubsubMessage, QueryMessage, ResponseMessage } from '../pubsub/pubsub-message.js'
import { MAX_RESPONSE_INTERVAL } from '../pubsub/message-bus.js'
import { CID } from 'multiformats/cid'
import { asIpfsMessage } from '../pubsub/__tests__/as-ipfs-message.js'
import { Ceramic } from '../ceramic.js'

const LONG_SYNC_TIME = 60 * 1000

function makeResponse(streamID: StreamID, queryId: string, cid: CID): ResponseMessage {
  const tipMap = new Map().set(streamID.toString(), cid)
  const response = { typ: MsgType.RESPONSE as const, id: queryId, tips: tipMap }
  return response
}

/**
 * Intercepts the function that publishes messages to pubsub and returns the first query message
 * published (while still passing it on to pubsub as normal).
 * @param ceramic
 * @param streamID
 */
function getQueryPublishedPromise(
  ceramic: Ceramic,
  streamID: StreamID,
  originalPubsubPublish
): Promise<QueryMessage> {
  const pubsubPublishSpy = jest.spyOn(ceramic.dispatcher.messageBus.pubsub, 'next')
  return new Promise((resolve) => {
    pubsubPublishSpy.mockImplementation((message: PubsubMessage) => {
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        resolve(message)
      }
      return originalPubsubPublish(message)
    })
  })
}

describe('Response to pubsub queries handling', () => {
  jest.setTimeout(30 * 1000)

  let ceramicIpfs: IpfsApi
  let ceramic: Ceramic

  let receiveMessage
  let handleUpdateSpy
  let originalPubsubPublish

  const cids: Array<CID> = []
  let streamID: StreamID

  beforeAll(async () => {
    ceramicIpfs = await createIPFS()

    // Intercept the function passed to ipfs on pubsub subscription so that we can publish new
    // messages directly
    const originalPubsubSubscribe = ceramicIpfs.pubsub.subscribe.bind(ceramicIpfs.pubsub)
    const pubsubSubscribeSpy = jest.spyOn(ceramicIpfs.pubsub, 'subscribe')
    pubsubSubscribeSpy.mockImplementation(async (topic, onMessageCallback, opts) => {
      receiveMessage = onMessageCallback
      return originalPubsubSubscribe(topic, onMessageCallback, opts)
    })

    ceramic = await createCeramic(ceramicIpfs)

    handleUpdateSpy = jest.spyOn(ceramic.repository, 'handleUpdate')
    originalPubsubPublish = ceramic.dispatcher.messageBus.pubsub.next.bind(
      ceramic.dispatcher.messageBus.pubsub
    )

    // Make sure we have some random valid CIDs to respond to pubsub queries with
    for (let i = 0; i < 10; i++) {
      const commit = await TileDocument.makeGenesis(ceramic, { foo: i }, null)
      const cid = await ceramic.dispatcher.storeCommit(commit)
      cids.push(cid)
    }
  })

  beforeEach(async () => {
    const genesisCommit = await TileDocument.makeGenesis(ceramic, { foo: 'bar' }, null)
    const genesisCID = await ceramic.dispatcher.storeCommit(genesisCommit)
    streamID = new StreamID(0, genesisCID)
  })

  afterAll(async () => {
    await ceramic.close()
    await ceramicIpfs.stop()
  })

  afterEach(async () => {
    handleUpdateSpy.mockReset()
  })

  test('sync returns after the only response', async () => {
    const queryPublished = getQueryPublishedPromise(ceramic, streamID, originalPubsubPublish)

    const timeBeforeSync = new Date()
    const syncCompletionPromise = ceramic.loadStream(streamID, {
      syncTimeoutSeconds: LONG_SYNC_TIME / 1000,
    })

    const queryMessage = await queryPublished

    const timeBeforeResponding = MAX_RESPONSE_INTERVAL / 2
    await TestUtils.delay(timeBeforeResponding)
    const response = makeResponse(streamID, queryMessage.id, cids[0])
    await receiveMessage(asIpfsMessage(response))

    await syncCompletionPromise
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBeforeResponding)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)

    expect(handleUpdateSpy).toHaveBeenCalledTimes(1)
  })

  test('sync continues delaying for multiple responses close together', async () => {
    const queryPublished = getQueryPublishedPromise(ceramic, streamID, originalPubsubPublish)

    const timeBeforeSync = new Date()
    const syncCompletionPromise = ceramic.loadStream(streamID, {
      syncTimeoutSeconds: LONG_SYNC_TIME / 1000,
    })

    const queryMessage = await queryPublished

    const timeBetweenResponses = MAX_RESPONSE_INTERVAL / 2
    const numResponses = 10
    for (let i = 0; i < numResponses; i++) {
      await TestUtils.delay(timeBetweenResponses)
      const response = makeResponse(streamID, queryMessage.id, cids[i])
      await receiveMessage(asIpfsMessage(response))
    }

    await syncCompletionPromise
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBetweenResponses * numResponses)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)

    expect(handleUpdateSpy).toHaveBeenCalledTimes(numResponses)
  })

  test('sync stops delaying once responses are far enough apart', async () => {
    const timeBetweenInitialResponses = MAX_RESPONSE_INTERVAL / 2
    const timeBetweenLaterResponses = MAX_RESPONSE_INTERVAL * 5
    const numInitialResponses = 5
    const numLaterResponses = 5

    const queryPublished = getQueryPublishedPromise(ceramic, streamID, originalPubsubPublish)

    const timeBeforeSync = new Date()
    const syncCompletionPromise = ceramic.loadStream(streamID, {
      syncTimeoutSeconds: LONG_SYNC_TIME / 1000,
    })

    const queryMessage = await queryPublished

    const publishResponses = async function () {
      for (let i = 0; i < numInitialResponses; i++) {
        await TestUtils.delay(timeBetweenInitialResponses)
        const response = makeResponse(streamID, queryMessage.id, cids[i])
        await receiveMessage(asIpfsMessage(response))
      }
      for (let i = 0; i < numLaterResponses; i++) {
        await TestUtils.delay(timeBetweenLaterResponses)
        const response = makeResponse(streamID, queryMessage.id, cids[i + numInitialResponses])
        await receiveMessage(asIpfsMessage(response))
      }
    }
    publishResponses() // don't await for publishing to complete, let the responses happen in the background

    await syncCompletionPromise
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBetweenInitialResponses * numInitialResponses)
    expect(syncDuration).toBeLessThan(timeBetweenLaterResponses * numLaterResponses)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)

    expect(handleUpdateSpy).toHaveBeenCalledTimes(numInitialResponses)
  })
})
