import CID from 'cids'
import Document from '../document'
import MockAnchorService from "../anchor/mock/mock-anchor-service";
import tmp from 'tmp-promise'
import Dispatcher from '../dispatcher'
import Ceramic from "../ceramic"
import { Context } from "@ceramicnetwork/ceramic-common"
import { AnchorStatus, DocOpts, SignatureStatus } from "@ceramicnetwork/ceramic-common"
import { AnchorService } from "@ceramicnetwork/ceramic-common"
import { TileDoctype, TileParams, TileDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-tile"
import {PinStore} from "../store/pin-store";
import {LevelStateStore} from "../store/level-state-store";
import {Pinning} from "../pinning/pinning";
import { DID } from "dids"

import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

jest.mock('../store/level-state-store')

jest.mock('../dispatcher', () => {
  const CID = require('cids') // eslint-disable-line @typescript-eslint/no-var-requires
  const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
  const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
  const { DoctypeUtils } = require('@ceramicnetwork/ceramic-common') // eslint-disable-line @typescript-eslint/no-var-requires
  const dagCBOR = require('ipld-dag-cbor') // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))
  return (gossip: boolean): any => {
    const recs: Record<any, any> = {}
    const docs: Record<string, Document> = {}
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
            return {
              value: recs[cid.toString()]
            }
          }
        }
      },
      register: jest.fn((doc) => {
        docs[doc.id] = doc
      }),
      storeRecord: jest.fn(async (rec) => {
        if (DoctypeUtils.isSignedRecordDTO(rec)) {
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
      publishHead: jest.fn((id, head) => {
        if (gossip) {
          docs[id]._handleHead(head)
        }
      }),
      _requestHead: (id: string): void => {
        if (gossip) {
          docs[id]._publishHead()
        }
      },
      retrieveRecord: jest.fn(cid => {
        return recs[cid.toString()]
      }),
      retrieveRecordByPath: jest.fn((cid) => {
        const rootCid = recs[cid.toString()].root
        return recs[rootCid.toString()]
      })
    }
  }
})

const anchorUpdate = (doc: Document): Promise<void> => new Promise(resolve => doc.doctype.on('change', resolve))

const create = async (params: TileParams, ceramic: Ceramic, context: Context, opts: DocOpts = {}): Promise<Document> => {
  const { content, metadata } = params
  if (!metadata?.owners) {
    throw new Error('The owner of the 3ID needs to be specified')
  }

  const record = await TileDoctype.makeGenesis({ content, metadata }, context)
  return await ceramic._createDocFromGenesis(record, opts)
}

let stateStore: LevelStateStore
let pinStore: PinStore
let pinning: Pinning

beforeEach(async () => {
  const levelPath = await tmp.tmpName()
  stateStore = new LevelStateStore(levelPath)
  pinning = {
    open: jest.fn(),
    close: jest.fn(),
    pin: jest.fn(),
    unpin: jest.fn()
  }
  pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn())
  await pinStore.open()
})

