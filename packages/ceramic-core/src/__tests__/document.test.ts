import Document from '../document'
import MockAnchorService from "../anchor/mock/mock-anchor-service";
import ThreeIdDoctypeHandler from '../doctype/three-id/three-id-doctype-handler'
import LevelStateStore from "../store/level-state-store"

jest.mock('../store/level-state-store')

const mockStateStore = new LevelStateStore(null, null,null)

jest.mock('../dispatcher', () => {
  const CID = require('cids') // eslint-disable-line @typescript-eslint/no-var-requires
  const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
  const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))
  return (gossip: boolean): any => {
    const recs: Record<string, any> = {}
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
      storeRecord: jest.fn((rec) => {
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

import Dispatcher from '../dispatcher'
jest.mock('../ceramic-user')
import CeramicUser from '../ceramic-user'
jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWT: (): any => 'verified'
}))

import { ThreeIdDoctype, ThreeIdParams } from "../doctype/three-id/three-id-doctype"
import Ceramic from "../ceramic"
import { Context } from "../../../ceramic-common/lib/context"
import { AnchorStatus, DoctypeHandler, InitOpts, SignatureStatus } from "../../../ceramic-common/lib/doctype"
import AnchorService from "../../../ceramic-common/lib/anchor-service"

const anchorUpdate = (doc: Document): Promise<void> => new Promise(resolve => doc._doctype.on('change', resolve))

const create = async (params: ThreeIdParams, ceramic: Ceramic, context: Context, opts: InitOpts = {}): Promise<Document> => {
  const { content, owners } = params
  if (!owners) {
    throw new Error('The owner of the 3ID needs to be specified')
  }

  const record = await ThreeIdDoctype.makeGenesis({ content, owners })

  return ceramic._createDocFromGenesis(record, opts)
}

