import { EmptyTokenError, PowergatePinningBackend } from '../index'
import * as pow from '@textile/powergate-client'
import CID from 'cids'

jest.mock('@textile/powergate-client')

const token = 'FOO_TOKEN'
const connectionString = `powergate://example.com?token=${token}`

const setToken = jest.fn()
const mockPow = {
  setToken: setToken,
  storageConfig: {
    apply: jest.fn(),
    remove: jest.fn(),
  },
  storageInfo: {
    list: jest.fn(),
  },
}

beforeEach(() => {
  jest.spyOn<any, any>(pow, 'createPow').mockImplementation(() => mockPow)
})

describe('constructor', () => {
  test('set Powergate endpoint from powergate:// URL', () => {
    const pinning = new PowergatePinningBackend(connectionString)
    expect(pinning.endpoint).toEqual('http://example.com:6002')
    expect(pinning.token).toEqual(token)
  })
  test('set Powergate endpoint from powergate+http:// URL', () => {
    const pinning = new PowergatePinningBackend(`powergate+http://example.com:3004?token=${token}`)
    expect(pinning.endpoint).toEqual('http://example.com:3004')
    expect(pinning.token).toEqual(token)
  })
  test('set Powergate endpoint from powergate+https:// URL', () => {
    const pinning = new PowergatePinningBackend(`powergate+https://example.com?token=${token}`)
    expect(pinning.endpoint).toEqual('https://example.com:6002')
    expect(pinning.token).toEqual(token)
  })
  test('require token', () => {
    expect(() => {
      new PowergatePinningBackend(`powergate+https://example.com`)
    }).toThrow(EmptyTokenError)
  })
})

test('#open', async () => {
  jest.spyOn<any, any>(pow, 'createPow').mockImplementation(() => mockPow)
  const pinning = new PowergatePinningBackend(connectionString)
  expect(pinning.pow).toBeUndefined()
  await pinning.open()
  expect(pow.createPow).toBeCalledWith({ host: pinning.endpoint })
  expect(setToken).toBeCalledWith(token)
  expect(pinning.pow).toBe(mockPow)
})

describe('#pin', () => {
  test('pin record', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    await pinning.open()
    const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await pinning.pin(cid)
    expect(mockPow.storageConfig.apply).toBeCalledWith(cid.toString(), expect.anything())
  })

  test('throw if not double pinning', async () => {
    jest.spyOn<any, any>(pow, 'createPow').mockImplementation(() => mockPow)
    const pinning = new PowergatePinningBackend(connectionString)
    await pinning.open()
    const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    mockPow.storageConfig.apply = jest.fn(() => {
      throw new Error('something wrong')
    })
    await expect(pinning.pin(cid)).rejects.toThrow('something wrong')
    expect(mockPow.storageConfig.apply).toBeCalledWith(cid.toString(), expect.anything())
  })
})

describe('#unpin', () => {
  test('remove from pin set', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    await pinning.open()
    const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await pinning.unpin(cid)
    expect(mockPow.storageConfig.remove).toBeCalledWith(cid.toString())
  })
})

describe('#ls', () => {
  const cids = [
    new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D'),
    new CID('QmWXShtJXt6Mw3FH7hVCQvR56xPcaEtSj4YFSGjp2QxA4v'),
  ]

  test('return list of cids pinned', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    await pinning.open()
    mockPow.storageInfo.list = jest.fn(async () => {
      return {
        storageInfoList: cids.map((cid) => {
          return {
            cid: cid.toString(),
          }
        }),
      }
    })
    const result = await pinning.ls()
    cids.forEach((cid) => {
      expect(result[cid.toString()]).toEqual([pinning.id])
    })
  })

  test('return empty if no pow', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    const result = await pinning.ls()
    expect(result).toEqual({})
  })

  test('return empty if no info', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    await pinning.open()
    mockPow.storageInfo.list = jest.fn(async () => {
      return {
        storageInfoList: [],
      }
    })
    const result = await pinning.ls()
    expect(result).toEqual({})
  })
})

test('#id', async () => {
  const pinning = new PowergatePinningBackend(connectionString)
  const id = pinning.id
  expect(id).toEqual('powergate@1jv3pY_D2aj8gdbDeg-GHSlIB1aBg1bGB0yQBpNYOaA=')
})

describe('#info', () => {
  test('return random info', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    await pinning.open()
    const result = await pinning.info()
    expect(result).toEqual({
      [pinning.id]: {},
    })
  })

  test('return empty if no pow', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    const result = await pinning.info()
    expect(result).toEqual({
      [pinning.id]: {},
    })
  })

  test('return empty if no info', async () => {
    const pinning = new PowergatePinningBackend(connectionString)
    await pinning.open()
    const result = await pinning.info()
    expect(result).toEqual({
      [pinning.id]: {},
    })
  })
})
