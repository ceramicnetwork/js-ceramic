import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import { StreamUtils, IpfsApi, TestUtils, StreamState } from '@ceramicnetwork/common';
import { TileDocument } from "@ceramicnetwork/stream-tile"
import * as u8a from 'uint8arrays'
import { createIPFS, swarmConnect } from './ipfs-util';
import InMemoryAnchorService from "../anchor/memory/in-memory-anchor-service";
import { anchorUpdate } from '../state-management/__tests__/anchor-update';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"
import { DID } from 'dids'

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

async function delay(mills: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), mills))
}

const makeDID = function(seed: Uint8Array, ceramic: Ceramic): DID {
  const provider = new Ed25519Provider(seed)

  const keyDidResolver = KeyDidResolver.getResolver()
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
  const resolver = new Resolver({
    ...threeIdResolver, ...keyDidResolver,
  })
  return new DID({ provider, resolver })
}

const createCeramic = async (ipfs: IpfsApi, anchorOnRequest = false, streamCacheLimit = 100): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStoreDirectory: await tmp.tmpName(),
    anchorOnRequest,
    streamCacheLimit,
    restoreStreams: false,
    pubsubTopic: "/ceramic/inmemory/test" // necessary so Ceramic instances can talk to each other
  })
  const did = makeDID(seed, ceramic)
  await ceramic.setDID(did)
  await did.authenticate();

  return ceramic
}

function expectEqualStates(a: StreamState, b: StreamState) {
  expect(StreamUtils.serializeState(a)).toEqual(StreamUtils.serializeState(b))
}

