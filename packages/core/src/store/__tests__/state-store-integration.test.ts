import tmp from 'tmp-promise'
import { Document } from "../../document"
import Dispatcher from "../../dispatcher"
import {Doctype, LoggerProvider} from "@ceramicnetwork/common"
import { AnchorService } from "@ceramicnetwork/common"
import { Context } from "@ceramicnetwork/common"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import {TileDoctypeHandler} from '@ceramicnetwork/doctype-tile-handler'
import { PinStore } from "../pin-store";
import { PinStoreFactory } from "../pin-store-factory";
import { DID } from 'dids'
import DocID from "@ceramicnetwork/docid"
import CID from 'cids'

import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import InMemoryAnchorService from "../../anchor/memory/in-memory-anchor-service"

// mock Dispatcher
jest.mock('../../dispatcher', () => {
  const CID = require('cids') // eslint-disable-line @typescript-eslint/no-var-requires
  const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
  const sha256 = require('@stablelib/sha256') // eslint-disable-line @typescript-eslint/no-var-requires
  const { DoctypeUtils } = require('@ceramicnetwork/common') // eslint-disable-line @typescript-eslint/no-var-requires
  const dagCBOR = require('ipld-dag-cbor') // eslint-disable-line @typescript-eslint/no-var-requires
  const u8a = require('uint8arrays') // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => {
    const body = u8a.concat([u8a.fromString('1220', 'base16'), sha256.hash(u8a.fromString(data))])
    return new CID(1, 'sha2-256', body)
  }

  return (gossip: boolean): any => {
    const pinnedDocIds: Record<string, boolean> = {}
    const recs: Record<any, any> = {}
    const docs: Record<string, Document> = {}
    const deepResolve = (cid: CID, remaining: string[]): CID => {
      if (remaining.length > 0) {
        const record = recs[cid.toString()]
        const next = record[remaining[0]] as CID
        return deepResolve(next, remaining.slice(1))
      } else {
        return cid
      }
    }
    return {
      _ipfs: {
        id: (): any => ({ id: 'ipfsid' }), dag: {
          put(rec: any): any {
            // stringify as a way of doing deep copy
            const clone = cloneDeep(rec)
            const cid = hash(JSON.stringify(clone))
            recs[cid.toString()] = clone
            return cid
          },
          get(cid: any): any {
            return {
              value: recs[cid.toString()]
            }
          },
          resolve(query: string) {
            const path = query.split('/')
            const cid = new CID(path[0])
            return deepResolve(cid, path.slice(1))
          }
        },
        pin: {
          add: jest.fn((cid: string) => {
            pinnedDocIds[cid] = true
            return
          }), rm: jest.fn((cid: string) => {
            delete pinnedDocIds[cid]
            return
          }), ls: jest.fn((cid?: string): AsyncIterable<string> => {
            let keys: string[];
            if (cid) {
              keys = pinnedDocIds[cid] ? [cid] : []
            } else {
              keys = Object.keys(pinnedDocIds)
            }
            return {
              [Symbol.asyncIterator](): any {
                let index = 0
                return {
                  next(): any {
                    if (index === keys.length) {
                      return Promise.resolve({ value: null, done: true });
                    }
                    return Promise.resolve({ value: keys[index++], done: false });
                  }
                };
              }
            }
          })
        },
      },
      register: jest.fn((doc) => {
        docs[doc.id] = doc
      }),
      storeCommit: jest.fn(async (rec) => {
        if (DoctypeUtils.isSignedCommitContainer(rec)) {
          const { jws, linkedBlock } = rec
          const block = dagCBOR.util.deserialize(linkedBlock)

          const cidLink = hash(JSON.stringify(block))
          recs[cidLink.toString()] = block

          const clone = cloneDeep(jws)
          clone.link = cidLink
          const cidJws = hash(JSON.stringify(clone))
          recs[cidJws.toString()] = clone
          return cidJws
        }

        // stringify as a way of doing deep copy
        const clone = cloneDeep(rec)
        const cid = hash(JSON.stringify(clone))
        recs[cid.toString()] = clone
        return cid
      }),
      publishTip: jest.fn((id, tip) => {
        if (gossip) {
          docs[id]._handleTip(tip)
        }
      }),
      _requestTip: (id: string): void => {
        if (gossip) {
          docs[id]._publishTip()
        }
      },
      retrieveCommit: jest.fn(cid => {
        return recs[cid.toString()]
      }),
      retrieveFromIPFS: jest.fn((cid, path) => {
        // TODO: this doesn't actually handle path traversal properly
        return recs[cid.toString()]
      }),
      pinnedDocIds,
      recs,
    }
  }
})

const anchorUpdate = (doctype: Doctype): Promise<void> => new Promise(resolve => doctype.on('change', resolve))

