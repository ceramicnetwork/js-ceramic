import Dispatcher, { MsgType } from '../dispatcher'
import CID from 'cids'
import Document from "../document"

const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
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

describe('Dispatcher', () => {

  beforeEach(() => {
    ipfs.dag.put.mockClear()
    ipfs.dag.get.mockClear()
    ipfs.pubsub.subscribe.mockClear()
    ipfs.pubsub.unsubscribe.mockClear()
    ipfs.pubsub.publish.mockClear()
  })

  it('is constructed correctly', async () => {
    const disp = new Dispatcher(ipfs)
    expect(disp._documents).toEqual({})
    expect(ipfs.pubsub.subscribe).toHaveBeenCalledWith(TOPIC, expect.anything())
  })

  it('makes registration correctly', async () => {
    const id = '/ceramic/bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
    const disp = new Dispatcher(ipfs)
    const doc = new Document(id, disp, null)
    await disp.register(doc)
    expect(ipfs.pubsub.publish).toHaveBeenCalledWith(TOPIC, JSON.stringify({ typ: MsgType.REQUEST, id }))
  })

  it('store record correctly', async () => {
    const disp = new Dispatcher(ipfs)
    expect(await disp.storeRecord('data')).toEqual(FAKE_CID)
  })

  it('retrieves record correctly', async () => {
    const disp = new Dispatcher(ipfs)
    expect(await disp.retrieveRecord(FAKE_CID)).toEqual('data')
  })

  it('publishes head correctly', async () => {
    const id = '/ceramic/3id/234'
    const head = 'bafy9h3f08erf'
    const disp = new Dispatcher(ipfs)
    disp.publishHead(id, head)
    expect(ipfs.pubsub.publish).toHaveBeenCalledWith(TOPIC, JSON.stringify({ typ: MsgType.UPDATE, id, cid: head }))
  })

  it('handle message correctly', async () => {
    const id = '/ceramic/bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'
    const disp = new Dispatcher(ipfs)
    const doc = new Document(id, disp, null)
    await disp.register(doc)

    const updatePromise = new Promise(resolve => doc.on('update', resolve))
    const headreqPromise = new Promise(resolve => doc.on('headreq', resolve))

    await disp.handleMessage({ data: JSON.stringify({ typ: MsgType.REQUEST, id }) })
    // only emits an event
    await headreqPromise

    await disp.handleMessage({ data: JSON.stringify({ typ: MsgType.UPDATE, id, cid: FAKE_CID.toString() }) })
    expect(await updatePromise).toEqual(FAKE_CID)
  })

  it('closes correctly', async () => {
    const disp = new Dispatcher(ipfs)
    await disp.close()
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledTimes(1)
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledWith(TOPIC)
  })
})
