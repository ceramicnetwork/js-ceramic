import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'

const tx = {
  signAndSend: jest.fn(() => ''),
}
const mockApiPromise = {
  tx: {
    market: {
      placeStorageOrder: jest.fn(() => tx),
      addPrepaid: jest.fn(() => tx),
    },
  },
  disconnect: jest.fn(),
}
const mockPapi = {
  ApiPromise: jest.fn(() => mockApiPromise),
  WsProvider: jest.fn(),
}
jest.unstable_mockModule('@polkadot/api', () => {
  return mockPapi
})

const mockKeyring = {
  addFromUri: jest.fn(() => krp),
}
const krp = {
  address: 'cTM4JJMox7nbUqa1R6yMDwnqdEJByWDzHtdr1QczT2MqEVC33',
}
jest.unstable_mockModule('@polkadot/keyring', () => {
  return {
    Keyring: jest.fn(() => mockKeyring),
  }
})

const cids = [
  CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D'),
  CID.parse('QmWXShtJXt6Mw3FH7hVCQvR56xPcaEtSj4YFSGjp2QxA4v'),
]
const cidsArray = cids.map((cid) => ({ args: str2HexStr(cid.toString()) }))
jest.unstable_mockModule('cross-fetch', () => {
  const mockFetch = jest.fn(() => {
    return {
      status: 200,
      json: () => Promise.resolve({ data: { substrate_extrinsic: cidsArray } }),
    }
  })

  return {
    default: mockFetch,
  }
})

let CrustPinningBackend: any
let EmptySeedError: any
beforeEach(async () => {
  const module = await import('../index.js')
  CrustPinningBackend = module.CrustPinningBackend
  EmptySeedError = module.EmptySeedError
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
  expect(mockPapi.ApiPromise).toHaveBeenCalled()
  expect(mockPapi.WsProvider).toHaveBeenCalled()
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
    pinning.sendTx = jest.fn(async () => tx.signAndSend())
    const cid = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await pinning.pin(cid)
    expect(pinning.api.tx.market.placeStorageOrder).toBeCalledWith(
      cid.toString(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    )
    expect(pinning.api.tx.market.addPrepaid).toBeCalledWith(cid.toString(), expect.anything())
    expect(tx.signAndSend).toHaveBeenCalledTimes(2)
  })
})

describe('#ls', () => {
  test('return list of cids pinned', async () => {
    const pinning = new CrustPinningBackend(connectionString)
    await pinning.open()
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
  let hex = ''
  for (let i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16)
  }
  return '0x' + hex
}
