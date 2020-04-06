import Dispatcher, { MsgType } from '../dispatcher'
import CID from 'cids'

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
    expect(disp._ids).toEqual({})
    expect(ipfs.pubsub.subscribe).toHaveBeenCalledWith(TOPIC, expect.anything())
  })

  it('makes registration correctly', async () => {
    const id = '/ceramic/3id/234'
    const disp = new Dispatcher(ipfs)
    disp.register(id)
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
    const id = '/ceramic/3id/234'
    const disp = new Dispatcher(ipfs)
    disp.register(id)
  const updatePromise = new Promise(resolve => disp.on(id+'_update', resolve))
    const headreqPromise = new Promise(resolve => disp.on(id+'_headreq', resolve))

    disp.handleMessage({ data: JSON.stringify({ typ: MsgType.REQUEST, id }) })
    // only emits an event
    await headreqPromise

    disp.handleMessage({ data: JSON.stringify({ typ: MsgType.UPDATE, id, cid: FAKE_CID.toString() }) })
    expect(await updatePromise).toEqual(FAKE_CID)
  })

  it('closes correctly', async () => {
    const disp = new Dispatcher(ipfs)
    await disp.close()
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledTimes(1)
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledWith(TOPIC)
  })
})
