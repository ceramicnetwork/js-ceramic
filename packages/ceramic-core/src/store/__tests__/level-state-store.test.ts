import tmp from 'tmp-promise'
import {LevelStateStore} from "../level-state-store";
import Level from "level-ts";
import {AnchorStatus, Doctype, SignatureStatus} from "@ceramicnetwork/ceramic-common";
import CID from 'cids';
import {DoctypeUtils} from "@ceramicnetwork/ceramic-common/lib/index";
import _ from 'lodash'

let mockStorage: Map<string, any>
const mockPut = jest.fn((id: string, state: any) => mockStorage.set(id, state))
let mockGet = jest.fn((id: string) => mockStorage.get(id))
const mockDel = jest.fn((id: string) => Promise.resolve())
const mockStreamResult = ['1', '2', '3']
const mockStream = jest.fn(async () => mockStreamResult)

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

interface Params {
    num: number;
}

class FakeType extends Doctype {
    change(params: Params): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

let levelPath: string
let stateSore: LevelStateStore

beforeEach(async () => {
    mockStorage = new Map()
    levelPath = await tmp.tmpName()
    stateSore = new LevelStateStore(levelPath)
    mockGet = jest.fn((id: string) => mockStorage.get(id))
})

const state = {
    doctype: 'fake',
    content: {num: 0},
    metadata: {
        owners: ['']
    },
    signature: SignatureStatus.GENESIS,
    anchorStatus: AnchorStatus.NOT_REQUESTED,
    log: [new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')]
}

test('#open', async () => {
    expect(Level).not.toBeCalled()
    expect(stateSore.store).toBeUndefined()
    await stateSore.open()
    expect(Level).toBeCalledWith(levelPath)
})

test('#save and #load', async () => {
    const document = new FakeType(state, {})
    await stateSore.open()
    await stateSore.save(document)
    const docId = DoctypeUtils.getBaseDocId(DoctypeUtils.normalizeDocId(document.id))
    const storedState = {
        ...state,
        log: state.log.map(_.toString)
    }
    expect(mockPut).toBeCalledWith(docId, storedState)

    const retrieved = await stateSore.load(document.id)
    expect(mockGet).toBeCalledWith(docId)
    expect(retrieved).toEqual(state)
})

describe('#load', () => {
    test('#load not found', async () => {
        mockGet = jest.fn((id: string) => { throw {notFound: true}})
        await stateSore.open()
        const retrieved = await stateSore.load('ceramic://fooblah')
        expect(retrieved).toBeNull()
    })

    test('#load passes errors', async () => {
        mockGet = jest.fn((id: string) => { throw new Error('something internal to LevelDB')})
        await stateSore.open()
        await expect(stateSore.load('ceramic://fooblah')).rejects.toThrow('something internal to LevelDB')
    })
})

describe('#exists', () => {
    test('absent', async () => {
        await stateSore.open()
        const load = jest.spyOn(stateSore, 'load')
        await expect(stateSore.exists('ceramic://fooblah')).resolves.toBeFalsy()
        expect(load).toBeCalledWith('ceramic://fooblah')
    })

    test('present', async () => {
        await stateSore.open()
        stateSore.load = jest.fn(async () => state)
        await expect(stateSore.exists('ceramic://fooblah')).resolves.toBeTruthy()
        expect(stateSore.load).toBeCalledWith('ceramic://fooblah')
    })
})

describe('#remove', () => {
    test('absent', async () => {
        await stateSore.open()
        const exists = jest.spyOn(stateSore, 'exists').mockImplementation(async () => false)
        await stateSore.remove('ceramic://fooblah')
        expect(exists).toBeCalledWith('ceramic://fooblah')
        expect(mockDel).not.toBeCalled()
    })

    test('present', async () => {
        await stateSore.open()
        const exists = jest.spyOn(stateSore, 'exists').mockImplementation(async () => true)
        await stateSore.remove('ceramic://fooblah')
        expect(exists).toBeCalledWith('ceramic://fooblah')
        expect(mockDel).toBeCalledWith('ceramic://fooblah')
    })
})

describe('#list', () => {
    test('saved entries', async () => {
        await stateSore.open()
        const list = await stateSore.list()
        expect(list).toEqual(mockStreamResult)
        expect(mockStream).toBeCalledWith({keys: true, values: false})
    })
    test('report if docId is saved', async () => {
        await stateSore.open()
        stateSore.exists = jest.fn(() => Promise.resolve(true))
        const list = await stateSore.list('ceramic://doc-id')
        expect(list).toEqual(['ceramic://doc-id'])
    })
    test('report if docId is absent', async () => {
        await stateSore.open()
        stateSore.exists = jest.fn(() => Promise.resolve(false))
        const list = await stateSore.list('ceramic://doc-id')
        expect(list).toEqual([])
    })
})