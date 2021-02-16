import Ceramic from '../ceramic'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import tmp from 'tmp-promise'
import { DoctypeUtils, DocState, Doctype, IpfsApi } from "@ceramicnetwork/common"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import * as u8a from 'uint8arrays'
import DocID from "@ceramicnetwork/docid"
import { createIPFS, swarmConnect } from './ipfs-util';

jest.mock('../store/level-state-store')

const seed = u8a.fromString('6e34b2e1a9624113d81ece8a8a22e6e97f0e145c25c1d4d2d0e62753b4060c83', 'base16')

const expectEqualStates = (state1: DocState, state2: DocState): void => {
  expect(DoctypeUtils.serializeState(state1)).toEqual(DoctypeUtils.serializeState(state2))
}

async function delay(mills: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), mills))
}

const createCeramic = async (ipfs: IpfsApi, anchorOnRequest = false, docCacheLimit = 100, cacheDocumentCommits = true): Promise<Ceramic> => {
  const ceramic = await Ceramic.create(ipfs, {
    stateStoreDirectory: await tmp.tmpName(),
    anchorOnRequest,
    docCacheLimit,
    cacheDocCommits: cacheDocumentCommits,
    restoreDocuments: false,
    pubsubTopic: "/ceramic/inmemory/test" // necessary so Ceramic instances can talk to each other
  })
  const provider = new Ed25519Provider(seed)
  await ceramic.setDIDProvider(provider)

  return ceramic
}

const anchor = async (ceramic: Ceramic): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await ceramic.context.anchorService.anchor()
}

const syncDoc = async (doctype: Doctype): Promise<void> => {
  await new Promise<void>(resolve => {
    doctype.on('change', () => {
      resolve()
    })
  })
}

