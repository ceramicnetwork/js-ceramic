import { CrustPinningBackend, EmptySeedError } from '../index'
import * as papi from '@polkadot/api'
import * as pkr from '@polkadot/keyring'
import { CID } from 'multiformats/cid'
import * as cf from 'cross-fetch'

jest.mock('cross-fetch')
jest.mock('@polkadot/api')
jest.mock('@polkadot/keyring')

const api = {
  tx: {
    market: {
      placeStorageOrder: jest.fn(() => tx),
      addPrepaid: jest.fn(() => tx)
    }
  },
  disconnect: jest.fn()
}

const tx = {
  signAndSend: jest.fn(() => new Promise(resolve => resolve('')))
}

const kr = {
  addFromUri: jest.fn(() => krp)
}

const krp = {
  address: "cTM4JJMox7nbUqa1R6yMDwnqdEJByWDzHtdr1QczT2MqEVC33"
}

beforeEach(() => {
  jest.spyOn<any, any>(papi, 'ApiPromise').mockImplementation(() => api)
  jest.spyOn<any, any>(pkr, 'Keyring').mockImplementation(() => kr)
})

const seed = 'test seed test seed test seed test seed test seed test seed'
const connectionString = `crust://test.network?seed=${seed}`

describe('#constructor', () => {
  test('set crust endpoint from crust:// URL', () => {
    const pinning = new CrustPinningBackend(connectionString)
    expect(pinning.endpoint).toEqual('ws://test.network')
    expect(pinning.seed).toEqual(seed)
  })
  test('set crust endpoint from crust+ws:// URL', () => {
    const pinning = new CrustPinningBackend(`crust+ws://192.168.22.22:9944?seed=${seed}`)
    expect(pinning.endpoint).toEqual('ws://192.168.22.22:9944')
    expect(pinning.seed).toEqual(seed)
  })
  test('set crust endpoint from crust+wss:// URL', () => {
    const pinning = new CrustPinningBackend(`crust+wss://test.network?seed=${seed}`)
    expect(pinning.endpoint).toEqual('wss://test.network')
    expect(pinning.seed).toEqual(seed)
  })
  test('require seed', () => {
    expect(() => {
      new CrustPinningBackend(`crust://test.network`)
    }).toThrow(EmptySeedError)
  })
})

test('#open', async () => {
  const pinning = new CrustPinningBackend(connectionString)
  expect(pinning.api).toBeUndefined()
  await pinning.open()
  expect(pinning.api).toBeDefined()
  expect(papi.ApiPromise).toHaveBeenCalled()
  expect(papi.WsProvider).toHaveBeenCalled()
})

describe('#close', () => {
  test('normal close', async () => {
    const pinning = new CrustPinningBackend(connectionString)
    expect(pinning.api).toBeUndefined()
    await pinning.open()
    expect(pinning.api).toBeDefined()
    await pinning.close()
    expect(pinning.api).toBeUndefined()
  })
  test('close without openning', async () => {
    const pinning = new CrustPinningBackend(connectionString)
    expect(pinning.api).toBeUndefined()
    await pinning.close()
    expect(pinning.api).toBeUndefined()
  })
})

describe('#pin', () => {
  test('pin commit', async () => {
    const pinning = new CrustPinningBackend(connectionString)
    await pinning.open()
    pinning.sendTx = jest.fn(() => new Promise(resolve => {
      tx.signAndSend()
      resolve()
    }))
    const cid = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await pinning.pin(cid)
    expect(pinning.api.tx.market.placeStorageOrder).toBeCalledWith(cid.toString(), expect.anything(), expect.anything(), expect.anything())
    expect(pinning.api.tx.market.addPrepaid).toBeCalledWith(cid.toString(), expect.anything())
    expect(tx.signAndSend).toHaveBeenCalledTimes(2)
  })
})

describe('#ls', () => {
  const cids = [
    CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D'),
    CID.parse('QmWXShtJXt6Mw3FH7hVCQvR56xPcaEtSj4YFSGjp2QxA4v'),
  ]
  const cidsArray = []
  cids.forEach((cid) => {
    cidsArray.push({ args: str2HexStr(cid.toString()) })
  })

  test('return list of cids pinned', async () => {
    const pinning = new CrustPinningBackend(connectionString)
    await pinning.open();
    (cf.default as jest.Mock).mockReturnValueOnce(Promise.resolve({
      status: 200,
      json: () => Promise.resolve({ data: { substrate_extrinsic: cidsArray } }),
    }))
    const result = await pinning.ls()
    cids.forEach((cid) => {
      expect(result[cid.toString()]).toEqual([pinning.id])
    })
  })
})

test('#id', async () => {
  const pinning = new CrustPinningBackend(connectionString)
  const id = pinning.id
  expect(id).toEqual('crust@xpelRd5ugzMf8DHKmIzPuz7LnsZetCr7sIdBe7JQnkM=')
})

test('#info', async () => {
  const pinning = new CrustPinningBackend(connectionString)
  await pinning.open()
  const result = await pinning.info()
  expect(result).toEqual({
    [pinning.id]: {},
  })
})

function str2HexStr(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16);
  }
  return "0x" + hex;
}
