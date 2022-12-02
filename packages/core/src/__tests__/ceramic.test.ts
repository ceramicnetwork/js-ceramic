import { jest } from '@jest/globals'
import {
  StreamUtils,
  IpfsApi,
  TestUtils,
  StreamState,
  SyncOptions,
  GenesisCommit,
  MultiQuery,
  CeramicApi,
} from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { StreamID, CommitID } from '@ceramicnetwork/streamid'
import { createIPFS, swarmConnect, withFleet } from '@ceramicnetwork/ipfs-daemon'
import { Ceramic } from '../ceramic.js'
import { createCeramic as vanillaCreateCeramic } from './create-ceramic.js'

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

function expectEqualStates(a: StreamState, b: StreamState) {
  expect(StreamUtils.serializeState(a)).toEqual(StreamUtils.serializeState(b))
}

describe('Ceramic integration', () => {
  jest.setTimeout(240000)

  it('can propagate update across two connected nodes', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs2, ipfs1)

      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)
      const stream1 = await TileDocument.create(ceramic1, { test: 123 }, null, {
        anchor: false,
        publish: false,
      })
      const stream2 = await TileDocument.load(ceramic2, stream1.id)
      expect(stream1.content).toEqual(stream2.content)
      expectEqualStates(stream1.state, stream2.state)
      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it("won't propagate update across two disconnected nodes", async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)

      const stream1 = await TileDocument.create(ceramic1, { test: 456 })

      await TestUtils.anchorUpdate(ceramic1, stream1)

      // we can't load stream from id since nodes are not connected
      // so we won't find the genesis object from it's CID
      const stream2 = await TileDocument.create(ceramic2, { test: 456 }, null, {
        anchor: false,
        publish: false,
      })
      expect(stream1.content).toEqual(stream2.content)
      expect(stream2.state).toEqual(expect.objectContaining({ content: { test: 456 } }))
      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('can propagate update across nodes with common connection', async () => {
    await withFleet(3, async ([ipfs1, ipfs2, ipfs3]) => {
      // ipfs1 <-> ipfs2 <-> ipfs3
      // ipfs1 <!-> ipfs3
      await swarmConnect(ipfs1, ipfs2)
      await swarmConnect(ipfs2, ipfs3)

      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)
      const ceramic3 = await createCeramic(ipfs3)

      // ceramic node 2 shouldn't need to have the stream open in order to forward the message
      const stream1 = await TileDocument.create(ceramic1, { test: 789 }, null, {
        anchor: false,
        publish: false,
      })
      const stream3 = await TileDocument.create(ceramic3, { test: 789 }, null, {
        anchor: false,
        publish: false,
      })
      expect(stream3.content).toEqual(stream1.content)
      await ceramic1.close()
      await ceramic2.close()
      await ceramic3.close()
    })
  })

  it('can propagate multiple update across nodes with common connection', async () => {
    await withFleet(3, async ([ipfs1, ipfs2, ipfs3]) => {
      // ipfs1 <-> ipfs2 <-> ipfs3
      // ipfs1 <!-> ipfs3
      await swarmConnect(ipfs1, ipfs2)
      await swarmConnect(ipfs2, ipfs3)

      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)
      const ceramic3 = await createCeramic(ipfs3)

      const metadata = {
        deterministic: true,
        controllers: [ceramic1.did.id],
        family: 'family',
        tags: ['x', 'y'],
      }

      // ceramic node 2 shouldn't need to have the stream open in order to forward the message
      const stream1 = await TileDocument.create(ceramic1, null, metadata)
      await stream1.update({ test: 321 })

      await TestUtils.anchorUpdate(ceramic1, stream1)

      // Through a different ceramic instance create a new stream with the same contents that will
      // therefore resolve to the same genesis commit and thus the same streamId.  Make sure the new
      // Document object can see the updates made to the first Document object since they represent
      // the same Document in the network.
      const stream3 = await TileDocument.create(ceramic3, null, metadata)

      expect(stream3.content).toEqual(stream1.content)

      await stream1.update({ test: 'abcde' })

      await TestUtils.anchorUpdate(ceramic1, stream1)

      expect(stream1.content).toEqual({ test: 'abcde' })
      await TestUtils.waitForState(
        stream3,
        2000,
        (state) => StreamUtils.statesEqual(state, stream1.state),
        () => {
          throw new Error(`streamtype3.state should equal streamtype1.state`)
        }
      )

      await ceramic1.close()
      await ceramic2.close()
      await ceramic3.close()
    })
  })

  it('can apply existing commits successfully', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      const ceramic1 = await createCeramic(ipfs1)
      const ceramic2 = await createCeramic(ipfs2)

      const stream1 = await TileDocument.create<any>(ceramic1, { test: 456 })

      await TestUtils.anchorUpdate(ceramic1, stream1)

      await stream1.update({ test: 'abcde' })

      await TestUtils.anchorUpdate(ceramic1, stream1)

      const logCommits = await ceramic1.loadStreamCommits(stream1.id)

      let stream2 = await TileDocument.createFromGenesis(ceramic2, logCommits[0].value, {
        anchor: false,
        publish: false,
      })
      for (let i = 1; i < logCommits.length; i++) {
        stream2 = await ceramic2.applyCommit(stream2.id, logCommits[i].value, {
          anchor: false,
          publish: false,
        })
      }

      expect(stream1.content).toEqual(stream2.content)
      expectEqualStates(stream1.state, stream2.state)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('can utilize stream commit cache', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false, 2)
      const ceramic2 = await createCeramic(ipfs2, false, 1)

      const repository1 = ceramic1.repository
      const addSpy1 = jest.spyOn(repository1, 'add')
      const loadSpy1 = jest.spyOn(repository1, 'load')

      const repository2 = ceramic2.repository
      const addSpy2 = jest.spyOn(repository2, 'add')
      const loadSpy2 = jest.spyOn(repository2, 'load')

      const stream1 = await TileDocument.create<any>(ceramic1, { test: 456 }, null, {
        publish: false,
      })
      expect(stream1).toBeDefined()

      await TestUtils.anchorUpdate(ceramic1, stream1)

      expect(addSpy1).toBeCalledTimes(1)
      expect(loadSpy1).toBeCalledTimes(1)

      addSpy1.mockClear()
      loadSpy1.mockClear()

      await stream1.update({ test: 'abcde' }, null, { publish: false })

      await TestUtils.anchorUpdate(ceramic1, stream1)

      const prevCommitStreamId1 = CommitID.make(stream1.id, stream1.state.log[3].cid)
      expect(addSpy2).not.toBeCalled()
      const loadedDoc1 = await ceramic2.loadStream(prevCommitStreamId1)
      expect(loadedDoc1).toBeDefined()

      expect(loadSpy2).toBeCalled()
      expect(addSpy2).toBeCalledTimes(1)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('cannot utilize disabled stream commit cache', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false, 2)
      const ceramic2 = await createCeramic(ipfs2, false, 1)

      const repository1 = ceramic1.repository
      const addSpy1 = jest.spyOn(repository1, 'add')
      const loadSpy1 = jest.spyOn(repository1, 'load')

      const repository2 = ceramic2.repository
      const addSpy2 = jest.spyOn(repository2, 'add')
      const loadSpy2 = jest.spyOn(repository2, 'load')

      const stream1 = await TileDocument.create<any>(ceramic1, { test: 456 })
      expect(loadSpy1).toBeCalledTimes(1)
      expect(addSpy1).toBeCalledTimes(1)
      expect(stream1).toBeDefined()

      await TestUtils.anchorUpdate(ceramic1, stream1)

      addSpy1.mockClear()
      loadSpy1.mockClear()

      await stream1.update({ test: 'abcde' })
      expect(loadSpy1).toBeCalledTimes(1)
      expect(addSpy1).toBeCalledTimes(0)

      await TestUtils.anchorUpdate(ceramic1, stream1)

      const prevCommitStreamId1 = CommitID.make(stream1.id, stream1.state.log[3].cid)
      expect(addSpy2).not.toBeCalled()
      const stream2 = await ceramic2.loadStream(prevCommitStreamId1)
      expect(stream2).toBeDefined()

      expect(loadSpy2).toBeCalled()
      expect(addSpy2).toBeCalledTimes(1)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it("Won't sync if already in cache", async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const content0 = { foo: 0 }
      const content1 = { foo: 1 }
      const content2 = { foo: 2 }

      const stream1 = await TileDocument.create(ceramic1, content0, null, { anchor: false })
      await stream1.update(content1, null, { anchor: false })

      // Now load the stream into the cache on second node.
      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id)

      // Now update the stream on node 1, but don't tell node 2 about it.
      await stream1.update(content2, null, { anchor: false, publish: false })

      // Now try loading the stream again on node 2. Loading with PREFER_CACHE should get old version,
      // but using SYNC_ALWAYS should get current version.
      const stream3 = await ceramic2.loadStream<TileDocument>(stream1.id, {
        sync: SyncOptions.NEVER_SYNC,
      })
      const stream4 = await ceramic2.loadStream<TileDocument>(stream1.id, {
        sync: SyncOptions.PREFER_CACHE,
      })
      const stream5 = await ceramic2.loadStream<TileDocument>(stream1.id, {
        sync: SyncOptions.SYNC_ALWAYS,
      })

      expect(stream2.content).toEqual(content1)
      expect(stream3.content).toEqual(content1)
      expect(stream4.content).toEqual(content1)
      expect(stream5.content).toEqual(content2)

      // Cache should be updated to newest version
      const stream6 = await ceramic2.loadStream<TileDocument>(stream1.id, {
        sync: SyncOptions.PREFER_CACHE,
      })
      expect(stream6.content).toEqual(content2)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it("Loading stream at commit doesn't prevent loading current tip", async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const content0 = { foo: 0 }
      const content1 = { foo: 1 }
      const content2 = { foo: 2 }

      const stream1 = await TileDocument.create(ceramic1, content0, null, { anchor: false })
      await stream1.update(content1, null, { anchor: false })
      await stream1.update(content2, null, { anchor: false })

      const middleCommitId = CommitID.make(stream1.id, stream1.state.log[1].cid)

      // Now load the stream into the cache on second node at a commit ID that is not the most recent.
      const stream2 = await ceramic2.loadStream<TileDocument>(middleCommitId)
      // Now load current version and make sure the fact that older version is in the cache doesn't
      // prevent getting current version
      const stream3 = await ceramic2.loadStream<TileDocument>(stream1.id)
      expect(stream2.content).toEqual(content1)
      expect(stream3.content).toEqual(content2)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it("Loading at a CommitID that's ahead of the cache will update the cache", async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const content0 = { foo: 0 }
      const content1 = { foo: 1 }
      const content2 = { foo: 2 }

      const stream1 = await TileDocument.create(ceramic1, content0, null, { anchor: false })
      await stream1.update(content1, null, { anchor: false })

      // Now load the stream into the cache on second node.
      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id)
      expect(stream2.content).toEqual(content1)

      // Now update the stream on node 1, but don't tell node 2 about it.
      await stream1.update(content2, null, { anchor: false, publish: false })

      // Now load the CommitID of the newest update on node 2.
      const streamAtCommit = await ceramic2.loadStream<TileDocument>(stream1.commitId)
      expect(streamAtCommit.content).toEqual(content2)

      // Now ensure that the stream cache has been updated to the newest commit.
      const streamCurrent = await ceramic2.loadStream<TileDocument>(stream1.id, {
        sync: SyncOptions.NEVER_SYNC,
        syncTimeoutSeconds: 0,
      })
      expect(streamCurrent.content).toEqual(content2)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('Loading a CommitID and StreamID via multiquery considers CommitID tip', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const content0 = { foo: 0 }
      const content1 = { foo: 1 }
      const content2 = { foo: 2 }

      const stream1 = await TileDocument.create(ceramic1, content0, null, { anchor: false })
      await stream1.update(content1, null, { anchor: false })

      // Now load the stream into the cache on second node.
      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id)
      expect(stream2.content).toEqual(content1)

      // Now update the stream on node 1, but don't tell node 2 about it.
      await stream1.update(content2, null, { anchor: false, publish: false })

      // Now load both the CommitID of the newest update and the base StreamID on node 2. The
      // base StreamID version of the stream returned should include the new commit.
      const res = await ceramic2.multiQuery([
        { streamId: stream1.commitId },
        { streamId: stream1.id },
      ])
      const streamAtCommit = res[stream1.commitId.toString()] as TileDocument
      const streamCurrent = res[stream1.id.toString()] as TileDocument
      expect(streamAtCommit.content).toEqual(content2)
      expect(streamCurrent.content).toEqual(content2)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('Loading many commits of same stream via multiquery works', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const NUM_UPDATES = 20
      const stream = await TileDocument.create(ceramic1, { counter: 0 }, null, { anchor: false })
      for (let i = 1; i < NUM_UPDATES; i++) {
        await stream.update({ counter: i }, null, { anchor: false, publish: false })
      }

      const queries: Array<MultiQuery> = [{ streamId: stream.id }]
      for (const commitId of stream.allCommitIds) {
        queries.push({ streamId: commitId })
      }

      const result = await ceramic2.multiQuery(queries, 30000)
      expect(Object.keys(result).length).toEqual(stream.allCommitIds.length + 1) // +1 for base streamid
      expect(result[stream.id.toString()].content).toEqual({ counter: NUM_UPDATES - 1 })

      let i = 0
      for (const commitId of stream.allCommitIds) {
        const docAtCommit = result[commitId.toString()]
        expect(docAtCommit.content).toEqual({ counter: i++ })
      }

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('Multiquery with genesis commit provided', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const content = { foo: 'bar' }
      const metadata = {
        controllers: [ceramic1.did.id],
        family: 'family',
        tags: ['x', 'y'],
      }

      // Create a deterministic TileDocument
      const stream1 = await TileDocument.create(
        ceramic1,
        null,
        { ...metadata, deterministic: true },
        { anchor: false, publish: false }
      )
      await stream1.update(content)

      // Create (off-chain) the deterministic TileDocument genesis commit
      const genesisCommit = (await TileDocument.makeGenesis(ceramic1, null, {
        ...metadata,
        deterministic: true,
      })) as GenesisCommit

      // Try loading the stream on node 2 and provide the genesis commit
      const res = await ceramic2.multiQuery([
        {
          streamId: stream1.id,
          genesis: genesisCommit,
        },
      ])

      const resolvedStream = res[stream1.id.toString()]
      expect(resolvedStream.content).toEqual(content)
      expect(resolvedStream.metadata).toEqual(metadata)

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('Multiquery with genesis commit provided but no document created', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const content = null
      const metadata = {
        controllers: [ceramic1.did.id],
        family: 'family',
        tags: ['x', 'y'],
      }

      // Create (off-chain) the deterministic TileDocument genesis commit
      const genesisCommit = (await TileDocument.makeGenesis(ceramic1, content, {
        ...metadata,
        deterministic: true,
      })) as GenesisCommit

      // Get stream ID for the genesis commit
      const streamID = await StreamID.fromGenesis('tile', genesisCommit)

      // Try loading the stream on node 2 and provide the genesis commit
      const res = await ceramic2.multiQuery([
        {
          streamId: streamID,
          genesis: genesisCommit,
        },
      ])

      const resolvedStream = res[streamID.toString()]
      expect(resolvedStream.content).toEqual({})
      expect(resolvedStream.metadata).toEqual(metadata)
      const pinned = await TestUtils.isPinned(ceramic2, streamID)
      expect(pinned).toBeTruthy()

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('should return empty entry multiquery if provided genesis commit is different from given streamId', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const contentA = null

      const metadata = {
        controllers: [ceramic1.did.id],
        family: 'family',
        tags: ['x', 'y'],
      }

      const metadata2 = {
        controllers: [ceramic1.did.id],
        family: 'family',
        tags: ['x', 'y', 'z'],
      }

      // Create a deterministic TileDocument with contentA
      const stream1 = await TileDocument.create(
        ceramic1,
        contentA,
        { ...metadata, deterministic: true },
        { anchor: false, publish: false }
      )

      // Create (off-chain) deterministic TileDocument genesis commit with contentB
      const genesisCommit = (await TileDocument.makeGenesis(
        ceramic2,
        contentA,
        metadata2
      )) as GenesisCommit

      // Try loading the stream on node2 and provide genesisCommit
      await expect(
        ceramic2.multiQuery([
          {
            streamId: stream1.id,
            genesis: genesisCommit,
          },
        ])
      ).resolves.toEqual({})

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('Should return empty entry multiquery if genesis commit is not deterministic', async () => {
    await withFleet(2, async ([ipfs1, ipfs2]) => {
      await swarmConnect(ipfs1, ipfs2)
      const ceramic1 = await createCeramic(ipfs1, false)
      const ceramic2 = await createCeramic(ipfs2, false)

      const content = {
        foo: 'bar',
      }

      const metadata = {
        controllers: [ceramic1.did.id],
        family: 'family',
        tags: ['x', 'y'],
      }

      // Random streamID
      const streamID = new StreamID(
        'tile',
        'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a'
      )

      // Create (off-chain) non-deterministic TileDocument genesis commit with content
      const genesisCommit = (await TileDocument.makeGenesis(
        ceramic2,
        content,
        metadata
      )) as GenesisCommit

      // Try loading the stream on node2 and provide genesisCommit
      const result = await ceramic2.multiQuery([
        {
          streamId: streamID,
          genesis: genesisCommit,
        },
      ])
      expect(result).toEqual({})

      await ceramic1.close()
      await ceramic2.close()
    })
  })

  it('validates schema on stream change', async () => {
    await withFleet(1, async ([ipfs1]) => {
      const ceramic = await createCeramic(ipfs1)

      const NoteSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Note',
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date-time',
            maxLength: 30,
          },
          text: {
            type: 'string',
            maxLength: 4000,
          },
        },
        required: ['date', 'text'],
      }
      const noteSchema = await TileDocument.create(ceramic, NoteSchema)

      const stream = await TileDocument.create<any>(
        ceramic,
        { date: '2021-01-06T14:28:00.000Z', text: 'hello first' },
        { schema: noteSchema.commitId.toUrl() }
      )

      await expect(stream.update({ date: 'invalid-date' })).rejects.toThrow()
      await ceramic.close()
    })
  })
})

describe('buildStreamFromState', () => {
  let ipfs: IpfsApi
  let ceramic: CeramicApi
  beforeEach(async () => {
    ipfs = await createIPFS()
    ceramic = await createCeramic(ipfs)
  })

  afterEach(async () => {
    await ceramic.close()
    await ipfs.stop()
  })

  test('build instance of Streamtype', async () => {
    const tile = await TileDocument.create(ceramic, { hello: 'world' })
    const created = ceramic.buildStreamFromState(tile.state)
    expect(created).toBeInstanceOf(TileDocument)
    expect(created.id).toEqual(tile.id)
    expect(created.content).toEqual(tile.content)
  })
})
