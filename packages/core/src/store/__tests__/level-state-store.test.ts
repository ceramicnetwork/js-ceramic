import tmp from 'tmp-promise'
import { LevelStateStore } from "../level-state-store";
import Level from "level-ts";
import { AnchorStatus, Doctype, CommitType, SignatureStatus, DoctypeUtils, TestUtils } from '@ceramicnetwork/common';
import CID from 'cids'
import DocID from '@ceramicnetwork/docid'

let mockStorage: Map<string, any>
const mockPut = jest.fn((id: string, state: any) => mockStorage.set(id, state))
let mockGet = jest.fn((id: string) => mockStorage.get(id))
const mockDel = jest.fn(() => Promise.resolve())
const mockStreamResult = ['1', '2', '3']
const mockStream = jest.fn(async () => mockStreamResult)

const docIdTest = 'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'

jest.mock('level-ts', () => {
    return jest.fn().mockImplementation(() => {
        return {
            put: mockPut,
            get: mockGet,
            del: mockDel,
            stream: mockStream
        }
    })
})

class FakeType extends Doctype {
    change(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

let levelPath: string
let stateStore: LevelStateStore
const NETWORK = "fakeNetwork"

beforeEach(async () => {
    mockStorage = new Map()
    levelPath = await tmp.tmpName()
    stateStore = new LevelStateStore(levelPath)
    mockGet = jest.fn((id: string) => mockStorage.get(id))
})

const state = {
    doctype: 'tile',
    content: {num: 0},
    metadata: {
        controllers: ['']
    },
    signature: SignatureStatus.GENESIS,
    anchorStatus: AnchorStatus.NOT_REQUESTED,
    log: [{ type: CommitType.GENESIS, cid: new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D') }]
}

test('#open', async () => {
    expect(Level).not.toBeCalled()
    expect(stateStore.store).toBeUndefined()
    stateStore.open(NETWORK)
    const expectedPath = levelPath + "/" + NETWORK
    expect(Level).toBeCalledWith(expectedPath)
})

test('#save and #load', async () => {
    const document = new FakeType(TestUtils.runningState(state), {})
    stateStore.open(NETWORK)
    await stateStore.save(document)
    const docId = document.id.baseID
    expect(mockPut).toBeCalledWith(docId.toString(), DoctypeUtils.serializeState(state))

    const retrieved = await stateStore.load(docId)
    expect(mockGet).toBeCalledWith(docId.toString())
    expect(retrieved).toEqual(state)
})

describe('#load', () => {
    test('#load not found', async () => {
        mockGet = jest.fn(() => { throw {notFound: true}})
        stateStore.open(NETWORK)
        const docid = DocID.fromString(docIdTest)
        const retrieved = await stateStore.load(docid)
        expect(retrieved).toBeNull()
    })

    test('#load passes errors', async () => {
        mockGet = jest.fn(() => { throw new Error('something internal to LevelDB')})
        stateStore.open(NETWORK)
        const docid = DocID.fromString(docIdTest)
        await expect(stateStore.load(docid)).rejects.toThrow('something internal to LevelDB')
    })
})

test('#remove', async () => {
    stateStore.open(NETWORK)
    const docid = DocID.fromString(docIdTest)
    await stateStore.remove(docid)
    expect(mockDel).toBeCalledWith(docid.toString())
})

describe('#list', () => {
    test('saved entries', async () => {
        stateStore.open(NETWORK)
        const list = await stateStore.list()
        expect(list).toEqual(mockStreamResult)
        expect(mockStream).toBeCalledWith({keys: true, values: false})
    })
    test('report if docId is saved', async () => {
        stateStore.open(NETWORK)
        stateStore.load = jest.fn(() => Promise.resolve(state))
        const docid = DocID.fromString(docIdTest)
        const list = await stateStore.list(docid)
        expect(list).toEqual([docid.toString()])
    })
    test('report if docId is absent', async () => {
        stateStore.open(NETWORK)
        stateStore.load = jest.fn(() => Promise.resolve(null))
        const docid = DocID.fromString(docIdTest)
        const list = await stateStore.list(docid)
        expect(list).toEqual([])
    })
})
