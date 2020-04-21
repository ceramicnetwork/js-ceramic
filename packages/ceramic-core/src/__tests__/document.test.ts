import Document, { AnchorStatus, SignatureStatus } from '../document'
import MockAnchorService from "../anchor/mock/mock-anchor-service";
import ThreeIdHandler from '../doctypes/threeIdHandler'

jest.mock('../dispatcher', () => {
  const CID = require('cids') // eslint-disable-line @typescript-eslint/no-var-requires
  const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
  const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))
  const serializeCIDs = (rec: any): any => {
    if (rec.prev) rec.prev = { '/': rec.prev.toString() }
    if (rec.proof) rec.proof = { '/': rec.proof.toString() }
    if (rec.root) rec.root = { '/': rec.root.toString() }
    return rec
  }
  const deserializeCIDs = (rec: any): any => {
    if (rec.prev) rec.prev = new CID(rec.prev['/'])
    if (rec.proof) rec.proof = new CID(rec.proof['/'])
    if (rec.root) rec.root = new CID(rec.root['/'])
    return rec
  }
  return (gossip: boolean): any => {
    const recs: Record<string, string> = {}
    const listeners: Record<string, Array<(cid: string) => void>> = {}
    return {
      register: jest.fn(),
      on: jest.fn((id, fn) => {
        if (!listeners[id]) listeners[id] = []
        listeners[id].push(fn)
      }),
      storeRecord: jest.fn((rec) => {
        // stringify as a way of doing deep copy
        const serialized = JSON.stringify(serializeCIDs(rec))
        const cid = hash(serialized)
        recs[cid.toString()] = serialized
        return cid
      }),
      publishHead: jest.fn((id, head) => {
        if (gossip) listeners[id+'_update'].map(fn => fn(head))
      }),
      _requestHead: (id): void => {
        if (gossip) listeners[id+'_headreq'].map(fn => fn())
      },
      retrieveRecord: jest.fn(cid => {
        return deserializeCIDs(JSON.parse(recs[cid.toString()]))
      }),
      retrieveRecordByPath: jest.fn((cid) => {
        const rootCid = deserializeCIDs(JSON.parse(recs[cid.toString()])).root;
        return deserializeCIDs(JSON.parse(recs[rootCid]))
      })
    }
  }
})
import Dispatcher from '../dispatcher'
jest.mock('../user')
import User from '../user'
jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWT: (): any => 'verified'
}))

const anchorUpdate = (doc): Promise<void> => new Promise(resolve => doc.on('change', resolve))


describe('Document', () => {

  describe('Log logic', () => {
    const initialContent = { abc: 123, def: 456 }
    const newContent = { abc: 321, def: 456, gh: 987 }
    const owners = ['publickeymock']
    let dispatcher, doctypeHandler, doctypeHandlers, anchorService

    beforeEach(() => {
      dispatcher = Dispatcher(false)
      anchorService = new MockAnchorService(dispatcher)
      doctypeHandler = new ThreeIdHandler()
      doctypeHandler.user = new User()
      // fake jwt
      doctypeHandler.user.sign = jest.fn(async () => 'aaaa.bbbb.cccc')
      doctypeHandlers = { '3id': doctypeHandler }
    })

    it('is created correctly', async () => {
      const doc = await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })
      const docId = doc.id
      expect(doc.content).toEqual(initialContent)
      expect(dispatcher.register).toHaveBeenCalledWith(docId)
      expect(dispatcher.on).toHaveBeenCalled()
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.PENDING)
      await anchorUpdate(doc)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('is loaded correctly', async () => {
      const docId = (await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })).id
      const doc = await Document.load(docId, doctypeHandlers, anchorService, dispatcher, { skipWait: true })
      expect(doc.id).toEqual(docId)
      expect(doc.content).toEqual(initialContent)
      expect(doc.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles new head correctly', async () => {
      const tmpDoc = await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })
      await anchorUpdate(tmpDoc)
      const docId = tmpDoc.id
      const log = tmpDoc.state.log
      const doc = await Document.load(docId, doctypeHandlers, anchorService, dispatcher, { skipWait: true })
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
      const doc = await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })
      await anchorUpdate(doc)
      await doc.change(newContent)
      await anchorUpdate(doc)
      expect(doc.content).toEqual(newContent)
      expect(doc.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(doc.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
    })

    it('handles conflict', async () => {
      const fakeState = { asdf: 2342 }
      const doc1 = await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })
      const docId = doc1.id
      await anchorUpdate(doc1)
      const headPreUpdate = doc1.head
      await doc1.change(newContent)
      await anchorUpdate(doc1)
      expect(doc1.content).toEqual(newContent)
      const headValidUpdate = doc1.head
      // create invalid change that happened after main change
      const doc2 = await Document.load(docId, doctypeHandlers, anchorService, dispatcher, { skipWait: true })
      await doc2._handleHead(headPreUpdate)
      // add short wait to get different anchor time
      // sometime the tests are very fast
      await new Promise(resolve => setTimeout(resolve, 1))
      // TODO - better mock for anchors
      await doc2.change(fakeState)
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
    let dispatcher, doctypeHandler, doctypeHandlers, anchorService

    beforeEach(() => {
      dispatcher = Dispatcher(true)
      anchorService = new MockAnchorService(dispatcher)
      doctypeHandler = new ThreeIdHandler()
      doctypeHandler.user = new User()
      // fake jwt
      doctypeHandler.user.sign = jest.fn(async () => 'aaaa.bbbb.cccc')
      doctypeHandlers = { '3id': doctypeHandler }
    })

    it('should announce change to network', async () => {
      const doc1 = await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1.head)
      await anchorUpdate(doc1)

      await doc1.change(newContent)
      expect(doc1.content).toEqual(newContent)

      expect(dispatcher.publishHead).toHaveBeenCalledTimes(3)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1.head)
    })

    it('documents share updates', async () => {
      const doc1 = await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })
      await anchorUpdate(doc1)
      const doc2 = await Document.load(doc1.id, doctypeHandlers, anchorService, dispatcher, { skipWait: true })

      const updatePromise = new Promise(resolve => {
        doc2.on('change', resolve)
      })
      await doc1.change(newContent)
      expect(doc1.content).toEqual(newContent)

      await updatePromise
      expect(doc2.content).toEqual(newContent)
    })

    it('should publish head on network request', async () => {
      const doc = await Document.create(initialContent, doctypeHandler, anchorService, dispatcher, { owners })
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(1, doc.id, doc.head)

      dispatcher._requestHead(doc.id)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(2)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(2, doc.id, doc.head)
    })
  })
})