describe('Document', () => {

  describe('Log logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const owners = ['publickeymock']
    let user: any
    let dispatcher: any;
    let doctypeHandler: ThreeIdDoctypeHandler;
    let findHandler: any;
    let anchorService: AnchorService;
    let ceramic: Ceramic;
    let context: Context;

    beforeEach(() => {
      dispatcher = Dispatcher(false)
      anchorService = new MockAnchorService(dispatcher)
      user = new CeramicUser()
      doctypeHandler = new ThreeIdDoctypeHandler()
      // fake jwt
      user.sign = jest.fn(async () => 'aaaa.bbbb.cccc')
      findHandler = (): ThreeIdDoctypeHandler => doctypeHandler

      context = {
        anchorService,
        ipfs: dispatcher._ipfs,
        resolver: null,
        provider: null,
      }

      ceramic = new Ceramic(dispatcher, mockStateStore, context)
    })

    it('is created correctly', async () => {
      const doc = await create({ content: initialContent, owners }, ceramic, context)

      expect(doc.content).toEqual(initialContent)
      expect(dispatcher.register).toHaveBeenCalledWith(doc)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(doc)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('is loaded correctly', async () => {
      const doc1 = await create({ content: initialContent, owners }, ceramic, context, { onlyGenesis: true, skipWait: true })
      const doc2 = await Document.load(doc1.id, findHandler, dispatcher, mockStateStore, context, { skipWait: true })

      expect(doc1.id).toEqual(doc2.id)
      expect(doc1.content).toEqual(initialContent)
      expect(doc1.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles new head correctly', async () => {
      const tmpDoc = await create({ content: initialContent, owners }, ceramic, context)
      await anchorUpdate(tmpDoc)
      const docId = tmpDoc.id
      const log = tmpDoc.state.log
      const doc = await Document.load(docId, findHandler, dispatcher, mockStateStore, context, { skipWait: true })
      // changes will not load since no network and no local head storage yet
      expect(doc.content).toEqual(initialContent)
      expect(doc.state).toEqual(expect.objectContaining({ signature: SignatureStatus.GENESIS, anchorStatus: 0 }))
      // _handleHead is intended to be called by the dispatcher
      // should return a promise that resolves when head is added
      await doc._handleHead(log[1])
      expect(doc.state.signature).toEqual(SignatureStatus.GENESIS)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
      expect(doc.content).toEqual(initialContent)
    })

    it('is updated correctly', async () => {
      const doc = await create({ content: initialContent, owners }, ceramic, context)
      await anchorUpdate(doc)

      const updateRec = await ThreeIdDoctype._makeRecord(doc.doctype, user, newContent, doc.owners)
      await doc.applyRecord(updateRec)

      await anchorUpdate(doc)
      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles conflict', async () => {
      const fakeState = { asdf: 2342 }
      const doc1 = await create({ content: initialContent, owners }, ceramic, context)
      const docId = doc1.id
      await anchorUpdate(doc1)
      const headPreUpdate = doc1.head

      let updateRec = await ThreeIdDoctype._makeRecord(doc1.doctype, user, newContent, doc1.owners)
      await doc1.applyRecord(updateRec)

      await anchorUpdate(doc1)
      expect(doc1.content).toEqual(newContent)
      const headValidUpdate = doc1.head
      // create invalid change that happened after main change
      const doc2 = await Document.load(docId, findHandler, dispatcher, mockStateStore, context, { skipWait: true })
      await doc2._handleHead(headPreUpdate)
      // add short wait to get different anchor time
      // sometime the tests are very fast
      await new Promise(resolve => setTimeout(resolve, 1))
      // TODO - better mock for anchors

      updateRec = await ThreeIdDoctype._makeRecord(doc2.doctype, user, fakeState, doc2.owners)
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
    const owners = ['publickeymock']

    let dispatcher: any;
    let doctypeHandler: ThreeIdDoctypeHandler;
    let getHandlerFromGenesis: any;
    let anchorService: AnchorService;
    let context: Context;
    let ceramic: Ceramic;
    let user: CeramicUser;

    beforeEach(() => {
      dispatcher = Dispatcher(true)
      anchorService = new MockAnchorService(dispatcher)
      user = new CeramicUser()
      // fake jwt
      user.sign = jest.fn(async () => 'aaaa.bbbb.cccc')
      doctypeHandler = new ThreeIdDoctypeHandler()
      getHandlerFromGenesis = (): ThreeIdDoctypeHandler => doctypeHandler

      context = {
        anchorService,
        ipfs: dispatcher._ipfs,
        resolver: null,
        provider: null,
      }

      ceramic = new Ceramic(dispatcher, mockStateStore, context)
    })

    it('should announce change to network', async () => {
      const doc1 = await create({ content: initialContent, owners }, ceramic, context)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1.head)
      await anchorUpdate(doc1)

      const updateRec = await ThreeIdDoctype._makeRecord(doc1.doctype, user, newContent, doc1.owners)
      await doc1.applyRecord(updateRec)

      expect(doc1.content).toEqual(newContent)

      expect(dispatcher.publishHead).toHaveBeenCalledTimes(3)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1.head)
    })

    it('documents share updates', async () => {
      const doc1 = await create({ content: initialContent, owners }, ceramic, context)
      await anchorUpdate(doc1)
      const doc2 = await Document.load(doc1.id, getHandlerFromGenesis, dispatcher, mockStateStore, context, { skipWait: true })

      const updatePromise = new Promise(resolve => {
        doc2.doctype.on('change', resolve)
      })

      const updateRec = await ThreeIdDoctype._makeRecord(doc1.doctype, user, newContent, doc1.owners)
      await doc1.applyRecord(updateRec)

      expect(doc1.content).toEqual(newContent)

      await updatePromise
      expect(doc2.content).toEqual(newContent)
    })

    it('should publish head on network request', async () => {
      const doc = await create({ content: initialContent, owners }, ceramic, context)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(1, doc.id, doc.head)

      dispatcher._requestHead(doc.id)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(2)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(2, doc.id, doc.head)
    })
  })
})
