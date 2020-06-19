import CID from "cids"
import * as os from "os"
import * as path from "path"
import { promises as fsPromises } from "fs";

import LevelStateStore from "../level-state-store"

let pinnedDocIds: Record<string, boolean> = {}

const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))

const recs: Record<string, any> = {}

// mock IPFS
const ipfs = {
    id: (): any => ({ id: 'ipfsid' }),
    dag: {
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
  const CID = require("cids") // eslint-disable-line @typescript-eslint/no-var-requires
  const cloneDeep = require("lodash.clonedeep") // eslint-disable-line @typescript-eslint/no-var-requires
  const { sha256 } = require("js-sha256") // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))
  return (): any => {
    const recs: Record<string, any> = {}
    return {
      _ipfs: {
        dag: {
          put(rec: any): any {
            // stringify as a way of doing deep copy
            const clone = cloneDeep(rec)
            const cid = hash(JSON.stringify(clone))
            recs[cid.toString()] = clone
            return cid
          },
          get(cid: any): any {
            return recs[cid.toString()]
          }
        }
      },
      register: jest.fn(),
      on: jest.fn(),
      storeRecord: jest.fn((rec) => {
        const clone = cloneDeep(rec)
        const cid = hash(JSON.stringify(clone))
        recs[cid.toString()] = clone
        return cid
      }),
      publishHead: jest.fn(),
      _requestHead: jest.fn(),
      retrieveRecord: jest.fn(cid => {
        return recs[cid.toString()]
      }),
    }
  }
})

import Document from "../../document"
import Dispatcher from "../../dispatcher"
import MockAnchorService from "../../anchor/mock/mock-anchor-service"

jest.mock("../../user")

import User from "../../user"
import AnchorService from "../../anchor/anchor-service"
import ThreeIdDoctypeHandler from "../../doctype/three-id/three-id-doctype-handler"
import { Context } from "../../context"
import { ThreeIdDoctype } from "../../doctype/three-id/three-id-doctype"
import { Doctype, DoctypeHandler } from "../../doctype"

jest.mock("did-jwt", () => ({
  verifyJWT: (): any => 'verified'
}))

const anchorUpdate = (doctype: Doctype): Promise<void> => new Promise(resolve => doctype.on('change', resolve))

describe('Level data store', () => {

  const initialContent = { abc: 123, def: 456 }
  const owners = ['publickeymock']

  let store: LevelStateStore
  let dispatcher: Dispatcher
  let doctypeHandler: ThreeIdDoctypeHandler
  let anchorService: AnchorService
  let context: Context

  beforeEach(async () => {
    pinnedDocIds = {}

    ipfs.pin.ls.mockClear()
    ipfs.pin.rm.mockClear()
    ipfs.pin.add.mockClear()

    const storeDirPath = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'store-'))

    dispatcher = Dispatcher()
    anchorService = new MockAnchorService(dispatcher)

    const user: User = new User(null)
    user.sign = jest.fn(async () => 'aaaa.bbbb.cccc')

    context = {
      ipfs,
      user,
      anchorService,
    }

    doctypeHandler = new ThreeIdDoctypeHandler()

    store = new LevelStateStore(ipfs, dispatcher, storeDirPath)
    await store.open()
  })

  it('pins document correctly without IPFS pinning', async () => {
    const genesis = await ThreeIdDoctype.makeGenesis({ content: initialContent, owners })
    const findHandler = (): DoctypeHandler<ThreeIdDoctype> => doctypeHandler
    const doc = await Document.createFromGenesis(genesis, findHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    let docState = await store.loadState(doc.id)
    expect(docState).toBeNull()

    await store.pin(doc, false)
    expect(ipfs.pin.add).toHaveBeenCalledTimes(0)

    docState = await store.loadState(doc.id)
    expect(docState).toBeDefined()
  })

  it('pins not anchored document correctly with IPFS pinning', async () => {
    const genesis = await ThreeIdDoctype.makeGenesis({ content: initialContent, owners })
    const findHandler = (): DoctypeHandler<ThreeIdDoctype> => doctypeHandler
    const doc = await Document.createFromGenesis(genesis, findHandler, dispatcher, store, context, {
      onlyGenesis: true, skipWait: true,
    })

    let docState = await store.loadState(doc.id)
    expect(docState).toBeNull()

    await store.pin(doc, true)
    expect(ipfs.pin.add).toHaveBeenCalledTimes(1)

    docState = await store.loadState(doc.id)
    expect(docState).toBeDefined()
  })

  it('pins document correctly with IPFS pinning', async () => {
    const genesis = await ThreeIdDoctype.makeGenesis({ content: initialContent, owners })
    const findHandler = (): DoctypeHandler<ThreeIdDoctype> => doctypeHandler
    const doc = await Document.createFromGenesis(genesis, findHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    let docState = await store.loadState(doc.id)
    expect(docState).toBeNull()

    await store.pin(doc, true)
    expect(ipfs.pin.add).toHaveBeenCalledTimes(4)

    docState = await store.loadState(doc.id)
    expect(docState).toBeDefined()
  })

  it('removes pinned document', async () => {
    const genesis = await ThreeIdDoctype.makeGenesis({ content: initialContent, owners })
    const findHandler = (): DoctypeHandler<ThreeIdDoctype> => doctypeHandler
    const doc = await Document.createFromGenesis(genesis, findHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.pin(doc, true)
    expect(ipfs.pin.add).toHaveBeenCalledTimes(4)

    await store.rm(doc.id)
    expect(ipfs.pin.rm).toHaveBeenCalledTimes(4)
  })

  it('skips removing unpinned document', async () => {
    const genesis = await ThreeIdDoctype.makeGenesis({ content: initialContent, owners })
    const findHandler = (): DoctypeHandler<ThreeIdDoctype> => doctypeHandler
    const doc = await Document.createFromGenesis(genesis, findHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.rm(doc.id)
    expect(ipfs.pin.rm).toHaveBeenCalledTimes(0)
  })

  it('lists pinned documents', async () => {
    const genesis = await ThreeIdDoctype.makeGenesis({ content: initialContent, owners })
    const findHandler = (): DoctypeHandler<ThreeIdDoctype> => doctypeHandler
    const doc = await Document.createFromGenesis(genesis, findHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    await store.pin(doc, true)
    expect(ipfs.pin.add).toHaveBeenCalledTimes(4)

    let pinned = []
    let iterator = await store.ls(doc.id)
    for await (const id of iterator) {
      pinned.push(id)
    }
    expect(pinned.length).toEqual(1)
    expect(ipfs.pin.ls).toHaveBeenCalledTimes(0)

    pinned = []
    iterator = await store.ls()
    for await (const id of iterator) {
      pinned.push(id)
    }
  })

  it('lists empty for unpinned document', async () => {
    const genesis = await ThreeIdDoctype.makeGenesis({ content: initialContent, owners })
    const findHandler = (): DoctypeHandler<ThreeIdDoctype> => doctypeHandler
    const doc = await Document.createFromGenesis(genesis, findHandler, dispatcher, store, context)
    await anchorUpdate(doc.doctype)

    const pinned = []
    const iterator = await store.ls(doc.id)
    for await (const id of iterator) {
      pinned.push(id)
    }
    expect(pinned.length).toEqual(0)
    expect(ipfs.pin.ls).toHaveBeenCalledTimes(0)
  })
})
