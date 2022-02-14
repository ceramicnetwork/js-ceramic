import tmp from 'tmp-promise'
import { Ceramic, CeramicConfig } from '../ceramic.js'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { AnchorStatus, StreamUtils, IpfsApi } from '@ceramicnetwork/common'
import { StreamID, CommitID } from '@ceramicnetwork/streamid'
import * as u8a from 'uint8arrays'
import cloneDeep from 'lodash.clonedeep'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { anchorUpdate } from '../state-management/__tests__/anchor-update.js'
import * as ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'

const seed = u8a.fromString(
  '6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83',
  'base16'
)

/**
 * Generates string of particular size in bytes
 * @param size - Size in bytes
 */
const generateStringOfSize = (size): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const len = chars.length
  const random_data = []

  while (size--) {
    random_data.push(chars[(Math.random() * len) | 0])
  }
  return random_data.join('')
}

describe('Ceramic API', () => {
  let ipfs: IpfsApi

  const stringMapSchema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'StringMap',
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
  }

  const makeDID = function (seed: Uint8Array, ceramic: Ceramic): DID {
    const provider = new Ed25519Provider(seed)

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    const resolver = new Resolver({
      ...threeIdResolver,
      ...keyDidResolver,
    })
    return new DID({ provider, resolver })
  }

  const createCeramic = async (c: CeramicConfig = {}): Promise<Ceramic> => {
    c.anchorOnRequest = false
    const ceramic = await Ceramic.create(ipfs, c)

    await ceramic.setDID(makeDID(seed, ceramic))
    return ceramic
  }

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  describe('API', () => {
    let ceramic: Ceramic
    let tmpFolder: tmp.DirectoryResult

    beforeEach(async () => {
      tmpFolder = await tmp.dir({ unsafeCleanup: true })
      ceramic = await createCeramic({
        stateStoreDirectory: tmpFolder.path,
      })
    })

    afterEach(async () => {
      await ceramic.close()
      tmpFolder.cleanup()
    })

    it('can load the previous stream commit', async () => {
      const streamOg = await TileDocument.create<any>(ceramic, { test: 321 })

      // wait for anchor (new commit)
      await anchorUpdate(ceramic, streamOg)

      expect(streamOg.state.log.length).toEqual(2)
      expect(streamOg.content).toEqual({ test: 321 })
      expect(streamOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const stateOg = streamOg.state

      await streamOg.update({ test: 'abcde' })

      // wait for anchor (new commit)
      await anchorUpdate(ceramic, streamOg)

      expect(streamOg.state.log.length).toEqual(4)
      expect(streamOg.content).toEqual({ test: 'abcde' })
      expect(streamOg.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const streamV1Id = CommitID.make(streamOg.id, streamOg.state.log[1].cid)
      const streamV1 = await ceramic.loadStream<TileDocument>(streamV1Id)
      expect(streamV1.state).toEqual(stateOg)
      expect(streamV1.content).toEqual({ test: 321 })
      expect(streamV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // try to call streamtype.update
      try {
        await streamV1.update({ test: 'fghj' })
        throw new Error('Should not be able to update commit')
      } catch (e) {
        expect(e.message).toEqual(
          'Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.'
        )
      }

      await expect(async () => {
        const updateCommit = await streamV1.makeCommit(ceramic, { test: 'fghj' })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await ceramic.applyCommit(streamV1Id, updateCommit, { anchor: false, publish: false })
      }).rejects.toThrow(/Not StreamID/)

      // checkout not anchored commit
      const streamV2Id = CommitID.make(streamOg.id, streamOg.state.log[2].cid)
      const streamV2 = await TileDocument.load(ceramic, streamV2Id)
      expect(streamV2.content).toEqual({ test: 'abcde' })
      expect(streamV2.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('Throw on rejected update', async () => {
      const contentOg = { test: 123 }
      const contentRejected = { test: 'rejected' }

      const streamOg = await TileDocument.create<any>(ceramic, contentOg)

      // Create an anchor commit that the original stream handle won't know about
      const streamCopy = await TileDocument.load(ceramic, streamOg.id)
      await anchorUpdate(ceramic, streamCopy)
      expect(streamCopy.state.log.length).toEqual(2)

      // Do an update via the stale stream handle.  Its view of the log is out of date so its update
      // should be rejected by conflict resolution
      expect(streamOg.state.log.length).toEqual(1)
      await expect(streamOg.update(contentRejected)).rejects.toThrow(
        /Commit rejected by conflict resolution/
      )
      expect(streamOg.state.log.length).toEqual(1)

      await streamOg.sync()
      expect(streamOg.state.log.length).toEqual(2)
    })

    it('cannot create stream with invalid schema', async () => {
      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)
      await expect(
        TileDocument.create(ceramic, { a: 1 }, { schema: schemaDoc.commitId })
      ).rejects.toThrow('Validation Error: data/a must be string')
    })

    it('can create stream with valid schema', async () => {
      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)
      await TileDocument.create(ceramic, { a: 'test' }, { schema: schemaDoc.commitId })
    })

    it('must assign schema with specific commit', async () => {
      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)
      await expect(
        TileDocument.create(ceramic, { a: 1 }, { schema: schemaDoc.id.toString() })
      ).rejects.toThrow('Schema must be a CommitID')
    })

    it('can create stream with invalid schema if validation is not set', async () => {
      await ceramic.close()
      ceramic = await createCeramic({ validateStreams: false })

      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)
      await TileDocument.create(ceramic, { a: 1 }, { schema: schemaDoc.commitId })
    })

    it('can assign schema if content is valid', async () => {
      const stream = await TileDocument.create(ceramic, { a: 'x' })
      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)
      await stream.update(stream.content, { schema: schemaDoc.commitId })

      expect(stream.content).toEqual({ a: 'x' })
      expect(stream.metadata.schema).toEqual(schemaDoc.commitId.toString())
    })

    it('cannot assign schema if content is not valid', async () => {
      const stream = await TileDocument.create(ceramic, { a: 1 })
      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)
      await expect(stream.update(stream.content, { schema: schemaDoc.commitId })).rejects.toThrow(
        `Validation Error: data/a must be string`
      )
    })

    it('can update valid content and assign schema at the same time', async () => {
      const stream = await TileDocument.create<any>(ceramic, { a: 1 })
      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)

      await stream.update({ a: 'x' }, { schema: schemaDoc.commitId })

      expect(stream.content).toEqual({ a: 'x' })
    })

    it('can update schema and then assign to stream with now valid content', async () => {
      // Create stream with content that has type 'number'.
      const stream = await TileDocument.create(ceramic, { a: 1 })
      await anchorUpdate(ceramic, stream)

      // Create schema that enforces that the content value is a string, which would reject
      // the stream created above.
      const schemaDoc = await TileDocument.create(ceramic, stringMapSchema)

      // wait for anchor
      await anchorUpdate(ceramic, schemaDoc)
      expect(schemaDoc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Update the schema to expect a number, so now the original stream should conform to the new
      // commit of the schema
      const updatedSchema = cloneDeep(stringMapSchema)
      updatedSchema.additionalProperties.type = 'number'
      await schemaDoc.update(updatedSchema)
      // wait for anchor
      await anchorUpdate(ceramic, schemaDoc)
      expect(schemaDoc.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Test that we can assign the updated schema to the stream without error.
      await stream.update(stream.content, { schema: schemaDoc.commitId })
      await anchorUpdate(ceramic, stream)
      expect(stream.content).toEqual({ a: 1 })

      // Test that we can reload the stream without issue
      const stream2 = await ceramic.loadStream(stream.id)
      expect(stream2.content).toEqual(stream.content)
      expect(stream2.metadata).toEqual(stream.metadata)
    })

    it('can list log commits', async () => {
      const stream = await TileDocument.create(ceramic, { a: 1 })
      const logCommits = await ceramic.loadStreamCommits(stream.id)
      expect(logCommits).toBeDefined()

      const expected = []
      for (const { cid } of stream.state.log) {
        const commit = await ceramic.dispatcher.retrieveCommit(cid)
        expected.push({
          cid: cid.toString(),
          value: await StreamUtils.convertCommitToSignedCommitContainer(commit, ipfs),
        })
      }

      expect(logCommits).toEqual(expected)
    })

    it('can store commit if the size is lesser than the maximum size ~256KB', async () => {
      const streamtype = await TileDocument.create(ceramic, { test: generateStringOfSize(200000) })
      expect(streamtype).not.toBeNull()
    })

    it('cannot store commit if the size is greater than the maximum size ~256KB', async () => {
      await expect(
        TileDocument.create(ceramic, { test: generateStringOfSize(300000) })
      ).rejects.toThrow(/exceeds the maximum block size of/)
    })
  })

  describe('API MultiQueries', () => {
    let ceramic: Ceramic
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
    const MULTIQUERY_TIMEOUT = 7000

    beforeAll(async () => {
      tmpFolder = await tmp.dir({ unsafeCleanup: true })
      ceramic = await createCeramic({
        stateStoreDirectory: tmpFolder.path,
      })

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
      await tmpFolder.cleanup()
    })

    it('can load linked stream path, returns expected form', async () => {
      const streams = await ceramic._loadLinkedStreams(
        { streamId: streamA.id, paths: ['/b/e'] },
        MULTIQUERY_TIMEOUT
      )
      // inlcudes all linked streams in path, including root, key by streamid string
      expect(streams[streamA.id.toString()]).toBeTruthy()
      expect(streams[streamB.id.toString()]).toBeTruthy()
      expect(streams[streamE.id.toString()]).toBeTruthy()
      // maps to content
      expect(streams[streamA.id.toString()].content).toEqual(streamA.content)
      expect(streams[streamB.id.toString()].content).toEqual(streamB.content)
      expect(streams[streamE.id.toString()].content).toEqual(streamE.content)
    })

    it('can load multiple paths', async () => {
      const streams = await ceramic._loadLinkedStreams(
        {
          streamId: streamA.id,
          paths: ['/b/e/f', '/c', '/b/d'],
        },
        MULTIQUERY_TIMEOUT
      )
      expect(Object.keys(streams).length).toEqual(6)
      expect(streams[streamA.id.toString()]).toBeTruthy()
      expect(streams[streamB.id.toString()]).toBeTruthy()
      expect(streams[streamC.id.toString()]).toBeTruthy()
      expect(streams[streamD.id.toString()]).toBeTruthy()
      expect(streams[streamE.id.toString()]).toBeTruthy()
      expect(streams[streamF.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths, including redundant subpaths and paths', async () => {
      const streams = await ceramic._loadLinkedStreams(
        {
          streamId: streamA.id,
          paths: ['/b/e/f', '/c', '/b/d', '/b', 'b/e'],
        },
        MULTIQUERY_TIMEOUT
      )
      expect(Object.keys(streams).length).toEqual(6)
      expect(streams[streamA.id.toString()]).toBeTruthy()
      expect(streams[streamB.id.toString()]).toBeTruthy()
      expect(streams[streamC.id.toString()]).toBeTruthy()
      expect(streams[streamD.id.toString()]).toBeTruthy()
      expect(streams[streamE.id.toString()]).toBeTruthy()
      expect(streams[streamF.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths and ignore paths that dont exist', async () => {
      const streams = await ceramic._loadLinkedStreams(
        {
          streamId: streamA.id,
          paths: ['/b', '/c/g/h', 'c/g/j', '/c/k'],
        },
        MULTIQUERY_TIMEOUT
      )
      expect(Object.keys(streams).length).toEqual(3)
      expect(streams[streamA.id.toString()]).toBeTruthy()
      expect(streams[streamB.id.toString()]).toBeTruthy()
      expect(streams[streamC.id.toString()]).toBeTruthy()
    })

    it('can load multiple paths and ignore invalid paths (ie not streams)', async () => {
      const streams = await ceramic._loadLinkedStreams(
        {
          streamId: streamA.id,
          paths: ['/b', '/b/notDoc', '/notDoc'],
        },
        MULTIQUERY_TIMEOUT
      )
      expect(Object.keys(streams).length).toEqual(2)
      expect(streams[streamA.id.toString()]).toBeTruthy()
      expect(streams[streamB.id.toString()]).toBeTruthy()
    })

    it('can load streams for array of multiqueries', async () => {
      const queries = [
        {
          streamId: streamA.id,
          paths: ['/b'],
        },
        {
          streamId: streamE.id,
          paths: ['/f'],
        },
      ]
      const streams = await ceramic.multiQuery(queries)

      expect(Object.keys(streams).length).toEqual(4)
      expect(streams[streamA.id.toString()]).toBeTruthy()
      expect(streams[streamB.id.toString()]).toBeTruthy()
      expect(streams[streamE.id.toString()]).toBeTruthy()
      expect(streams[streamF.id.toString()]).toBeTruthy()
    })

    it('can load streams for array of overlapping multiqueries', async () => {
      const queries = [
        {
          streamId: streamA.id,
          paths: ['/b', '/c'],
        },
        {
          streamId: streamB.id,
          paths: ['/e/f', '/d'],
        },
      ]
      const streams = await ceramic.multiQuery(queries)
      expect(Object.keys(streams).length).toEqual(6)
    })

    it('can load streams for array of multiqueries even if streamid or path throws error', async () => {
      const queries = [
        {
          streamId: streamA.id,
          paths: ['/b/d', '/notExistStreamId'],
        },
        {
          streamId: notExistStreamId,
          paths: ['/e/f', '/d'],
        },
      ]
      const streams = await ceramic.multiQuery(queries, 1000)
      expect(Object.keys(streams).length).toEqual(3)
    })

    it('can load streams for array of multiqueries including paths that dont exist', async () => {
      const queries = [
        {
          streamId: streamA.id,
          paths: ['/1', '2/3/4', '5/6'],
        },
        {
          streamId: streamE.id,
          paths: ['/1', '2/3/4', '5/6'],
        },
        {
          streamId: streamB.id,
          paths: ['/1', '2/3/4', '5/6'],
        },
      ]
      const streams = await ceramic.multiQuery(queries)

      expect(Object.keys(streams).length).toEqual(3)
      expect(streams[streamA.id.toString()]).toBeTruthy()
      expect(streams[streamB.id.toString()]).toBeTruthy()
      expect(streams[streamE.id.toString()]).toBeTruthy()
    })

    it('loads the same stream at multiple points in time', async () => {
      // test data for the atTime feature
      const delay = () => new Promise((resolve) => setTimeout(resolve, 1000))
      streamFStates.push(streamF.state)
      // timestamp before the first anchor commit
      streamFTimestamps.push(Math.floor(Date.now() / 1000))
      await delay()
      await streamF.update({ ...streamF.content, update: 'new stuff' })
      await anchorUpdate(ceramic, streamF)
      await delay()
      // timestamp between the first and the second anchor commit
      streamFTimestamps.push(Math.floor(Date.now() / 1000))
      streamFStates.push(streamF.state)
      await delay()
      await streamF.update({ ...streamF.content, update: 'newer stuff' })
      await anchorUpdate(ceramic, streamF)
      await delay()
      // timestamp after the second anchor commit
      streamFTimestamps.push(Math.floor(Date.now() / 1000))
      streamFStates.push(streamF.state)

      const queries = [
        {
          streamId: streamF.id,
          atTime: streamFTimestamps[0],
        },
        {
          streamId: streamF.id,
          atTime: streamFTimestamps[1],
        },
        {
          streamId: streamF.id,
          atTime: streamFTimestamps[2],
        },
        {
          streamId: streamF.id,
        },
      ]
      const streams = await ceramic.multiQuery(queries)

      expect(Object.keys(streams).length).toEqual(4)
      const states = Object.values(streams).map((stream) => stream.state)
      // annoying thing, was pending when snapshotted but will
      // obviously not be when loaded at a specific commit
      streamFStates[0].anchorStatus = 0
      expect(states[0]).toEqual(streamFStates[0])
      expect(states[1]).toEqual(streamFStates[1])
      expect(states[2]).toEqual(streamFStates[2])
      expect(states[3]).toEqual(streamF.state)
    }, 60000)
  })
})
