import Dispatcher, { MsgType } from '../dispatcher'

jest.mock('ipfs-pubsub-room')//, () => {
const ipfs = {
  dag: {
    put: jest.fn(() => 'hash'),
    get: jest.fn(() => ({ value: 'data' }))
  },
  id: (): any => ({ id: 'ipfsid' })
}


describe('Dispatcher', () => {

  beforeEach(() => {
    ipfs.dag.put.mockClear()
    ipfs.dag.get.mockClear()
  })

  it('is constructed correctly', async () => {
    const disp = new Dispatcher(ipfs)
    expect(disp._ids).toEqual({})
    expect(disp._room.on).toHaveBeenCalledWith('message', expect.anything())
  })

  it('makes registration correctly', async () => {
    const id = '/ceramic/3id/234'
    const disp = new Dispatcher(ipfs)
    disp.register(id)
    expect(disp._room.broadcast).toHaveBeenCalledWith(JSON.stringify({ typ: MsgType.REQUEST, id }))
  })

  it('creates new record correctly', async () => {
    const disp = new Dispatcher(ipfs)
    expect(await disp.newRecord('data')).toEqual('hash')
  })

  it('publishes head correctly', async () => {
    const id = '/ceramic/3id/234'
    const head = 'bafy9h3f08erf'
    const disp = new Dispatcher(ipfs)
    disp.publishHead(id, head)
    expect(disp._room.broadcast).toHaveBeenCalledWith(JSON.stringify({ typ: MsgType.UPDATE, id, cid: head }))
  })

  it('gets record correctly', async () => {
    const disp = new Dispatcher(ipfs)
    expect(await disp.getRecord('hash')).toEqual('data')
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

    disp.handleMessage({ data: JSON.stringify({ typ: MsgType.UPDATE, id, cid: 'hash' }) })
    expect(await updatePromise).toEqual('hash')
  })

  it('closes correctly', async () => {
    const disp = new Dispatcher(ipfs)
    await disp.close()
    expect(disp._room.leave).toHaveBeenCalledTimes(1)
  })
})
