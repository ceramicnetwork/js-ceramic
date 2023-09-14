import { jest, expect, describe, test, afterEach } from '@jest/globals'
import { type CeramicApi, type IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { StreamID } from '@ceramicnetwork/streamid'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from './create-ceramic.js'
import type { SignedMessage } from '@libp2p/interface-pubsub'
import { deserialize, MsgType, serialize } from '../pubsub/pubsub-message.js'
import { MAX_RESPONSE_INTERVAL } from '../pubsub/message-bus.js'
import { CID } from 'multiformats/cid'

const LONG_SYNC_TIME = 60 * 1000

function makeResponse(streamID: StreamID, queryId: string, cid: CID) {
  const tipMap = new Map().set(streamID.toString(), cid)
  const response = { typ: MsgType.RESPONSE, id: queryId, tips: tipMap }
  return response
}

describe('Response to pubsub queries handling', () => {
  jest.setTimeout(30 * 1000)

  let ceramicIpfs: IpfsApi
  let ceramic: CeramicApi
  let otherIpfs: IpfsApi

  const cids: Array<CID> = []

  beforeAll(async () => {
    ceramicIpfs = await createIPFS()
    ceramic = await createCeramic(ceramicIpfs)
    otherIpfs = await createIPFS()

    // Make sure we have some random valid CIDs to respond to pubsub queries with
    for (let i = 0; i < 10; i++) {
      const commit = await TileDocument.makeGenesis(ceramic, { foo: i }, null)
      const cid = await ceramic.dispatcher.storeCommit(commit)
      cids.push(cid)
    }

    await swarmConnect(ceramicIpfs, otherIpfs)
  })

  afterAll(async () => {
    await ceramic.close()
    await ceramicIpfs.stop()
  })

  afterEach(async () => {
    await otherIpfs.pubsub.unsubscribe(ceramic.topic)
    jest.restoreAllMocks()
  })

  test('sync returns after the only response', async () => {
    const genesisCommit = await TileDocument.makeGenesis(ceramic, { foo: 'bar' }, null)
    const genesisCID = await ceramic.dispatcher.storeCommit(genesisCommit)
    const streamID = new StreamID(0, genesisCID)

    const timeBeforeResponding = MAX_RESPONSE_INTERVAL / 2
    await otherIpfs.pubsub.subscribe(ceramic.pubsubTopic, async (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        await TestUtils.delay(timeBeforeResponding)

        const response = makeResponse(streamID, message.id, cids[0])
        otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
      }
    })

    const handleUpdateSpy = jest.spyOn(ceramic.repository, 'handleUpdate')

    const timeBeforeSync = new Date()
    await ceramic.loadStream(streamID, { syncTimeoutSeconds: LONG_SYNC_TIME / 1000 })
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBeforeResponding)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)

    expect(handleUpdateSpy).toHaveBeenCalledTimes(1)
  })

  test('sync continues delaying for multiple responses close together', async () => {
    const genesisCommit = await TileDocument.makeGenesis(ceramic, { foo: 'bar' }, null)
    const genesisCID = await ceramic.dispatcher.storeCommit(genesisCommit)
    const streamID = new StreamID(0, genesisCID)

    const timeBetweenResponses = MAX_RESPONSE_INTERVAL / 2
    const numResponses = 10
    await otherIpfs.pubsub.subscribe(ceramic.pubsubTopic, async (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        for (let i = 0; i < numResponses; i++) {
          await TestUtils.delay(timeBetweenResponses)

          const response = makeResponse(streamID, message.id, cids[i])
          otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
        }
      }
    })

    const handleUpdateSpy = jest.spyOn(ceramic.repository, 'handleUpdate')

    const timeBeforeSync = new Date()
    await ceramic.loadStream(streamID, { syncTimeoutSeconds: LONG_SYNC_TIME / 1000 })
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBetweenResponses * numResponses)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)

    expect(handleUpdateSpy).toHaveBeenCalledTimes(numResponses)
  })

  test('sync stops delaying once responses are far enough apart', async () => {
    const genesisCommit = await TileDocument.makeGenesis(ceramic, { foo: 'bar' }, null)
    const genesisCID = await ceramic.dispatcher.storeCommit(genesisCommit)
    const streamID = new StreamID(0, genesisCID)

    const timeBetweenInitialResponses = MAX_RESPONSE_INTERVAL / 2
    const timeBetweenLaterResponses = MAX_RESPONSE_INTERVAL * 5
    const numInitialResponses = 5
    const numLaterResponses = 5
    await otherIpfs.pubsub.subscribe(ceramic.pubsubTopic, async (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        for (let i = 0; i < numInitialResponses; i++) {
          await TestUtils.delay(timeBetweenInitialResponses)

          const response = makeResponse(streamID, message.id, cids[i])
          otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
        }

        for (let i = 0; i < numLaterResponses; i++) {
          await TestUtils.delay(timeBetweenLaterResponses)

          const response = makeResponse(streamID, message.id, cids[i + numInitialResponses])
          otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
        }
      }
    })

    const handleUpdateSpy = jest.spyOn(ceramic.repository, 'handleUpdate')

    const timeBeforeSync = new Date()
    await ceramic.loadStream(streamID, { syncTimeoutSeconds: LONG_SYNC_TIME / 1000 })
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBetweenInitialResponses * numInitialResponses)
    expect(syncDuration).toBeLessThan(timeBetweenLaterResponses * numLaterResponses)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)

    expect(handleUpdateSpy).toHaveBeenCalledTimes(numInitialResponses)
  })
})