describe('Level data store', () => {

  const initialContent = { abc: 123, def: 456 }
  const controllers = ['did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki']

  let store: PinStore
  let dispatcher: Dispatcher
  let doctypeHandler: TileDoctypeHandler
  let anchorService: AnchorService
  let context: Context

  beforeEach(async () => {
    dispatcher = Dispatcher()
    dispatcher.pinnedDocIds = {}
    dispatcher.recs = {}

    dispatcher._ipfs.pin.ls.mockClear()
    dispatcher._ipfs.pin.rm.mockClear()
    dispatcher._ipfs.pin.add.mockClear()

    // TODO: Many of the tests in this file are racy and depend on an anchor not having been
    // performed yet by the time the test checks.  To eliminate this race condition we should set
    // anchorOnRequest to false in the config for the InMemoryAnchorService and anchor manually
    // throughout the tests.
    anchorService = new InMemoryAnchorService({})

    const user: DID = new DID()
    user.createJWS = jest.fn(async () => {
      // fake jws
      return { payload: 'bbbb', signatures: [{ protected: 'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9', signature: 'cccc'}]}
    })
    user._id = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'

    const threeIdResolver = ThreeIdResolver.getResolver({
      loadDocument: (): any => {
        return Promise.resolve({
          content: {
            "publicKeys": {
              "signing": "zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV",
              "encryption": "z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9"
            }
          }
        })
      }
    })

    const api = {getSupportedChains: jest.fn(async () => {return await anchorService.getSupportedChains()})}
    const resolver = new Resolver({ ...threeIdResolver })
    const loggerProvider = new LoggerProvider()
    context = {
      ipfs: dispatcher._ipfs,
      did: user,
      loggerProvider,
      resolver,
      anchorService,
      api,
    }

    anchorService.ceramic = {
      context,
      dispatcher,
    }

    doctypeHandler = new TileDoctypeHandler()
    doctypeHandler.verifyJWS = async (): Promise<void> => { return }

    const levelPath = (await tmp.dir({unsafeCleanup: true})).path
    const storeFactory = new PinStoreFactory(context.ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: 'inmemory',
    })
    store = await storeFactory.createPinStore()
  })

  it('pins document correctly without IPFS pinning', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context)

    await anchorUpdate(doc.doctype)

    let docState = await store.stateStore.load(doc.id)
    expect(docState).toBeNull()

    await store.stateStore.save(doc.doctype)
    expect(dispatcher._ipfs.pin.add).toHaveBeenCalledTimes(0)

    docState = await store.stateStore.load(doc.id)
    expect(docState).toBeDefined()
  })

  it('pins not anchored document correctly with IPFS pinning', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context, {
      anchor: false, publish: false, sync: false,
    })

    let docState = await store.stateStore.load(doc.id)
    expect(docState).toBeNull()

    await store.add(doc.doctype)
    expect(dispatcher._ipfs.pin.add).toHaveBeenCalledTimes(1)

    docState = await store.stateStore.load(doc.id)
    expect(docState).toBeDefined()
  })

  it('pins document correctly with IPFS pinning', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    let docState = await store.stateStore.load(doc.id)
    expect(docState).toBeNull()

    await store.add(doc.doctype)
    expect(dispatcher._ipfs.pin.add).toHaveBeenCalledTimes(4)

    docState = await store.stateStore.load(doc.id)
    expect(docState).toBeDefined()
  })

  it('removes pinned document', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.add(doc.doctype)
    expect(dispatcher._ipfs.pin.add).toHaveBeenCalledTimes(4)

    await store.rm(doc.id)
    expect(dispatcher._ipfs.pin.rm).toHaveBeenCalledTimes(4)
  })

  it('skips removing unpinned document', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.rm(doc.id)
    expect(dispatcher._ipfs.pin.rm).toHaveBeenCalledTimes(0)
  })

  it('lists pinned documents', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.add(doc.doctype)
    expect(dispatcher._ipfs.pin.add).toHaveBeenCalledTimes(4)

    let pinned = []
    let iterator = await store.ls(doc.id)
    for await (const id of iterator) {
      pinned.push(id)
    }
    expect(pinned.length).toEqual(1)
    expect(dispatcher._ipfs.pin.ls).toHaveBeenCalledTimes(0)

    pinned = []
    iterator = await store.ls()
    for await (const id of iterator) {
      pinned.push(id)
    }
  })

  it('lists empty for unpinned document', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    const pinned = []
    const iterator = await store.ls(doc.id)
    for await (const id of iterator) {
      pinned.push(id)
    }
    expect(pinned.length).toEqual(0)
    expect(dispatcher._ipfs.pin.ls).toHaveBeenCalledTimes(0)
  })

  it('pins in different networks', async () => {
    // Create a document to test with
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { controllers, tags: ['3id'] } }, context)
    const genesisCid = await dispatcher.storeCommit(genesis)
    const docId = new DocID('tile', genesisCid)
    const doc = await Document.create(docId, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    const levelPath = (await tmp.dir({unsafeCleanup: true})).path
    const storeFactoryLocal = new PinStoreFactory(context.ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: "local",
    })
    const localStore = await storeFactoryLocal.createPinStore()

    await localStore.stateStore.save(doc.doctype)
    let docState = await localStore.stateStore.load(doc.id)
    expect(docState).toBeDefined()

    await localStore.close()

    // Now create a net pin store for a different ceramic network
    const storeFactoryInMemory = new PinStoreFactory(context.ipfs, {
      stateStoreDirectory: levelPath,
      pinningEndpoints: ['ipfs+context'],
      networkName: "inmemory",
    })
    const inMemoryStore = await storeFactoryInMemory.createPinStore()

    // The new pin store shouldn't be able to see docs that were pinned on the other network
    docState = await inMemoryStore.stateStore.load(doc.id)
    expect(docState).toBeNull()
  })
})
