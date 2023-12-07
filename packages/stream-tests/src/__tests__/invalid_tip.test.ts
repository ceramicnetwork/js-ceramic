import { jest } from '@jest/globals'
import { IpfsApi, SyncOptions, TestUtils } from '@ceramicnetwork/common'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from '../create-ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { Ceramic, MsgType, deserialize, serialize } from '@ceramicnetwork/core'
import { StreamID } from '@ceramicnetwork/streamid'
import type { SignedMessage } from '@libp2p/interface-pubsub'

describe('Test loading a stream when pubsub replies with an invalid tip', () => {
  jest.setTimeout(1000 * 30)

  let ipfs: IpfsApi
  let ceramic: Ceramic

  beforeAll(async () => {
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)

    // speed up how quickly the dispatcher gives up on loading a non-existent commit from ipfs.
    ceramic.dispatcher._ipfsTimeout = 500
  }, 12000)

  afterAll(async () => {
    await ipfs.stop()
    await ceramic.close()
  })

  test('No pubsub response', async () => {
    const content = { test: 123 }
    const genesis = await TileDocument.makeGenesis(ceramic, content, null)

    // Make sure genesis commit is available to IPFS, but without the Ceramic node knowing about
    // the stream yet.
    const genesisCid = await ceramic.dispatcher.storeCommit(genesis)
    const streamID = new StreamID('tile', genesisCid)

    // With no pubsub response we just get the genesis commit contents.
    const doc = await TileDocument.load(ceramic, streamID, {
      sync: SyncOptions.SYNC_ALWAYS,
      syncTimeoutSeconds: 1,
    })
    expect(doc.content).toEqual(content)
    expect(doc.state.log.length).toEqual(1)
  })

  test('Pubsub responds with inaccessible tip', async () => {
    // Make sure genesis commit is available to IPFS, but without the Ceramic node knowing about
    // the stream yet.
    const content = { test: 123 }
    const genesis = await TileDocument.makeGenesis(ceramic, content, null)
    const genesisCid = await ceramic.dispatcher.storeCommit(genesis)
    const streamID = new StreamID('tile', genesisCid)

    const ipfs2 = await createIPFS()
    await swarmConnect(ipfs, ipfs2)

    const nonExistentTip = TestUtils.randomCID()

    await ipfs2.pubsub.subscribe(ceramic.pubsubTopic, (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        const tipMap = new Map().set(streamID.toString(), nonExistentTip)
        const response = { typ: MsgType.RESPONSE, id: message.id, tips: tipMap }
        ipfs2.pubsub.publish(ceramic.pubsubTopic, serialize(response)).catch((error) => {
          // we want the test to fail if an error occurs thus we are rethrowing the error
          throw error
        })
      }
    })

    // The unloadable tip should be ignored and we return the content from the genesis commit.
    const doc = await TileDocument.load(ceramic, streamID, {
      sync: SyncOptions.SYNC_ALWAYS,
    })
    expect(doc.content).toEqual(content)
    expect(doc.state.log.length).toEqual(1)

    await ipfs2.stop()
  })

  test('Pubsub responds with record that isnt a real commit', async () => {
    // Make sure genesis commit is available to IPFS, but without the Ceramic node knowing about
    // the stream yet.
    const content = { test: 123 }
    const genesis = await TileDocument.makeGenesis(ceramic, content, null)
    const genesisCid = await ceramic.dispatcher.storeCommit(genesis)
    const streamID = new StreamID('tile', genesisCid)

    const ipfs2 = await createIPFS()
    await swarmConnect(ipfs, ipfs2)

    const garbageTip = await ceramic.dispatcher.storeRecord({ hello: 'world' })

    await ipfs2.pubsub.subscribe(ceramic.pubsubTopic, (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        const tipMap = new Map().set(streamID.toString(), garbageTip)
        const response = { typ: MsgType.RESPONSE, id: message.id, tips: tipMap }
        ipfs2.pubsub.publish(ceramic.pubsubTopic, serialize(response)).catch((error) => {
          // we want the test to fail if an error occurs thus we are rethrowing the error
          throw error
        })
      }
    })

    // The invalid tip should be ignored and we return the content from the genesis commit.
    const doc = await TileDocument.load(ceramic, streamID, {
      sync: SyncOptions.SYNC_ALWAYS,
    })
    expect(doc.content).toEqual(content)
    expect(doc.state.log.length).toEqual(1)

    await ipfs2.stop()
  })

  test('Pubsub responds with tip from a different stream', async () => {
    // Make sure genesis commit is available to IPFS, but without the Ceramic node knowing about
    // the stream yet.
    const content = { test: 123 }
    const genesis = await TileDocument.makeGenesis(ceramic, content, null)
    const genesisCid = await ceramic.dispatcher.storeCommit(genesis)
    const streamID = new StreamID('tile', genesisCid)

    // make a second random stream
    const otherStream = await TileDocument.create(ceramic, content)
    await otherStream.update({ test: 456 })

    const ipfs2 = await createIPFS()
    await swarmConnect(ipfs, ipfs2)

    await ipfs2.pubsub.subscribe(ceramic.pubsubTopic, (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        const tipMap = new Map().set(streamID.toString(), otherStream.tip)
        const response = { typ: MsgType.RESPONSE, id: message.id, tips: tipMap }
        ipfs2.pubsub.publish(ceramic.pubsubTopic, serialize(response)).catch((error) => {
          // we want the test to fail if an error occurs thus we are rethrowing the error
          throw error
        })
      }
    })

    // The tip should be ignored as it isn't valid for the stream we are trying to load.
    const doc = await TileDocument.load(ceramic, streamID, {
      sync: SyncOptions.SYNC_ALWAYS,
    })
    expect(doc.content).toEqual(content)
    expect(doc.state.log.length).toEqual(1)

    await ipfs2.stop()
  })
})
