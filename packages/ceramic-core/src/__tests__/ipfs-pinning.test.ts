import {IpfsPinning} from "../pinning/ipfs-pinning";
import ipfsClient from 'ipfs-http-client'
import CID from 'cids'

jest.mock('ipfs-http-client')

beforeEach(() => {
    ipfsClient.mockClear();
});

describe('constructor', () => {
    test('set IPFS address to __context if ipfs+context scheme', () => {
        const pinning = new IpfsPinning('ipfs+context://', {})
        expect(pinning.ipfsAddress).toEqual('__context')
    })
    test('set IPFS address to __context if ipfs+context string', () => {
        const pinning = new IpfsPinning('ipfs+context', {})
        expect(pinning.ipfsAddress).toEqual('__context')
    })
    test('set IPFS address from ipfs+http protocol', () => {
        const pinning = new IpfsPinning('ipfs+http://example.com', {})
        expect(pinning.ipfsAddress).toEqual('http://example.com:5001')
    })
    test('set IPFS address from ipfs+https protocol', () => {
        const pinning = new IpfsPinning('ipfs+https://example.com', {})
        expect(pinning.ipfsAddress).toEqual('https://example.com:5001')
    })
});

describe('#open', () => {
    test('use IPFS from context if __context', async () => {
        const context = {ipfs: jest.fn()}
        const pinning = new IpfsPinning('ipfs+context', context)
        await pinning.open()
        expect(pinning.ipfs).toBe(context.ipfs)
    })
    test('use IPFS client pointed to #ipfsAddress', async () => {
        const pinning = new IpfsPinning('ipfs+https://example.com', {})
        await pinning.open()
        expect(ipfsClient).toBeCalledWith('https://example.com:5001')
    })
})

describe('#pin', () => {
    test('call ipfs instance', async () => {
        const add = jest.fn()
        const context = {
            ipfs: {
                pin: {
                    add: add
                }
            }
        }
        const pinning = new IpfsPinning('ipfs+context', context)
        await pinning.open()
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        await pinning.pin(cid)
        expect(add).toBeCalledWith(cid, {recursive: false})
    })
})

describe('#unpin', () => {
    test('call ipfs instance', async () => {
        const rm = jest.fn()
        const context = {
            ipfs: {
                pin: {
                    rm: rm
                }
            }
        }
        const pinning = new IpfsPinning('ipfs+context', context)
        await pinning.open()
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        await pinning.unpin(cid)
        expect(rm).toBeCalledWith(cid)
    })
})
