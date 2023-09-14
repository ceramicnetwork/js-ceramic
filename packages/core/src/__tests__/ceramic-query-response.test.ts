import { jest, expect, describe, test, beforeEach, afterEach } from '@jest/globals'
import { type CeramicApi, type IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { StreamID } from '@ceramicnetwork/streamid'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from './create-ceramic.js'
import type { SignedMessage } from '@libp2p/interface-pubsub'
import { deserialize, MsgType, serialize } from '../pubsub/pubsub-message.js'
import { MAX_RESPONSE_INTERVAL } from '../pubsub/message-bus.js'

const LONG_SYNC_TIME = 60 * 1000

describe('Response to pubsub queries handling', () => {
  jest.setTimeout(30 * 1000)

  let ceramicIpfs: IpfsApi
  let ceramic: CeramicApi
  let otherIpfs: IpfsApi
  beforeEach(async () => {
    ceramicIpfs = await createIPFS()
    ceramic = await createCeramic(ceramicIpfs)
    otherIpfs = await createIPFS()

    await swarmConnect(ceramicIpfs, otherIpfs)
  })

  afterEach(async () => {
    await otherIpfs.pubsub.unsubscribe(ceramic.topic)
    await ceramic.close()
    await ceramicIpfs.stop()
  })

  test('sync returns after only response', async () => {
    const genesisCommit = await TileDocument.makeGenesis(ceramic, { foo: 'bar' }, null)
    const genesisCID = await ceramic.dispatcher.storeCommit(genesisCommit)
    const streamID = new StreamID(0, genesisCID)

    const timeBeforeResponding = 100
    await otherIpfs.pubsub.subscribe(ceramic.pubsubTopic, async (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        await TestUtils.delay(timeBeforeResponding)
        const tipMap = new Map().set(streamID.toString(), genesisCID)
        const response = { typ: MsgType.RESPONSE, id: message.id, tips: tipMap }
        otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
      }
    })

    const timeBeforeSync = new Date()
    await ceramic.loadStream(streamID, { syncTimeoutSeconds: LONG_SYNC_TIME / 1000 })
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBeforeResponding)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)
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
        const tipMap = new Map().set(streamID.toString(), genesisCID)
        const response = { typ: MsgType.RESPONSE, id: message.id, tips: tipMap }

        for (let i = 0; i < numResponses; i++) {
          await TestUtils.delay(timeBetweenResponses)
          otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
        }
      }
    })

    const timeBeforeSync = new Date()
    await ceramic.loadStream(streamID, { syncTimeoutSeconds: LONG_SYNC_TIME / 1000 })
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBetweenResponses * numResponses)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)
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
        const tipMap = new Map().set(streamID.toString(), genesisCID)
        const response = { typ: MsgType.RESPONSE, id: message.id, tips: tipMap }

        for (let i = 0; i < numInitialResponses; i++) {
          await TestUtils.delay(timeBetweenInitialResponses)
          otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
        }

        for (let i = 0; i < numLaterResponses; i++) {
          await TestUtils.delay(timeBetweenInitialResponses)
          otherIpfs.pubsub.publish(ceramic.pubsubTopic, serialize(response))
        }
      }
    })

    const timeBeforeSync = new Date()
    await ceramic.loadStream(streamID, { syncTimeoutSeconds: LONG_SYNC_TIME / 1000 })
    const timeAfterSync = new Date()
    const syncDuration = timeAfterSync.getTime() - timeBeforeSync.getTime()

    expect(syncDuration).toBeGreaterThan(timeBetweenInitialResponses * numInitialResponses)
    expect(syncDuration).toBeLessThan(timeBetweenLaterResponses * numLaterResponses)
    expect(syncDuration).toBeLessThan(LONG_SYNC_TIME)
  })
})
