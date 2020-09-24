import CID from "cids"
import tmp from 'tmp-promise'
import Document from "../../document"
import Dispatcher from "../../dispatcher"
import MockAnchorService from "../../anchor/mock/mock-anchor-service"
import { Doctype } from "@ceramicnetwork/ceramic-common"
import { AnchorService } from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"
import { TileDoctype, TileDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-tile"
import {PinStore} from "../pin-store";
import {PinStoreFactory} from "../pin-store-factory";
import { DID } from 'dids'

const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))

let pinnedDocIds: Record<string, boolean> = {}
let mockRecs: Record<string, any> = {}

function deepResolve(cid: CID, remaining: string[]): CID {
  if (remaining.length > 0) {
    const record = mockRecs[cid.toString()]
    const next = record[remaining[0]] as CID
    return deepResolve(next, remaining.slice(1))
  } else {
    return cid
  }
}

// mock IPFS
const mockIpfs = {
    id: (): any => ({ id: 'ipfsid' }),
    dag: {
      put(rec: any): any {
        // stringify as a way of doing deep copy
        const clone = cloneDeep(rec)
        const cid = hash(JSON.stringify(clone))
        mockRecs[cid.toString()] = clone
        return cid
      },
      get(cid: any): any {
        return {
          value: mockRecs[cid.toString()]
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
      }),
      rm: jest.fn( (cid: string) => {
        delete pinnedDocIds[cid]
        return
      }),
      ls: jest.fn( (cid?: string): AsyncIterable<string> => {
        let keys: string[];
        if (cid) {
          keys = pinnedDocIds[cid]? [cid] : []
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
}

// mock Dispatcher
jest.mock("../../dispatcher", () => {
  return (): any => {
    return {
      _ipfs: mockIpfs,
      register: jest.fn(),
      on: jest.fn(),
      storeRecord: jest.fn((rec) => {
        return mockIpfs.dag.put(rec)
      }),
      publishHead: jest.fn(),
      _requestHead: jest.fn(),
      retrieveRecord: jest.fn(async cid => {
        const blob = await mockIpfs.dag.get(cid)
        return blob?.value
      }),
    }
  }
})

const anchorUpdate = (doctype: Doctype): Promise<void> => new Promise(resolve => doctype.on('change', resolve))

describe('Level data store', () => {

  const initialContent = { abc: 123, def: 456 }
  const owners = ['publickeymock']

  let store: PinStore
  let dispatcher: Dispatcher
  let doctypeHandler: TileDoctypeHandler
  let anchorService: AnchorService
  let context: Context

  beforeEach(async () => {
    pinnedDocIds = {}

    mockIpfs.pin.ls.mockClear()
    mockIpfs.pin.rm.mockClear()
    mockIpfs.pin.add.mockClear()

    mockRecs = {}

    dispatcher = Dispatcher()
    anchorService = new MockAnchorService(dispatcher)

    const user: DID = new DID()
    user.createJWS = jest.fn(async () => {
      // fake jws
      return 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ.bbbb.cccc'
    })
    user._did = 'did:3:bafyuser'

    context = {
      ipfs: mockIpfs,
      user,
      anchorService,
    }

    doctypeHandler = new TileDoctypeHandler()
    doctypeHandler.verifyJWT = async (): Promise<void> => { return }

    const levelPath = await tmp.tmpName()
    const storeFactory = new PinStoreFactory(context, levelPath, ['ipfs+context'])
    store = await storeFactory.open()
  })

  it('pins document correctly without IPFS pinning', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { owners, tags: ['3id'] } })
    const genesisCid = await dispatcher.storeRecord(genesis)
    const doc = await Document.create(genesisCid, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    let docState = await store.stateStore.load(doc.id)
    expect(docState).toBeNull()

    await store.stateStore.save(doc.doctype)
    expect(mockIpfs.pin.add).toHaveBeenCalledTimes(0)

    docState = await store.stateStore.load(doc.id)
    expect(docState).toBeDefined()
  })

  it('pins not anchored document correctly with IPFS pinning', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { owners, tags: ['3id'] } })
    const genesisCid = await dispatcher.storeRecord(genesis)
    const doc = await Document.create(genesisCid, doctypeHandler, dispatcher, store, context, {
      applyOnly: true, skipWait: true,
    })

    let docState = await store.stateStore.load(doc.id)
    expect(docState).toBeNull()

    await store.add(doc.doctype)
    expect(mockIpfs.pin.add).toHaveBeenCalledTimes(1)

    docState = await store.stateStore.load(doc.id)
    expect(docState).toBeDefined()
  })

  it('pins document correctly with IPFS pinning', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { owners, tags: ['3id'] } })
    const genesisCid = await dispatcher.storeRecord(genesis)
    const doc = await Document.create(genesisCid, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    let docState = await store.stateStore.load(doc.id)
    expect(docState).toBeNull()

    await store.add(doc.doctype)
    expect(mockIpfs.pin.add).toHaveBeenCalledTimes(4)

    docState = await store.stateStore.load(doc.id)
    expect(docState).toBeDefined()
  })

  it('removes pinned document', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { owners, tags: ['3id'] } })
    const genesisCid = await dispatcher.storeRecord(genesis)
    const doc = await Document.create(genesisCid, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.add(doc.doctype)
    expect(mockIpfs.pin.add).toHaveBeenCalledTimes(4)

    await store.rm(doc.id)
    expect(mockIpfs.pin.rm).toHaveBeenCalledTimes(4)
  })

  it('skips removing unpinned document', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { owners, tags: ['3id'] } })
    const genesisCid = await dispatcher.storeRecord(genesis)
    const doc = await Document.create(genesisCid, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.rm(doc.id)
    expect(mockIpfs.pin.rm).toHaveBeenCalledTimes(0)
  })

  it('lists pinned documents', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { owners, tags: ['3id'] } })
    const genesisCid = await dispatcher.storeRecord(genesis)
    const doc = await Document.create(genesisCid, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.add(doc.doctype)
    expect(mockIpfs.pin.add).toHaveBeenCalledTimes(4)

    let pinned = []
    let iterator = await store.ls(doc.id)
    for await (const id of iterator) {
      pinned.push(id)
    }
    expect(pinned.length).toEqual(1)
    expect(mockIpfs.pin.ls).toHaveBeenCalledTimes(0)

    pinned = []
    iterator = await store.ls()
    for await (const id of iterator) {
      pinned.push(id)
    }
  })

  it('lists empty for unpinned document', async () => {
    const genesis = await TileDoctype.makeGenesis({ content: initialContent, metadata: { owners, tags: ['3id'] } })
    const genesisCid = await dispatcher.storeRecord(genesis)
    const doc = await Document.create(genesisCid, doctypeHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    const pinned = []
    const iterator = await store.ls(doc.id)
    for await (const id of iterator) {
      pinned.push(id)
    }
    expect(pinned.length).toEqual(0)
    expect(mockIpfs.pin.ls).toHaveBeenCalledTimes(0)
  })
})