describe('Ceramic integration', () => {
  jest.setTimeout(60000)
  let ipfs1: IpfsApi;
  let ipfs2: IpfsApi;
  let ipfs3: IpfsApi;

  const DOCTYPE_TILE = 'tile'

  beforeEach(async () => {
    [ipfs1, ipfs2, ipfs3] = await Promise.all(Array.from({length: 3}).map(() => createIPFS()));
  })

  afterEach(async () => {
    await ipfs1.stop(() => console.log('IPFS1 stopped'))
    await ipfs2.stop(() => console.log('IPFS2 stopped'))
    await ipfs3.stop(() => console.log('IPFS3 stopped'))
  })

  it('can create Ceramic instance on default network', async () => {
    const pinsetDirectory = await tmp.tmpName()
    const ceramic = await Ceramic.create(ipfs1, {stateStoreDirectory: pinsetDirectory, restoreDocuments: false})
    await delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('can create Ceramic instance explicitly on inmemory network', async () => {
    const pinsetDirectory = await tmp.tmpName()
    const ceramic = await Ceramic.create(ipfs1, { networkName: 'inmemory', stateStoreDirectory: pinsetDirectory, restoreDocuments: false })
    await delay(1000)
    const supportedChains = await ceramic.getSupportedChains()
    expect(supportedChains).toEqual(['inmemory:12345'])
    await ceramic.close()
  })

  it('cannot create Ceramic instance on network not supported by our anchor service', async () => {
    const pinsetDirectory = await tmp.tmpName()
    await expect(Ceramic.create(ipfs1, { networkName: 'local', stateStoreDirectory: pinsetDirectory, restoreDocuments: false })).rejects.toThrow(
        "No usable chainId for anchoring was found.  The ceramic network 'local' supports the chains: ['eip155:1337'], but the configured anchor service 'inmemory' only supports the chains: ['inmemory:12345']")
    await delay(1000)
  })

  it('cannot create Ceramic instance on invalid network', async () => {
    const pinsetDirectory = await tmp.tmpName()
    await expect(Ceramic.create(ipfs1, { networkName: 'fakenetwork', stateStoreDirectory: pinsetDirectory, restoreDocuments: false })).rejects.toThrow("Unrecognized Ceramic network name: 'fakenetwork'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'")
    await delay(1000)
  })

  it('can propagate update across two connected nodes', async () => {
    await swarmConnect(ipfs2, ipfs1)

    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)
    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 123 } }, { anchor: false, publish: false })
    const doctype2 = await ceramic2.loadDocument(doctype1.id)
    expect(doctype1.content).toEqual(doctype2.content)
    expectEqualStates(doctype1.state, doctype2.state)
    await ceramic1.close()
    await ceramic2.close()
  })

  it('won\'t propagate update across two disconnected nodes', async () => {
    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)

    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 456 }, metadata: { controllers: [controller], tags: ['3id'] } })

    await anchor(ceramic1)

    // we can't load document from id since nodes are not connected
    // so we won't find the genesis object from it's CID
    const doctype2 = await ceramic2.createDocument(DOCTYPE_TILE, { content: { test: 456 }, metadata: { controllers: [controller], tags: ['3id'] } },{ anchor: false, publish: false })
    expect(doctype1.content).toEqual(doctype2.content)
    expect(doctype2.state).toEqual(expect.objectContaining({ content: { test: 456 } }))
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

    const controller = ceramic1.context.did.id
    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 789 }, metadata: { controllers: [controller], tags: ['3id'] } }, { anchor: false, publish: false })
    const doctype3 = await ceramic3.createDocument(DOCTYPE_TILE, { content: { test: 789 }, metadata: { controllers: [controller], tags: ['3id'] } }, { anchor: false, publish: false })
    expect(doctype3.content).toEqual(doctype1.content)
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

    const controller = ceramic1.did.id

    // ceramic node 2 shouldn't need to have the document open in order to forward the message
    const doctype1 = await ceramic1.createDocument<TileDoctype>(DOCTYPE_TILE, {
      content: { test: 321 },
      metadata: { controllers: [controller], tags: ['3id']},
      deterministic: true,
    })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    // Through a different ceramic instance create a new document with the same contents that will
    // therefore resolve to the same genesis record and thus the same docId.  Make sure the new
    // Document object can see the updates made to the first Document object since they represent
    // the same Document in the network.
    const doctype3 = await ceramic3.createDocument<TileDoctype>(DOCTYPE_TILE, {
      content: { test: 321 },
      metadata: { controllers: [controller], tags: ['3id'] },
      deterministic: true,
    }, {
      anchor: false, publish: false, sync: false
    })
    await syncDoc(doctype3) // sync anchor record for genesis

    expect(doctype3.content).toEqual(doctype1.content)

    await doctype1.change({ content: { test: 'abcde' }, metadata: { controllers: [controller] } })

    await anchor(ceramic1)
    await syncDoc(doctype3) // sync signed update record
    await syncDoc(doctype3) // sync anchor record for signed update

    expect(doctype1.content).toEqual({ test: 'abcde' })
    expect(doctype3.content).toEqual(doctype1.content)
    expectEqualStates(doctype3.state, doctype1.state)
    await ceramic1.close()
    await ceramic2.close()
    await ceramic3.close()
  })

  it('can apply existing records successfully', async () => {
    const ceramic1 = await createCeramic(ipfs1)
    const ceramic2 = await createCeramic(ipfs2)

    const controller = ceramic1.context.did.id

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 456 }, metadata: { controllers: [controller], tags: ['3id'] } })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    await doctype1.change({ content: { test: 'abcde' }, metadata: { controllers: [controller] } })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    const logRecords = await ceramic1.loadDocumentRecords(doctype1.id)

    let doctype2 = await ceramic2.createDocumentFromGenesis(DOCTYPE_TILE, logRecords[0].value, { anchor: false, publish: false })
    for (let i = 1; i < logRecords.length; i++) {
      doctype2 = await ceramic2.applyRecord(doctype2.id, logRecords[i].value, { anchor: false, publish: false })
    }

    expect(doctype1.content).toEqual(doctype2.content)
    expectEqualStates(doctype1.state, doctype2.state)

    await ceramic1.close()
    await ceramic2.close()
  })


  it('can evict from doc cache', async () => {
    const ceramic1 = await createCeramic(ipfs1, false, 1)
    const controller = ceramic1.context.did.id

    const docCache1 = ceramic1._docCache
    const putDocToCacheSpy1 = jest.spyOn(docCache1, 'put');
    const getDocFromCacheSpy1 = jest.spyOn(docCache1, 'get');

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 456 }, metadata: { controllers: [controller], tags: ['3id'] } })
    expect(doctype1).toBeDefined()

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(putDocToCacheSpy1).toBeCalledTimes(1)
    expect(getDocFromCacheSpy1).toBeCalledTimes(1)
    expect(docCache1._baseDocCache.has(doctype1.id.baseID.toString())).toBeTruthy()
    expect(docCache1._commitDocCache.has(doctype1.id.toString())).toBeFalsy()

    putDocToCacheSpy1.mockClear()
    getDocFromCacheSpy1.mockClear()

    const doctype2 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 3456789 }, metadata: { controllers: [controller], tags: ['3id'] } })
    expect(doctype2).toBeDefined()

    await anchor(ceramic1)
    await syncDoc(doctype2)

    expect(putDocToCacheSpy1).toBeCalledTimes(1)
    expect(getDocFromCacheSpy1).toBeCalledTimes(1)
    expect(docCache1._baseDocCache.has(doctype1.id.baseID.toString())).toBeFalsy()
    expect(docCache1._baseDocCache.has(doctype2.id.baseID.toString())).toBeTruthy()
    expect(docCache1._commitDocCache.has(doctype1.id.toString())).toBeFalsy()
    expect(docCache1._commitDocCache.has(doctype2.id.toString())).toBeFalsy()

    await ceramic1.close()
  })

  it('can pin/unpin doc to/from cache', async () => {
    const ceramic1 = await createCeramic(ipfs1, false, 1)
    const controller = ceramic1.context.did.id

    const docCache1 = ceramic1._docCache
    const putDocToCacheSpy1 = jest.spyOn(docCache1, 'put');
    const getDocFromCacheSpy1 = jest.spyOn(docCache1, 'get');
    const pinDocToCacheSpy1 = jest.spyOn(docCache1, 'pin');
    const unpinDocToCacheSpy1 = jest.spyOn(docCache1, 'unpin');

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 456 }, metadata: { controllers: [controller], tags: ['3id'] } })
    expect(doctype1).toBeDefined()

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(putDocToCacheSpy1).toBeCalledTimes(1)
    expect(getDocFromCacheSpy1).toBeCalledTimes(1)
    expect(docCache1._baseDocCache.has(doctype1.id.baseID.toString())).toBeTruthy()
    expect(docCache1._commitDocCache.has(doctype1.id.toString())).toBeFalsy()

    putDocToCacheSpy1.mockClear()
    getDocFromCacheSpy1.mockClear()

    await ceramic1.pin.add(doctype1.id)

    expect(putDocToCacheSpy1).toBeCalledTimes(0)
    expect(getDocFromCacheSpy1).toBeCalledTimes(1)
    expect(pinDocToCacheSpy1).toBeCalledTimes(1)
    expect(unpinDocToCacheSpy1).toBeCalledTimes(0)
    expect(docCache1._pinnedDocCache[doctype1.id.baseID.toString()]).toBeDefined()
    expect(docCache1._baseDocCache.has(doctype1.id.baseID.toString())).toBeFalsy()
    expect(docCache1._commitDocCache.has(doctype1.id.toString())).toBeFalsy()

    putDocToCacheSpy1.mockClear()
    getDocFromCacheSpy1.mockClear()
    pinDocToCacheSpy1.mockClear()
    unpinDocToCacheSpy1.mockClear()

    await ceramic1.pin.rm(doctype1.id)

    expect(putDocToCacheSpy1).toBeCalledTimes(1)
    expect(getDocFromCacheSpy1).toBeCalledTimes(0)
    expect(pinDocToCacheSpy1).toBeCalledTimes(0)
    expect(unpinDocToCacheSpy1).toBeCalledTimes(1)
    expect(docCache1._pinnedDocCache[doctype1.id.baseID.toString()]).toBeUndefined()
    expect(docCache1._baseDocCache.has(doctype1.id.baseID.toString())).toBeTruthy()
    expect(docCache1._commitDocCache.has(doctype1.id.toString())).toBeFalsy()

    await ceramic1.close()
  })

  it('can utilize doc commit cache', async () => {
    const ceramic1 = await createCeramic(ipfs1, false, 2)
    const ceramic2 = await createCeramic(ipfs2, false, 1)
    const controller = ceramic1.context.did.id

    const docCache1 = ceramic1._docCache
    const putDocToCacheSpy1 = jest.spyOn(docCache1, 'put');
    const getDocFromCacheSpy1 = jest.spyOn(docCache1, 'get');

    const docCache2 = ceramic2._docCache
    const putDocToCacheSpy2 = jest.spyOn(docCache2, 'put');
    const getDocFromCacheSpy2 = jest.spyOn(docCache2, 'get');

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 456 }, metadata: { controllers: [controller], tags: ['3id'] } })
    expect(doctype1).toBeDefined()

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(putDocToCacheSpy1).toBeCalledTimes(1)
    expect(getDocFromCacheSpy1).toBeCalledTimes(1)
    expect(docCache1._baseDocCache.has(doctype1.id.baseID.toString())).toBeTruthy()
    expect(docCache1._commitDocCache.has(doctype1.id.toString())).toBeFalsy()

    putDocToCacheSpy1.mockClear()
    getDocFromCacheSpy1.mockClear()

    await doctype1.change({ content: { test: 'abcde' }, metadata: { controllers: [controller] } })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    const prevCommitDocId1 = DocID.fromOther(doctype1.id, doctype1.state.log[3].cid.toString())

    const loadedDoctype1 = await ceramic2.loadDocument(prevCommitDocId1)
    expect(loadedDoctype1).toBeDefined()

    expect(getDocFromCacheSpy2).toBeCalledTimes(2)
    expect(putDocToCacheSpy2).toBeCalledTimes(2)
    expect(docCache2._baseDocCache.has(prevCommitDocId1.baseID.toString())).toBeTruthy()
    expect(docCache2._commitDocCache.has(prevCommitDocId1.toString())).toBeTruthy()

    await ceramic1.close()
    await ceramic2.close()
  })

  it('cannot utilize disabled doc commit cache', async () => {
    const ceramic1 = await createCeramic(ipfs1, false, 2)
    const ceramic2 = await createCeramic(ipfs2, false, 1, false)
    const controller = ceramic1.context.did.id

    const docCache1 = ceramic1._docCache
    const putDocToCacheSpy1 = jest.spyOn(docCache1, 'put');
    const getDocFromCacheSpy1 = jest.spyOn(docCache1, 'get');

    const docCache2 = ceramic2._docCache
    const putDocToCacheSpy2 = jest.spyOn(docCache2, 'put');
    const getDocFromCacheSpy2 = jest.spyOn(docCache2, 'get');

    const doctype1 = await ceramic1.createDocument(DOCTYPE_TILE, { content: { test: 456 }, metadata: { controllers: [controller], tags: ['3id'] } })
    expect(doctype1).toBeDefined()

    await anchor(ceramic1)
    await syncDoc(doctype1)

    expect(putDocToCacheSpy1).toBeCalledTimes(1)
    expect(getDocFromCacheSpy1).toBeCalledTimes(1)
    expect(docCache1._baseDocCache.has(doctype1.id.baseID.toString())).toBeTruthy()
    expect(docCache1._commitDocCache.has(doctype1.id.toString())).toBeFalsy()

    putDocToCacheSpy1.mockClear()
    getDocFromCacheSpy1.mockClear()

    await doctype1.change({ content: { test: 'abcde' }, metadata: { controllers: [controller] } })

    await anchor(ceramic1)
    await syncDoc(doctype1)

    const prevCommitDocId1 = DocID.fromOther(doctype1.id, doctype1.state.log[3].cid.toString())

    const loadedDoctype1 = await ceramic2.loadDocument(prevCommitDocId1)
    expect(loadedDoctype1).toBeDefined()

    expect(getDocFromCacheSpy2).toBeCalledTimes(2)
    expect(putDocToCacheSpy2).toBeCalledTimes(2)
    expect(docCache2._baseDocCache.has(prevCommitDocId1.baseID.toString())).toBeTruthy()
    expect(docCache2._commitDocCache).toBeNull()

    await ceramic1.close()
    await ceramic2.close()
  })

  it('validates schema on doc change', async () => {
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
    const noteSchema = await ceramic.createDocument('tile', {
      content: NoteSchema,
      metadata: { controllers: [ceramic.did.id] },
    })

    const doc = await ceramic.createDocument('tile', {
      content: { date: '2021-01-06T14:28:00.000Z', text: 'hello first' },
      metadata: { controllers: [ceramic.did.id], schema: noteSchema.commitId.toUrl() },
    })
    await expect(doc.change({ content: { date: 'invalid-date' } })).rejects.toThrow()
  })

})
