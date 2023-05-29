import type { Ceramic } from '@ceramicnetwork/core'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { IpfsApi, SyncOptions, TestUtils } from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import getPort from 'get-port'
import { CeramicDaemon, DaemonConfig } from '@ceramicnetwork/cli'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { jest } from '@jest/globals'
import { createCeramic } from '../create-ceramic.js'
import MockDate from 'mockdate'

describe('multiquery API http-client tests', () => {
  let ipfs: IpfsApi
  let ceramic: CeramicClient
  let core: Ceramic
  let daemon: CeramicDaemon

  beforeAll(async () => {
    ipfs = await createIPFS()
    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    core = await createCeramic(ipfs)
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({
        'http-api': { port: port, 'admin-dids': [core.did.id.toString()] },
        node: {},
      })
    )
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl, { syncInterval: 100 })
    ceramic.did = core.did
  })

  afterAll(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
    await ipfs.stop()
  }, 120000)

  afterEach(() => {
    MockDate.reset()
  })

  function advanceTime() {
    MockDate.set(new Date(new Date().valueOf() + 1000)) // Plus 1 second
  }

  /**
   * Asserts that the given timestamps are within 5 seconds of each other
   */
  function expectTimestampsClose(givenTimestamp: number, expectedTimestamp: number) {
    expect(Math.abs(expectedTimestamp - givenTimestamp)).toBeLessThan(5)
  }

  it('loads the same stream at multiple points in time using atTime', async () => {
    const streamTimestamps = []
    const streamStates = []
    const stream = await TileDocument.create(ceramic, { test: '321f' })

    // test data for the atTime feature
    streamStates.push(stream.state)
    // timestamp before the first anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    advanceTime()
    await stream.update({ ...stream.content, update: 'new stuff' })
    await TestUtils.anchorUpdate(core, stream)
    advanceTime()
    // timestamp between the first and the second anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    streamStates.push(stream.state)
    advanceTime()
    await stream.update({ ...stream.content, update: 'newer stuff' })
    await TestUtils.anchorUpdate(core, stream)
    advanceTime()
    // timestamp after the second anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    streamStates.push(stream.state)

    const queries = [
      {
        streamId: stream.id,
        atTime: streamTimestamps[0],
      },
      {
        streamId: stream.id,
        atTime: streamTimestamps[1],
      },
      {
        streamId: stream.id,
        atTime: streamTimestamps[2],
      },
      {
        streamId: stream.id,
      },
    ]
    const streams = await ceramic.multiQuery(queries)

    expect(Object.keys(streams).length).toEqual(4)
    const states = Object.values(streams).map((stream) => stream.state)
    // annoying thing, was pending when snapshotted but will
    // obviously not be when loaded at a specific commit
    streamStates[0].anchorStatus = 0

    // first stream state didn't have an anchor timestamp when it was added to the streamStates
    // array, but it does get a timestamp after being anchored
    // Assert that the timestamp it got from being anchored is within 10 seconds of when it was created
    expectTimestampsClose(states[0].log[0].timestamp, streamTimestamps[0])
    delete states[0].log[0].timestamp

    expect(states[0]).toEqual(streamStates[0])
    expect(states[1]).toEqual(streamStates[1])
    expect(states[2]).toEqual(streamStates[2])
    expect(states[3]).toEqual(stream.state)
  }, 60000)

  it('loads the same stream at multiple points in time using opts.atTime', async () => {
    const streamTimestamps = []
    const streamStates = []
    const stream = await TileDocument.create(ceramic, { test: '321f' })

    // test data for the atTime feature
    streamStates.push(stream.state)
    // timestamp before the first anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    advanceTime()
    await stream.update({ ...stream.content, update: 'new stuff' })
    await TestUtils.anchorUpdate(core, stream)
    advanceTime()
    // timestamp between the first and the second anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    streamStates.push(stream.state)
    advanceTime()
    await stream.update({ ...stream.content, update: 'newer stuff' })
    await TestUtils.anchorUpdate(core, stream)
    advanceTime()
    // timestamp after the second anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    streamStates.push(stream.state)

    const queries = [
      {
        streamId: stream.id,
        opts: { atTime: streamTimestamps[0] },
      },
      {
        streamId: stream.id,
        opts: { atTime: streamTimestamps[1] },
      },
      {
        streamId: stream.id,
        opts: { atTime: streamTimestamps[2] },
      },
      {
        streamId: stream.id,
      },
    ]
    const streams = await ceramic.multiQuery(queries)

    expect(Object.keys(streams).length).toEqual(4)
    const states = Object.values(streams).map((stream) => stream.state)
    // annoying thing, was pending when snapshotted but will
    // obviously not be when loaded at a specific commit
    streamStates[0].anchorStatus = 0

    // first stream state didn't have an anchor timestamp when it was added to the streamStates
    // array, but it does get a timestamp after being anchored
    // Assert that the timestamp it got from being anchored is within 10 seconds of when it was created
    expectTimestampsClose(states[0].log[0].timestamp, streamTimestamps[0])
    delete states[0].log[0].timestamp

    expect(states[0]).toEqual(streamStates[0])
    expect(states[1]).toEqual(streamStates[1])
    expect(states[2]).toEqual(streamStates[2])
    expect(states[3]).toEqual(stream.state)
  }, 60000)

  it('serailizes syncopts correctly', async () => {
    const streamTimestamps = []
    const streamStates = []
    const stream = await TileDocument.create(ceramic, { test: '321f' })

    // test data for the atTime feature
    streamStates.push(stream.state)
    // timestamp before the first anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    advanceTime()
    await stream.update({ ...stream.content, update: 'new stuff' })
    await TestUtils.anchorUpdate(core, stream)
    advanceTime()
    // timestamp between the first and the second anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    streamStates.push(stream.state)
    advanceTime()
    await stream.update({ ...stream.content, update: 'newer stuff' })
    await TestUtils.anchorUpdate(core, stream)
    advanceTime()
    // timestamp after the second anchor commit
    streamTimestamps.push(Math.floor(Date.now() / 1000))
    streamStates.push(stream.state)

    const loadStreamSpy = jest.spyOn(core, 'loadStream')

    const queries = [
      {
        streamId: stream.id,
        opts: {
          sync: SyncOptions.PREFER_CACHE,
          atTime: streamTimestamps[0],
        },
      },
      {
        streamId: stream.id,
        opts: {
          sync: SyncOptions.SYNC_ALWAYS,
          atTime: streamTimestamps[1],
        },
      },
      {
        streamId: stream.id,
        opts: {
          sync: SyncOptions.NEVER_SYNC,
          atTime: streamTimestamps[2],
        },
      },
      {
        streamId: stream.id,
        opts: {
          sync: SyncOptions.SYNC_ON_ERROR,
        },
      },
    ]
    const streams = await ceramic.multiQuery(queries)

    expect(loadStreamSpy).toHaveBeenNthCalledWith(1, stream.id, {
      sync: SyncOptions.PREFER_CACHE,
      atTime: streamTimestamps[0],
    })

    expect(loadStreamSpy).toHaveBeenNthCalledWith(2, stream.id, {
      sync: SyncOptions.SYNC_ALWAYS,
      atTime: streamTimestamps[1],
    })

    expect(loadStreamSpy).toHaveBeenNthCalledWith(3, stream.id, {
      sync: SyncOptions.NEVER_SYNC,
      atTime: streamTimestamps[2],
    })

    expect(loadStreamSpy).toHaveBeenNthCalledWith(4, stream.id, {
      sync: SyncOptions.SYNC_ON_ERROR,
    })

    const states = Object.values(streams).map((stream) => stream.state)
    // annoying thing, was pending when snapshotted but will
    // obviously not be when loaded at a specific commit
    streamStates[0].anchorStatus = 0

    // first stream state didn't have an anchor timestamp when it was added to the streamStates
    // array, but it does get a timestamp after being anchored
    // Assert that the timestamp it got from being anchored is within 10 seconds of when it was created
    expectTimestampsClose(states[0].log[0].timestamp, streamTimestamps[0])
    delete states[0].log[0].timestamp

    expect(states[0]).toEqual(streamStates[0])
    expect(states[1]).toEqual(streamStates[1])
    expect(states[2]).toEqual(streamStates[2])
    expect(states[3]).toEqual(stream.state)
  }, 60000)
})
