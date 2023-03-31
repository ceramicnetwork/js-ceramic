import tmp from 'tmp-promise'
import type {Ceramic} from '../../../core/src/ceramic.js'
import { createCeramic } from '../../../core/src/__tests__/create-ceramic.js'
import {TileDocument} from '@ceramicnetwork/stream-tile'
import {IpfsApi, SyncOptions, TestUtils} from '@ceramicnetwork/common'
import {StreamID} from '@ceramicnetwork/streamid'
import {createIPFS} from '@ceramicnetwork/ipfs-daemon'
import getPort from 'get-port'
import {CeramicDaemon, DaemonConfig} from "@ceramicnetwork/cli";
import {CeramicClient} from "@ceramicnetwork/http-client";
import {jest} from '@jest/globals'
describe('multiquery API http-client tests', () => {
  let ipfs: IpfsApi
  let ceramic: CeramicClient
  let core: Ceramic
  let daemon: CeramicDaemon
  let tmpFolder: tmp.DirectoryResult
  let streamA: TileDocument,
    streamB: TileDocument,
    streamC: TileDocument,
    streamD: TileDocument,
    streamE: TileDocument,
    streamF: TileDocument
  const notExistStreamId = StreamID.fromString(
    'kjzl6cwe1jw1495fyn7770ujykvl1f8sskbzsevlux062ajragz9hp3akdqbmdg'
  )
  const streamFTimestamps = []
  const streamFStates = []

  beforeAll(async () => {
    ipfs = await createIPFS()
    tmpFolder = await tmp.dir({ unsafeCleanup: true })
    const port = await getPort()
    const apiUrl = 'http://localhost:' + port
    ceramic = await createCeramic(ipfs, {
      stateStoreDirectory: tmpFolder.path,
      networkName: 'inmemory',
    })
    core = await createCeramic(ipfs)
    daemon = new CeramicDaemon(
      core,
      DaemonConfig.fromObject({
        'http-api': { port: port, 'admin-dids': [core.did.id.toString()] },
        node: {},
      })
    )
    await daemon.listen()
    ceramic = new CeramicClient(apiUrl)
    ceramic.did = core.did

    streamF = await TileDocument.create(ceramic, { test: '321f' })
    streamE = await TileDocument.create(ceramic, { f: streamF.id.toUrl() })
    streamD = await TileDocument.create(ceramic, { test: '321d' })
    streamC = await TileDocument.create(ceramic, { test: '321c' })
    streamB = await TileDocument.create(ceramic, {
      e: streamE.id.toUrl(),
      d: streamD.id.toUrl(),
      notDoc: '123',
    })
    streamA = await TileDocument.create(ceramic, {
      b: streamB.id.toUrl(),
      c: streamC.id.toUrl(),
      notExistStreamId: notExistStreamId.toUrl(),
      notDoc: '123',
    })
  })

  afterAll(async () => {
    await ceramic.close()
    await daemon.close()
    await core.close()
    await ipfs.stop()
    await tmpFolder.cleanup()
  }, 120000)

  /**
   * Asserts that the given timestamps are within 5 seconds of each other
   */
  function expectTimestampsClose(givenTimestamp: number, expectedTimestamp: number) {
    expect(Math.abs(expectedTimestamp - givenTimestamp)).toBeLessThan(5)
  }

  // it('loads the same stream at multiple points in time using atTime', async () => {
  //   // test data for the atTime feature
  //   streamFStates.push(streamF.state)
  //   // timestamp before the first anchor commit
  //   streamFTimestamps.push(Math.floor(Date.now() / 1000))
  //   await TestUtils.delay(1000)
  //   await streamF.update({ ...streamF.content, update: 'new stuff' })
  //   await TestUtils.anchorUpdate(core, streamF)
  //   await TestUtils.delay(1000)
  //   // timestamp between the first and the second anchor commit
  //   streamFTimestamps.push(Math.floor(Date.now() / 1000))
  //   streamFStates.push(streamF.state)
  //   await TestUtils.delay(1000)
  //   await streamF.update({ ...streamF.content, update: 'newer stuff' })
  //   await TestUtils.anchorUpdate(core, streamF)
  //   await TestUtils.delay(1000)
  //   // timestamp after the second anchor commit
  //   streamFTimestamps.push(Math.floor(Date.now() / 1000))
  //   streamFStates.push(streamF.state)
  //
  //   const queries = [
  //     {
  //       streamId: streamF.id,
  //       atTime: streamFTimestamps[0],
  //     },
  //     {
  //       streamId: streamF.id,
  //       atTime: streamFTimestamps[1],
  //     },
  //     {
  //       streamId: streamF.id,
  //       atTime: streamFTimestamps[2],
  //     },
  //     {
  //       streamId: streamF.id,
  //     },
  //   ]
  //   const streams = await ceramic.multiQuery(queries)
  //
  //   expect(Object.keys(streams).length).toEqual(4)
  //   const states = Object.values(streams).map((stream) => stream.state)
  //   // annoying thing, was pending when snapshotted but will
  //   // obviously not be when loaded at a specific commit
  //   streamFStates[0].anchorStatus = 0
  //
  //   // first stream state didn't have an anchor timestamp when it was added to the streamFStates
  //   // array, but it does get a timestamp after being anchored
  //   // Assert that the timestamp it got from being anchored is within 10 seconds of when it was created
  //   expect(Math.abs(states[0].log[0].timestamp - streamFTimestamps[0])).toBeLessThan(5)
  //   delete states[0].log[0].timestamp
  //
  //   expect(states[0]).toEqual(streamFStates[0])
  //   expect(states[1]).toEqual(streamFStates[1])
  //   expect(states[2]).toEqual(streamFStates[2])
  //   expect(states[3]).toEqual(streamF.state)
  // }, 60000)
  //
  // it('loads the same stream at multiple points in time using opts.atTime', async () => {
  //   // test data for the atTime feature
  //   streamFStates.push(streamF.state)
  //   // timestamp before the first anchor commit
  //   streamFTimestamps.push(Math.floor(Date.now() / 1000))
  //   await TestUtils.delay(1000)
  //   await streamF.update({ ...streamF.content, update: 'new stuff' })
  //   await TestUtils.anchorUpdate(core, streamF)
  //   await TestUtils.delay(1000)
  //   // timestamp between the first and the second anchor commit
  //   streamFTimestamps.push(Math.floor(Date.now() / 1000))
  //   streamFStates.push(streamF.state)
  //   await TestUtils.delay(1000)
  //   await streamF.update({ ...streamF.content, update: 'newer stuff' })
  //   await TestUtils.anchorUpdate(core, streamF)
  //   await TestUtils.delay(1000)
  //   // timestamp after the second anchor commit
  //   streamFTimestamps.push(Math.floor(Date.now() / 1000))
  //   streamFStates.push(streamF.state)
  //
  //   const queries = [
  //     {
  //       streamId: streamF.id,
  //       opts: {atTime: streamFTimestamps[0]},
  //     },
  //     {
  //       streamId: streamF.id,
  //       opts: {atTime: streamFTimestamps[1]},
  //     },
  //     {
  //       streamId: streamF.id,
  //       opts: {atTime: streamFTimestamps[2]},
  //     },
  //     {
  //       streamId: streamF.id,
  //     },
  //   ]
  //   const streams = await ceramic.multiQuery(queries)
  //
  //   expect(Object.keys(streams).length).toEqual(4)
  //   const states = Object.values(streams).map((stream) => stream.state)
  //   // annoying thing, was pending when snapshotted but will
  //   // obviously not be when loaded at a specific commit
  //   streamFStates[0].anchorStatus = 0
  //
  //   // first stream state didn't have an anchor timestamp when it was added to the streamFStates
  //   // array, but it does get a timestamp after being anchored
  //   // Assert that the timestamp it got from being anchored is within 10 seconds of when it was created
  //   expect(Math.abs(states[0].log[0].timestamp - streamFTimestamps[0])).toBeLessThan(5)
  //   delete states[0].log[0].timestamp
  //
  //   expect(states[0]).toEqual(streamFStates[0])
  //   expect(states[1]).toEqual(streamFStates[1])
  //   expect(states[2]).toEqual(streamFStates[2])
  //   expect(states[3]).toEqual(streamF.state)
  // }, 60000)


  it('serailizes syncopts correctly', async () => {
    // test data for the atTime feature
    streamFStates.push(streamF.state)
    // timestamp before the first anchor commit
    streamFTimestamps.push(Math.floor(Date.now() / 1000))
    await TestUtils.delay(1000)
    await streamF.update({ ...streamF.content, update: 'new stuff' })
    await TestUtils.anchorUpdate(core, streamF)
    await TestUtils.delay(1000)
    // timestamp between the first and the second anchor commit
    streamFTimestamps.push(Math.floor(Date.now() / 1000))
    streamFStates.push(streamF.state)
    await TestUtils.delay(1000)
    await streamF.update({ ...streamF.content, update: 'newer stuff' })
    await TestUtils.anchorUpdate(core, streamF)
    await TestUtils.delay(1000)
    // timestamp after the second anchor commit
    streamFTimestamps.push(Math.floor(Date.now() / 1000))
    streamFStates.push(streamF.state)

    const loadStreamSpy = jest.spyOn(core, "loadStream")

    const queries = [
      {
        streamId: streamF.id,
        opts: {
            sync: SyncOptions.PREFER_CACHE,
            atTime: streamFTimestamps[0]
          },
      },
      {
        streamId: streamF.id,
        opts: {
          sync: SyncOptions.SYNC_ALWAYS,
          atTime: streamFTimestamps[1]
        },
      },
      {
        streamId: streamF.id,
        opts: {
          sync: SyncOptions.NEVER_SYNC,
          atTime: streamFTimestamps[2]
        },
      },
      {
        streamId: streamF.id,
        opts: {
          sync: SyncOptions.SYNC_ON_ERROR,
          atTime: streamFTimestamps[3]
        },
      }
    ]
    const streams = await ceramic.multiQuery(queries)

    expect(loadStreamSpy).toHaveBeenNthCalledWith( 1,
      streamF.id,
      {
        sync: SyncOptions.PREFER_CACHE,
        atTime: streamFTimestamps[0],
      },
    )

    expect(loadStreamSpy).toHaveBeenNthCalledWith( 2,
      streamF.id,
      {
        sync: SyncOptions.SYNC_ALWAYS,
        atTime: streamFTimestamps[1],
      },
    )

    expect(loadStreamSpy).toHaveBeenNthCalledWith( 3,
      streamF.id,
      {
        sync: SyncOptions.NEVER_SYNC,
        atTime: streamFTimestamps[2],
      },
    )

    expect(loadStreamSpy).toHaveBeenNthCalledWith( 4,
      streamF.id,
      {
        sync: SyncOptions.SYNC_ON_ERROR,
      },
    )

    const states = Object.values(streams).map((stream) => stream.state)
    // annoying thing, was pending when snapshotted but will
    // obviously not be when loaded at a specific commit
    streamFStates[0].anchorStatus = 0

    // first stream state didn't have an anchor timestamp when it was added to the streamFStates
    // array, but it does get a timestamp after being anchored
    // Assert that the timestamp it got from being anchored is within 10 seconds of when it was created
    expect(Math.abs(states[0].log[0].timestamp - streamFTimestamps[0])).toBeLessThan(5)
    delete states[0].log[0].timestamp

    expect(states[0]).toEqual(streamFStates[0])
    expect(states[1]).toEqual(streamFStates[1])
    expect(states[2]).toEqual(streamFStates[2])
    expect(states[3]).toEqual(streamF.state)
  }, 60000)
})
