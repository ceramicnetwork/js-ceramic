import Dispatcher, { MsgType } from '../dispatcher'
import CID from 'cids'
import Document from "../document"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import DocID from "@ceramicnetwork/docid";

const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_DOC_ID = "kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s"

const ipfs = {
  pubsub: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    publish: jest.fn()
  },
  dag: {
    put: jest.fn(() => FAKE_CID),
    get: jest.fn(() => ({ value: 'data' }))
  },
  id: (): any => ({ id: 'ipfsid' })
}
const TOPIC = '/ceramic'

class TileDoctypeMock extends TileDoctype {
  get doctype() {
    return 'tile'
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

    dispatcher = new Dispatcher(ipfs)
    await dispatcher.init()
  })

  it('is constructed correctly', async () => {
    expect(dispatcher._documents).toEqual({})
    expect(ipfs.pubsub.subscribe).toHaveBeenCalledWith(TOPIC, expect.anything())
  })

  it('closes correctly', async () => {
    await dispatcher.close()
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledTimes(1)
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledWith(TOPIC)
  })

  it('makes registration correctly', async () => {
    const id = '/ceramic/bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
    const doc = new Document(id, dispatcher, null)
    doc._doctype = new TileDoctypeMock()
    await dispatcher.register(doc)
    expect(ipfs.pubsub.publish).toHaveBeenCalledWith(TOPIC, JSON.stringify({ typ: MsgType.QUERY, id, doctype: 'tile' }))
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

    const doc = new Document(id, dispatcher, null)
    doc._doctype = new TileDoctypeMock()
    await dispatcher.register(doc)

    await expect(dispatcher.handleMessage({ data: JSON.stringify({ typ: -1, id }) })).rejects.toThrow("Unsupported message type: -1")
  })

  it('handle message correctly', async () => {
    const docId = '/ceramic/bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
    const doc = new Document(docId, dispatcher, null)
    doc._doctype = new TileDoctypeMock()
    await dispatcher.register(doc)

    const updatePromise = new Promise(resolve => doc.on('update', resolve))
    const tipreqPromise = new Promise(resolve => doc.on('tipreq', resolve))

    await dispatcher.handleMessage({ data: JSON.stringify({ typ: MsgType.QUERY, id: docId }) })
    // only emits an event
    await tipreqPromise

    await dispatcher.handleMessage({ data: JSON.stringify({ typ: MsgType.UPDATE, doc: docId, tip: FAKE_CID.toString() }) })
    expect(await updatePromise).toEqual(FAKE_CID)
  })
})
