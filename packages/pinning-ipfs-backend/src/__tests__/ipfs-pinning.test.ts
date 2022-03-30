import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { asyncIterableFromArray } from './async-iterable-from-array.util.js'
import type { IPFS } from 'ipfs-core-types'

const mockIpfsCreate = jest.fn()
jest.unstable_mockModule('ipfs-http-client', () => {
  return {
    create: mockIpfsCreate,
  }
})

let IpfsPinning: any
let NoIpfsInstanceError: any

beforeEach(async () => {
  const index = await import('../index.js')
  IpfsPinning = index.IpfsPinning
  NoIpfsInstanceError = index.NoIpfsInstanceError
})

describe('constructor', () => {
  const ipfs = {} as unknown as IPFS

  test('set IPFS address to ipfs+context', () => {
    const pinning = new IpfsPinning('ipfs+context', ipfs)
    expect(pinning.ipfsAddress).toEqual('ipfs+context')
  })
  test('set IPFS address from ipfs+http protocol', () => {
    const pinning = new IpfsPinning('ipfs+http://example.com', ipfs)
    expect(pinning.ipfsAddress).toEqual('http://example.com:5001')
  })
  test('set IPFS address from ipfs+https protocol', () => {
    const pinning = new IpfsPinning('ipfs+https://example.com', ipfs)
    expect(pinning.ipfsAddress).toEqual('https://example.com:5001')
  })
})

describe('#open', () => {
  test('use provided IPFS', async () => {
    const ipfs = jest.fn() as unknown as IPFS
    const pinning = new IpfsPinning('ipfs+context', ipfs)
    pinning.open()
    expect(pinning.ipfs).toBe(ipfs)
  })
  test('throw if no IPFS instance', async () => {
    const ipfs = null
    const pinning = new IpfsPinning('ipfs+context', ipfs)
    expect(() => pinning.open()).toThrow(NoIpfsInstanceError)
  })
  test('use IPFS client pointed to #ipfsAddress', async () => {
    const ipfs = {} as unknown as IPFS
    const pinning = new IpfsPinning('ipfs+https://example.com', ipfs)
    pinning.open()
    expect(mockIpfsCreate).toBeCalledWith({ url: 'https://example.com:5001' })
  })
})

describe('#pin', () => {
  test('call ipfs instance', async () => {
    const add = jest.fn()
    const ipfs = {
      pin: {
        add: add,
      },
    } as unknown as IPFS

    const pinning = new IpfsPinning('ipfs+context', ipfs)
    pinning.open()
    const cid = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await pinning.pin(cid)
    expect(add).toBeCalledWith(cid, { recursive: false })
  })

  test('silently pass if no IPFS instance', async () => {
    const ipfs = null
    const pinning = new IpfsPinning('ipfs+context', ipfs)
    const cid = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await expect(pinning.pin(cid)).resolves.toBeUndefined()
  })
})

describe('#unpin', () => {
  test('call ipfs instance', async () => {
    const rm = jest.fn()
    const ipfs = {
      pin: {
        rm: rm,
      },
    } as unknown as IPFS

    const pinning = new IpfsPinning('ipfs+context', ipfs)
    pinning.open()
    const cid = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await pinning.unpin(cid)
    expect(rm).toBeCalledWith(cid)
  })

  test('silently pass if no IPFS instance', async () => {
    const ipfs = null
    const pinning = new IpfsPinning('ipfs+context', ipfs)
    const cid = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    await expect(pinning.unpin(cid)).resolves.toBeUndefined()
  })
})

describe('#ls', () => {
  test('return list of cids pinned', async () => {
    const cids = [
      CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D'),
      CID.parse('QmWXShtJXt6Mw3FH7hVCQvR56xPcaEtSj4YFSGjp2QxA4v'),
    ]
    const lsResult = cids.map((cid) => ({ cid: cid, type: 'direct' }))
    const ls = jest.fn(() => asyncIterableFromArray(lsResult))
    const ipfs = {
      pin: {
        ls: ls,
      },
    } as unknown as IPFS
    const pinning = new IpfsPinning('ipfs+context', ipfs)
    pinning.open()
    const result = await pinning.ls()
    cids.forEach((cid) => {
      expect(result[cid.toString()]).toEqual([pinning.id])
    })
  })

  test('return empty array if no ipfs', async () => {
    const ipfs = null
    const pinning = new IpfsPinning('ipfs+context', ipfs)
    const result = await pinning.ls()
    expect(result).toEqual({})
  })
})

test('#id', async () => {
  const ipfs = {} as unknown as IPFS
  const pinning = new IpfsPinning('ipfs+context', ipfs)
  const id = pinning.id
  expect(id).toEqual('ipfs@KMzaB1J_CpotKvSIzMgcP7laSSnAV2VHux-9_jZ9oQs=')
})

test('#info', async () => {
  const ipfs = {} as unknown as IPFS
  const pinning = new IpfsPinning('ipfs+context', ipfs)
  const info = await pinning.info()
  expect(info).toEqual({
    'ipfs@KMzaB1J_CpotKvSIzMgcP7laSSnAV2VHux-9_jZ9oQs=': {},
  })
})
