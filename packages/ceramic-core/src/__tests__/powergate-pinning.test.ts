import {JobStatus, PowergatePinning} from "../pinning/powergate-pinning";
import * as pow from "@textile/powergate-client"
import CID from "cids";

jest.mock('@textile/powergate-client')

const context = {
    ipfs: {
        dag: {
            get: jest.fn()
        }
    }
}

const token = 'FOO_TOKEN'
const connectionString = `powergate://example.com?token=${token}`

const setToken = jest.fn()
const defaultStorageConfig = jest.fn(() => ({something: 'something'}))
const pushStorageConfig = jest.fn(() => ({jobId: 'jobId'}))
const getStorageConfig = jest.fn(() => ({config: {hot: {something: 'something'}, cold: {something: 'something'}}}))
const remove = jest.fn()
const cancel = jest.fn()
const watchJobs = jest.fn((callback: any) => {
    setTimeout(() => {
        callback({
            errCause: null,
            status: JobStatus.JOB_STATUS_SUCCESS
        })
    }, 100)
    return cancel
})
const mockPow = {
    setToken: setToken,
    ffs: {
        defaultStorageConfig: defaultStorageConfig,
        pushStorageConfig: pushStorageConfig,
        getStorageConfig: getStorageConfig,
        remove: remove,
        watchJobs: watchJobs
    }
}

beforeEach(() => {
    jest.spyOn<any, any>(pow, 'createPow').mockImplementation(() => mockPow)
    jest.spyOn<any, any>(pow.ffsOptions, 'withStorageConfig').mockImplementation((any) => any)
    mockPow.ffs.remove.mockClear()
    mockPow.ffs.watchJobs = watchJobs
    mockPow.ffs.pushStorageConfig = pushStorageConfig
})

describe('constructor', () => {
    test('set Powergate endpoint from powergate:// URL', () => {
        const pinning = new PowergatePinning(connectionString, context)
        expect(pinning.endpoint).toEqual('http://example.com:5002')
        expect(pinning.token).toEqual(token)
    })
    test('set Powergate endpoint from powergate+http:// URL', () => {
        const pinning = new PowergatePinning(`powergate+http://example.com:3004?token=${token}`, context)
        expect(pinning.endpoint).toEqual('http://example.com:3004')
        expect(pinning.token).toEqual(token)
    })
    test('set Powergate endpoint from powergate+https:// URL', () => {
        const pinning = new PowergatePinning(`powergate+https://example.com?token=${token}`, context)
        expect(pinning.endpoint).toEqual('https://example.com:5002')
        expect(pinning.token).toEqual(token)
    })
});

test('#open', async () => {
    jest.spyOn<any, any>(pow, 'createPow').mockImplementation(() => mockPow)
    const pinning = new PowergatePinning(connectionString, context)
    expect(pinning.pow).toBeUndefined()
    await pinning.open()
    expect(pow.createPow).toBeCalledWith({host: pinning.endpoint})
    expect(setToken).toBeCalledWith(token)
    expect(pinning.pow).toBe(mockPow)
})

describe('#pin', () => {
    test('pin record', async () => {
        const pinning = new PowergatePinning(connectionString, context)
        await pinning.open()
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        await pinning.pin(cid)
        expect(mockPow.ffs.defaultStorageConfig).toBeCalled()
        expect(mockPow.ffs.pushStorageConfig).toBeCalledWith(cid.toString(), expect.anything())
    })

    test('tolerate double pinning as idempotent call', async () => {
        const pinning = new PowergatePinning(connectionString, context)
        await pinning.open()
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        mockPow.ffs.pushStorageConfig = jest.fn(() => {
            throw new Error('cid already pinned, consider using override flag')
        })
        await expect(pinning.pin(cid)).resolves.toBeUndefined()
        expect(mockPow.ffs.defaultStorageConfig).toBeCalled()
        expect(mockPow.ffs.pushStorageConfig).toBeCalledWith(cid.toString(), expect.anything())
    })

    test('throw if not double pinning', async () => {
        jest.spyOn<any, any>(pow, 'createPow').mockImplementation(() => mockPow)
        jest.spyOn<any, any>(pow.ffsOptions, 'withStorageConfig').mockImplementation((any) => any)
        const pinning = new PowergatePinning(connectionString, context)
        await pinning.open()
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        mockPow.ffs.pushStorageConfig = jest.fn(() => {
            throw new Error('something wrong')
        })
        await expect(pinning.pin(cid)).rejects.toThrow('something wrong')
        expect(mockPow.ffs.defaultStorageConfig).toBeCalled()
        expect(mockPow.ffs.pushStorageConfig).toBeCalledWith(cid.toString(), expect.anything())
    })
})

describe('#unpin', () => {
    test('remove from pin set', async () => {
        const pinning = new PowergatePinning(connectionString, context)
        await pinning.open()
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        await pinning.unpin(cid)
        expect(mockPow.ffs.remove).toBeCalledWith(cid.toString())
    })
    test('throw if job error', async () => {
        const pinning = new PowergatePinning(connectionString, context)
        await pinning.open()
        mockPow.ffs.watchJobs = jest.fn((callback: any) => {
            callback({
                errCause: 'SOMETHING'
            })
            return cancel
        })
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        await expect(pinning.unpin(cid)).rejects.toThrow()
        expect(mockPow.ffs.remove).not.toBeCalled()

    })
    test('throw if job cancelled', async () => {
        const pinning = new PowergatePinning(connectionString, context)
        await pinning.open()
        mockPow.ffs.watchJobs = jest.fn((callback: any) => {
            callback({
                status: JobStatus.JOB_STATUS_CANCELED
            })
            return cancel
        })
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        await expect(pinning.unpin(cid)).rejects.toThrow()
        expect(mockPow.ffs.remove).not.toBeCalled()
    })
    test('throw if job failed', async () => {
        const pinning = new PowergatePinning(connectionString, context)
        await pinning.open()
        mockPow.ffs.watchJobs = jest.fn((callback: any) => {
            callback({
                status: JobStatus.JOB_STATUS_FAILED
            })
            return cancel
        })
        const cid = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
        await expect(pinning.unpin(cid)).rejects.toThrow()
        expect(mockPow.ffs.remove).not.toBeCalled()
    })
})