describe('Ceramic integration', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi;
  let ipfs2: IpfsApi;
  let ipfs3: IpfsApi;

  beforeEach(async () => {
    [ipfs1, ipfs2, ipfs3] = await Promise.all(Array.from({length: 3}).map(() => createIPFS()));
  })

  afterEach(async () => {
    await ipfs1.stop()
    await ipfs2.stop()
    await ipfs3.stop()
  })

  it('can create Ceramic instance on default network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    const ceramic = await Ceramic.create(ipfs1, {stateStoreDirectory, restoreStreams: false})
    await delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('can create Ceramic instance explicitly on inmemory network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    const ceramic = await Ceramic.create(ipfs1, { networkName: 'inmemory', stateStoreDirectory, restoreStreams: false })
    await delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('cannot create Ceramic instance on network not supported by our anchor service', async () => {
    await expect(Ceramic._loadSupportedChains("local", new InMemoryAnchorService({}))).rejects.toThrow(
        "No usable chainId for anchoring was found.  The ceramic network 'local' supports the chains: ['eip155:1337'], but the configured anchor service '<inmemory>' only supports the chains: ['inmemory:12345']")
    await delay(1000)
  })

  it('cannot create Ceramic instance on invalid network', async () => {
    const stateStoreDirectory = await tmp.tmpName()
    await expect(Ceramic.create(ipfs1, { networkName: 'fakenetwork', stateStoreDirectory, restoreStreams: false })).rejects.toThrow("Unrecognized Ceramic network name: 'fakenetwork'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'")
    await delay(1000)
  })

  it('can propagate update across two connected nodes', async () => {
    await swarmConnect(ipfs2, ipfs1)

    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const stream1 = await TileDocument.create(ceramic1, {test: 123}, null, { anchor: false, publish: false })
    const stream2 = await TileDocument.load(ceramic2, stream1.id)
    expect(stream1.content).toEqual(stream2.content)
    expectEqualStates(stream1.state, stream2.state)
    await ceramic1.close()
    await ceramic2.close()
  })

  it('won\'t propagate update across two disconnected nodes', async () => {
    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)

    const stream1 = await TileDocument.create(ceramic1, {test: 456})

    await anchorUpdate(ceramic1, stream1)

    // we can't load stream from id since nodes are not connected
    // so we won't find the genesis object from it's CID
    const stream2 = await TileDocument.create(ceramic2, {test: 456}, null, { anchor: false, publish: false })
    expect(stream1.content).toEqual(stream2.content)
    expect(stream2.state).toEqual(expect.objectContaining({ content: { test: 456 } }))
    await ceramic1.close()
    await ceramic2.close()
  })

  it('can propagate update across nodes with common connection', async () => {
    // ipfs1 <-> ipfs2 <-> ipfs3
    // ipfs1 <!-> ipfs3
    await swarmConnect(ipfs1, ipfs2)
    await swarmConnect(ipfs2, ipfs3)

    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const ceramic3 = await createCeramic(ipfs3)

    // ceramic node 2 shouldn't need to have the stream open in order to forward the message
    const stream1 = await TileDocument.create(ceramic1, {test: 789}, null, { anchor: false, publish: false })
    const stream3 = await TileDocument.create(ceramic3, {test: 789}, null, { anchor: false, publish: false })
    expect(stream3.content).toEqual(stream1.content)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })

  it('can propagate multiple update across nodes with common connection', async () => {
    // ipfs1 <-> ipfs2 <-> ipfs3
    // ipfs1 <!-> ipfs3
    await swarmConnect(ipfs1, ipfs2)
    await swarmConnect(ipfs2, ipfs3)

    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const ceramic3 = await createCeramic(ipfs3)

    const metadata = { deterministic: true, controllers: [ceramic1.did.id], family: "family", tags: ["x", "y"] }

    // ceramic node 2 shouldn't need to have the stream open in order to forward the message
    const stream1 = await TileDocument.create(ceramic1, null, metadata)
    await stream1.update({ test: 321 })

    await anchorUpdate(ceramic1, stream1)

    // Through a different ceramic instance create a new stream with the same contents that will
    // therefore resolve to the same genesis record and thus the same streamId.  Make sure the new
    // Document object can see the updates made to the first Document object since they represent
    // the same Document in the network.
    const stream3 = await TileDocument.create(ceramic3, null, metadata)

    expect(stream3.content).toEqual(stream1.content)

    await stream1.update({ test: 'abcde' })

    await anchorUpdate(ceramic1, stream1)

    expect(stream1.content).toEqual({ test: 'abcde' })
    await TestUtils.waitForState(stream3, 2000, state => StreamUtils.statesEqual(state, stream1.state), () => {
      throw new Error(`streamtype3.state should equal streamtype1.state`)
    })

    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })

  it('can apply existing records successfully', async () => {
    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)

    const stream1 = await TileDocument.create(ceramic1, { test: 456 })

    await anchorUpdate(ceramic1, stream1)

    await stream1.update({ test: 'abcde' })

    await anchorUpdate(ceramic1, stream1)

    const logCommits = await ceramic1.loadStreamCommits(stream1.id)

    let stream2 = await TileDocument.createFromGenesis(ceramic2, logCommits[0].value, { anchor: false, publish: false })
    for (let i = 1; i < logCommits.length; i++) {
      stream2 = await ceramic2.applyCommit(stream2.id, logCommits[i].value, { anchor: false, publish: false })
    }

    expect(stream1.content).toEqual(stream2.content)
    expectEqualStates(stream1.state, stream2.state);

    await ceramic1.close()
    await ceramic2.close()
  })

  it('can utilize stream commit cache', async () => {
    await swarmConnect(ipfs1, ipfs2)
    const ceramic1 = await createCeramic(ipfs1, false, 2)
    const ceramic2 = await createCeramic(ipfs2, false, 1)

    const repository1 = ceramic1.repository
    const addSpy1 = jest.spyOn(repository1, 'add');
    const loadSpy1 = jest.spyOn(repository1, 'load');

    const repository2 = ceramic2.repository
    const addSpy2 = jest.spyOn(repository2, 'add');
    const loadSpy2 = jest.spyOn(repository2, 'load');

    const stream1 = await TileDocument.create(ceramic1, { test: 456 }, null, { publish: false })
    expect(stream1).toBeDefined()

    await anchorUpdate(ceramic1, stream1)

    expect(addSpy1).toBeCalledTimes(1)
    expect(loadSpy1).toBeCalledTimes(1)

    addSpy1.mockClear()
    loadSpy1.mockClear()

    await stream1.update({ test: 'abcde' }, null, { publish: false })

    await anchorUpdate(ceramic1, stream1)

    const prevCommitStreamId1 = stream1.id.atCommit(stream1.state.log[3].cid)
    expect(addSpy2).not.toBeCalled()
    const loadedDoc1 = await ceramic2.loadStream(prevCommitStreamId1)
    expect(loadedDoc1).toBeDefined()

    expect(loadSpy2).toBeCalled()
    expect(addSpy2).toBeCalledTimes(1)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('cannot utilize disabled stream commit cache', async () => {
    await swarmConnect(ipfs1, ipfs2)
    const ceramic1 = await createCeramic(ipfs1, false, 2)
    const ceramic2 = await createCeramic(ipfs2, false, 1)

    const repository1 = ceramic1.repository
    const addSpy1 = jest.spyOn(repository1, 'add');
    const loadSpy1 = jest.spyOn(repository1, 'load');

    const repository2 = ceramic2.repository
    const addSpy2 = jest.spyOn(repository2, 'add');
    const loadSpy2 = jest.spyOn(repository2, 'load');

    const stream1 = await TileDocument.create(ceramic1, { test: 456 })
    expect(loadSpy1).toBeCalledTimes(1)
    expect(addSpy1).toBeCalledTimes(1)
    expect(stream1).toBeDefined()

    await anchorUpdate(ceramic1, stream1)

    addSpy1.mockClear()
    loadSpy1.mockClear()

    await stream1.update({ test: 'abcde' })
    expect(loadSpy1).toBeCalledTimes(1)
    expect(addSpy1).toBeCalledTimes(0)

    await anchorUpdate(ceramic1, stream1)

    const prevCommitStreamId1 = stream1.id.atCommit(stream1.state.log[3].cid)
    expect(addSpy2).not.toBeCalled()
    const stream2 = await ceramic2.loadStream(prevCommitStreamId1)
    expect(stream2).toBeDefined()

    expect(loadSpy2).toBeCalled()
    expect(addSpy2).toBeCalledTimes(1)

    await ceramic1.close()
    await ceramic2.close()
  })

  it("Loading stream at commit doesn't prevent loading current tip", async () => {
    await swarmConnect(ipfs1, ipfs2)
    const ceramic1 = await createCeramic(ipfs1, false)
    const ceramic2 = await createCeramic(ipfs2, false)

    const content0 = { foo: 0 }
    const content1 = { foo: 1 }
    const content2 = { foo: 2 }

    const stream1 = await TileDocument.create(ceramic1, content0, null, { anchor: false })
    await stream1.update(content1, null, { anchor: false })
    await stream1.update(content2, null, { anchor: false })

    const middleCommitId = stream1.id.atCommit(stream1.state.log[1].cid)

    // Now load the stream into the cache on second node at a commit ID that is not the most recent.
    const stream2AtCommit = await ceramic2.loadStream<TileDocument>(middleCommitId)
    // Now load current version and make sure the fact that older version is in the cache doesn't
    // prevent getting current version
    const stream2Current = await ceramic2.loadStream<TileDocument>(stream1.id)
    expect(stream2AtCommit.content).toEqual(content1)
    expect(stream2Current.content).toEqual(content2)

    await ceramic1.close()
    await ceramic2.close()
  })

  it('validates schema on stream change', async () => {
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

    const stream = await TileDocument.create(ceramic,
        { date: '2021-01-06T14:28:00.000Z', text: 'hello first' },
        { schema: noteSchema.commitId.toUrl()})

    await expect(stream.update({ date: 'invalid-date' })).rejects.toThrow()
    await ceramic.close();
  })

})