describe('Document', () => {
  describe('Log logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const owners = ['did:3:bafyasdfasdf']
    let user: DID
    let dispatcher: any;
    let doctypeHandler: TileDoctypeHandler;
    let findHandler: any;
    let anchorService: AnchorService;
    let ceramic: Ceramic;
    let context: Context;

    beforeEach(() => {
      dispatcher = Dispatcher(false)
      anchorService = new MockAnchorService(dispatcher)
      user = new DID()
      user.createJWS = jest.fn(async () => {
        // fake jws
        return 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ.bbbb.cccc'
      })
      user._id = 'did:3:bafyasdfasdf'
      doctypeHandler = new TileDoctypeHandler()
      doctypeHandler.verifyJWS = async (): Promise<void> => { return }
      findHandler = (): TileDoctypeHandler => doctypeHandler

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

      context = {
        did: user,
        anchorService,
        ipfs: dispatcher._ipfs,
        resolver: new Resolver({
          ...threeIdResolver
        }),
        provider: null,
      }

      ceramic = new Ceramic(dispatcher, pinStore, context)
      ceramic._doctypeHandlers['tile'] = doctypeHandler
    })

    it('is created correctly', async () => {
      const doc = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)

      expect(doc.content).toEqual(initialContent)
      expect(dispatcher.register).toHaveBeenCalledWith(doc)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(doc)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('is loaded correctly', async () => {
      const doc1 = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context, { applyOnly: true, skipWait: true })
      const doc2 = await Document.load(doc1.id, findHandler, dispatcher, pinStore, context, { skipWait: true })

      expect(doc1.id).toEqual(doc2.id)
      expect(doc1.content).toEqual(initialContent)
      expect(doc1.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles new head correctly', async () => {
      const tmpDoc = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(tmpDoc)
      const docId = tmpDoc.id
      const log = tmpDoc.state.log
      const doc = await Document.load(docId, findHandler, dispatcher, pinStore, context, { skipWait: true })
      // changes will not load since no network and no local head storage yet
      expect(doc.content).toEqual(initialContent)
      expect(doc.state).toEqual(expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 }))
      // _handleHead is intended to be called by the dispatcher
      // should return a promise that resolves when head is added
      await doc._handleHead(log[1])
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
      expect(doc.content).toEqual(initialContent)
    })

    it('it handles versions correctly (valid, invalid, non-existent)', async () => {
      const doc = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)

      let versions = await doc.listVersions()
      expect(versions).toEqual([])

      await anchorUpdate(doc)

      versions = await doc.listVersions()
      expect(versions.length).toEqual(1)

      const updateRec = await TileDoctype._makeRecord(doc.doctype, user, newContent, doc.owners)

      versions = await doc.listVersions()
      expect(versions.length).toEqual(1)

      await doc.applyRecord(updateRec)

      versions = await doc.listVersions()
      expect(versions.length).toEqual(1)

      await anchorUpdate(doc)

      versions = await doc.listVersions()
      expect(versions.length).toEqual(2)

      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)

      // try to checkout non-existing version
      try {
        await Document.getVersion(doc, new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu'))
        throw new Error('Should not be able to fetch non-existing version')
      } catch (e) {
        expect(e.message).toContain('No record found for version')
      }

      // try to checkout not anchored version
      try {
        await Document.getVersion(doc, doc.doctype.state.log[2])
        throw new Error('Should not be able to fetch not anchored version')
      } catch (e) {
        expect(e.message).toContain('No anchor record for version')
      }

      const docV1 = await Document.getVersion(doc, doc.doctype.state.log[1])
      expect(docV1.state.log.length).toEqual(2)
      expect(docV1.owners).toEqual(owners)
      expect(docV1.content).toEqual(initialContent)
      expect(docV1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // try to call doctype.change
      try {
        await docV1.doctype.change({ content: doc.content, owners: doc.owners })
        throw new Error('Should not be able to fetch not anchored version')
      } catch (e) {
        expect(e.message).toEqual('The version of the document is readonly. Checkout the latest HEAD in order to update.')
      }
    })

    it('is updated correctly', async () => {
      const doc = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(doc)

      const updateRec = await TileDoctype._makeRecord(doc.doctype, user, newContent, doc.owners)
      await doc.applyRecord(updateRec)

      await anchorUpdate(doc)
      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles conflict', async () => {
      const fakeState = { asdf: 2342 }
      const doc1 = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)
      const docId = doc1.id
      await anchorUpdate(doc1)
      const headPreUpdate = doc1.head

      let updateRec = await TileDoctype._makeRecord(doc1.doctype, user, newContent, doc1.owners)
      await doc1.applyRecord(updateRec)

      await anchorUpdate(doc1)
      expect(doc1.content).toEqual(newContent)
      const headValidUpdate = doc1.head
      // create invalid change that happened after main change
      const doc2 = await Document.load(docId, findHandler, dispatcher, pinStore, context, { skipWait: true })
      await doc2._handleHead(headPreUpdate)
      // add short wait to get different anchor time
      // sometime the tests are very fast
      await new Promise(resolve => setTimeout(resolve, 1))
      // TODO - better mock for anchors

      updateRec = await TileDoctype._makeRecord(doc2.doctype, user, fakeState, doc2.owners)
      await doc2.applyRecord(updateRec)

      await anchorUpdate(doc2)
      const headInvalidUpdate = doc2.head
      expect(doc2.content).toEqual(fakeState)
      // loading head from valid log to doc with invalid
      // log results in valid state
      await doc2._handleHead(headValidUpdate)
      expect(doc2.content).toEqual(newContent)

      // loading head from invalid log to doc with valid
      // log results in valid state
      await doc1._handleHead(headInvalidUpdate)
      expect(doc1.content).toEqual(newContent)
    })
  })

  describe('Network update logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const owners = ['did:3:bafyasdfasdf']

    let dispatcher: any;
    let doctypeHandler: TileDoctypeHandler;
    let getHandlerFromGenesis: any;
    let anchorService: AnchorService;
    let context: Context;
    let ceramic: Ceramic;
    let user: DID;

    beforeEach(() => {
      dispatcher = Dispatcher(true)
      anchorService = new MockAnchorService(dispatcher)
      user = new DID()
      user.createJWS = jest.fn(async () => {
        // fake jws
        return 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ.bbbb.cccc'
      })
      user._id = 'did:3:bafyuser'
      doctypeHandler = new TileDoctypeHandler()
      doctypeHandler.verifyJWS = async (): Promise<void> => { return }
      getHandlerFromGenesis = (): TileDoctypeHandler => doctypeHandler

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

      context = {
        did: user,
        anchorService,
        ipfs: dispatcher._ipfs,
        resolver: new Resolver({
          ...threeIdResolver
        }),
        provider: null,
      }

      ceramic = new Ceramic(dispatcher, pinStore, context)
      ceramic._doctypeHandlers['tile'] = doctypeHandler
    })

    it('should announce change to network', async () => {
      const doc1 = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1.head, 'tile')
      await anchorUpdate(doc1)

      const updateRec = await TileDoctype._makeRecord(doc1.doctype, user, newContent, doc1.owners)
      await doc1.applyRecord(updateRec)

      expect(doc1.content).toEqual(newContent)

      expect(dispatcher.publishHead).toHaveBeenCalledTimes(3)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1.head, 'tile')
    })

    it('documents share updates', async () => {
      const doc1 = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)
      await anchorUpdate(doc1)
      const doc2 = await Document.load(doc1.id, getHandlerFromGenesis, dispatcher, pinStore, context, { skipWait: true })

      const updatePromise = new Promise(resolve => {
        doc2.doctype.on('change', resolve)
      })

      const updateRec = await TileDoctype._makeRecord(doc1.doctype, user, newContent, doc1.owners)
      await doc1.applyRecord(updateRec)

      expect(doc1.content).toEqual(newContent)

      await updatePromise
      expect(doc2.content).toEqual(newContent)
    })

    it('should publish head on network request', async () => {
      const doc = await create({ content: initialContent, metadata: { owners, tags: ['3id'] } }, ceramic, context)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(1, doc.id, doc.head, 'tile')

      await dispatcher._requestHead(doc.id)

      expect(dispatcher.publishHead).toHaveBeenCalledTimes(2)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(2, doc.id, doc.head, 'tile')

      // wait a bit to complete document handling
      await new Promise(resolve => setTimeout(resolve, 1000))
    })
  })
})
