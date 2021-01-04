import Dispatcher, { MsgType } from '../dispatcher'
import CID from 'cids'
import Document from "../document"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import DocID from "@ceramicnetwork/docid";

const TOPIC = '/ceramic'
const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_DOC_ID = "kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s"

const ipfs = {
  pubsub: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    ls: jest.fn(() => new Promise((resolve) => {
        resolve([TOPIC])
    })),
    publish: jest.fn()
  },
  dag: {
    put: jest.fn(() => FAKE_CID),
    get: jest.fn(() => ({ value: 'data' }))
  },
  block: {
    stat: jest.fn(() => ({ size: 10 }))
  },
  id: (): any => ({ id: 'ipfsid' })
}

class TileDoctypeMock extends TileDoctype {
  get doctype() {
    return 'tile'
  }

  get tip() {
    return FAKE_CID
  }
}

describe('Dispatcher', () => {

  let dispatcher

  beforeEach(async () => {
    ipfs.dag.put.mockClear()
    ipfs.dag.get.mockClear()
    ipfs.pubsub.subscribe.mockClear()
    ipfs.pubsub.unsubscribe.mockClear()
    ipfs.pubsub.publish.mockClear()

    dispatcher = new Dispatcher(ipfs, TOPIC)
    await dispatcher.init()
  })

  afterEach(async () => {
    await dispatcher.close()
  })

  it('is constructed correctly', async () => {
    expect(dispatcher._documents).toEqual({})
    expect(ipfs.pubsub.subscribe).toHaveBeenCalledWith(TOPIC, expect.anything(), expect.anything())
  })

  it('closes correctly', async () => {
    await dispatcher.close()
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledTimes(1)
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledWith(TOPIC)
  })

  it('makes registration correctly', async () => {
    const doc = new Document(
      DocID.fromString(FAKE_DOC_ID),
      dispatcher,
      null,
      false,
      {},
      null,
      null
    )
    doc['_doctype'] = new TileDoctypeMock(null, {})
    await dispatcher.register(doc)

    const publishArgs = ipfs.pubsub.publish.mock.calls[0]
    expect(publishArgs[0]).toEqual(TOPIC)
    const queryMessageSent = JSON.parse(publishArgs[1])
    delete queryMessageSent.id
    expect(queryMessageSent).toEqual({typ: MsgType.QUERY, doc: FAKE_DOC_ID})
  })

  it('store record correctly', async () => {
    expect(await dispatcher.storeRecord('data')).toEqual(FAKE_CID)
  })

  it('retrieves record correctly', async () => {
    expect(await dispatcher.retrieveRecord(FAKE_CID)).toEqual('data')
  })

  it('publishes tip correctly', async () => {
    const docId = DocID.fromString(FAKE_DOC_ID)
    const tip = 'bafy9h3f08erf'
    dispatcher.publishTip(docId, tip)
    expect(ipfs.pubsub.publish).toHaveBeenCalledWith(TOPIC, JSON.stringify({ typ: MsgType.UPDATE, doc: FAKE_DOC_ID, tip }))
  })

  it('errors on invalid message type', async () => {
    const id = '/ceramic/bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
    await expect(dispatcher.handleMessage({ data: JSON.stringify({ typ: -1, id }) })).rejects.toThrow("Unsupported message type: -1")
  })

  it('handle message correctly', async () => {
    const doc = new Document(
      DocID.fromString(FAKE_DOC_ID),
      dispatcher,
      null,
      false,
      {},
      null,
      null
    )
    doc['_doctype'] = new TileDoctypeMock(null, {})
    await dispatcher.register(doc)

    // Store the query ID sent when the doc is registered so we can use it as the response ID later
    const publishArgs = ipfs.pubsub.publish.mock.calls[0]
    expect(publishArgs[0]).toEqual(TOPIC)
    const queryMessageSent = JSON.parse(publishArgs[1])
    const queryID = queryMessageSent.id

    // Handle UPDATE message
    const updatePromise = new Promise(resolve => doc.on('update', resolve))
    await dispatcher.handleMessage({ data: JSON.stringify({ typ: MsgType.UPDATE, doc: FAKE_DOC_ID, tip: FAKE_CID.toString() }) })
    expect(await updatePromise).toEqual(FAKE_CID)

    // Handle QUERY message
    await dispatcher.handleMessage({ data: JSON.stringify({ typ: MsgType.QUERY, doc: FAKE_DOC_ID, id: "1" }) })
    expect(ipfs.pubsub.publish).lastCalledWith(TOPIC, JSON.stringify({ typ: MsgType.RESPONSE, id: "1", tips: {[FAKE_DOC_ID]: FAKE_CID.toString()} }))

    // Handle RESPONSE message
    const updatePromise2 = new Promise(resolve => doc.on('update', resolve))
    await dispatcher.handleMessage({ data: JSON.stringify({ typ: MsgType.RESPONSE, id: queryID, tips: { [FAKE_DOC_ID]: FAKE_CID2.toString() } }) })
    expect(await updatePromise2).toEqual(FAKE_CID2)
  })
})
