import Document from '../document'

jest.mock('../dispatcher', () => {
  return (): any => {
    const recs: Array<string> = []
    const listeners: Record<string, Array<(cid: string) => void>> = {}
    return {
      register: jest.fn(),
      on: jest.fn((id, fn) => {
        if (!listeners[id]) listeners[id] = []
        listeners[id].push(fn)
      }),
      newRecord: jest.fn((rec) => {
        // stringify as a way of doing deep copy
        recs.push(JSON.stringify(rec))
        return '' + (recs.length - 1)
      }),
      publishHead: jest.fn((id, head) => {
        listeners[id+'_update'].map(fn => fn(head))
      }),
      _requestHead: (id): void => {
        listeners[id+'_headreq'].map(fn => fn())
      },
      getRecord: jest.fn(cid => {
        return JSON.parse(recs[parseInt(cid)])
      })
    }
  }
})
import Dispatcher from '../dispatcher'

const DOCTYPE_1 = '3id'

describe('Document', () => {

  describe('Log logic', () => {
    const initialState = { abc: 123, def: 456 }
    const newState = { abc: 321, def: 456, gh: 987 }
    let dispatcher

    beforeEach(() => {
      dispatcher = Dispatcher()
    })

    it('is created correctly', async () => {
      const doc = await Document.create(initialState, DOCTYPE_1, dispatcher)
      const docId = doc.id
      expect(doc.content).toEqual(initialState)
      expect(dispatcher.register).toHaveBeenCalledWith(docId)
      expect(dispatcher.on).toHaveBeenCalled()
    })

    it('is loaded correctly', async () => {
      const docId = (await Document.create(initialState, DOCTYPE_1, dispatcher)).id
      const doc = await Document.load(docId, dispatcher)
      expect(doc.id).toEqual(docId)
      expect(doc.content).toEqual(initialState)
    })

    it('handles new head correctly', async () => {
      const tmpDoc = await Document.create(initialState, DOCTYPE_1, dispatcher)
      const docId = tmpDoc.id
      const log = tmpDoc._state.log
      const doc = await Document.load(docId, dispatcher)
      // changes will not load since no network and no local head storage yet
      expect(doc.content).toEqual(initialState)
      expect(doc.status()).toEqual({ signature: 'UNSIGNED', anchored: 0 })
      // _handleHead is intended to be called by the dispatcher
      // should return a promise that resolves when head is added
      await doc._handleHead(log[1])
      expect(doc.status()).toEqual({ signature: 'SIGNED', anchored: 0 })
      expect(doc.content).toEqual(initialState)
      const updatePromise = new Promise(resolve => {
        doc.on('change', resolve)
      })
      doc._handleHead(log[2])
      // change should be emitted when head has been added
      await updatePromise
      expect(doc.status().signature).toEqual('SIGNED')
      expect(doc.status().anchored).not.toEqual(0)
      expect(doc.content).toEqual(initialState)
    })

    it('is updated correctly', async () => {
      const doc = await Document.create(initialState, DOCTYPE_1, dispatcher)
      await doc.change(newState)
      expect(doc.content).toEqual(newState)
      expect(doc.status().signature).toEqual('SIGNED')
      expect(doc.status().anchored).not.toEqual(0)
    })

    it('handles conflict', async () => {
      const fakeState = { asdf: 2342 }
      const doc1 = await Document.create(initialState, DOCTYPE_1, dispatcher)
      const docId = doc1.id
      const headPreUpdate = doc1.head
      await doc1.change(newState)
      expect(doc1.content).toEqual(newState)
      const headValidUpdate = doc1.head
      // create invalid change that happened after main change
      const doc2 = await Document.load(docId, dispatcher)
      await doc2._handleHead(headPreUpdate)
      // add short wait to get different anchor time
      // sometime the tests are damn fast
      await new Promise(resolve => setTimeout(resolve, 1))
      // TODO - better mock for anchors
      await doc2.change(fakeState)
      const headInvalidUpdate = doc2.head
      expect(doc2.content).toEqual(fakeState)
      // loading head from valid log to doc with invalid
      // log results in valid state
      await doc2._handleHead(headValidUpdate)
      expect(doc2.content).toEqual(newState)

      // loading head from invalid log to doc with valid
      // log results in valid state
      await doc1._handleHead(headInvalidUpdate)
      expect(doc1.content).toEqual(newState)
    })
  })

  describe('Network update logic', () => {
    const initialState = { abc: 123, def: 456 }
    const newState = { abc: 321, def: 456, gh: 987 }
    let dispatcher

    beforeEach(() => {
      dispatcher = Dispatcher()
    })

    it('should announce change to network', async () => {
      const doc1 = await Document.create(initialState, DOCTYPE_1, dispatcher)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1._state.log[2])

      await doc1.change(newState)
      expect(doc1.content).toEqual(newState)

      expect(dispatcher.publishHead).toHaveBeenCalledTimes(2)
      expect(dispatcher.publishHead).toHaveBeenCalledWith(doc1.id, doc1._state.log[5])
    })

    it('documents share updates', async () => {
      const doc1 = await Document.create(initialState, DOCTYPE_1, dispatcher)
      const doc2 = await Document.load(doc1.id, dispatcher)

      const updatePromise = new Promise(resolve => {
        doc2.on('change', resolve)
      })
      await doc1.change(newState)
      expect(doc1.content).toEqual(newState)

      await updatePromise
      expect(doc2.content).toEqual(newState)
    })

    it('should publish head on network request', async () => {
      const doc = await Document.create(initialState, DOCTYPE_1, dispatcher)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(1)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(1, doc.id, doc._state.log[2])

      dispatcher._requestHead(doc.id)
      expect(dispatcher.publishHead).toHaveBeenCalledTimes(2)
      expect(dispatcher.publishHead).toHaveBeenNthCalledWith(2, doc.id, doc._state.log[2])
    })
  })
})
