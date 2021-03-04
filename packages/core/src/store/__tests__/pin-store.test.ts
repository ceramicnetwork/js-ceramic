import { PinStore } from "../pin-store";
import { StateStore } from "../state-store";
import CID from 'cids';
import { AnchorStatus, SignatureStatus, Doctype, PinningBackend, DocState, CommitType } from '@ceramicnetwork/common';

let stateStore: StateStore
let pinning: PinningBackend
const NETWORK = "fakeNetwork"

beforeEach(() => {
    stateStore = {
        open: jest.fn(),
        close: jest.fn(),
        list: jest.fn(),
        remove: jest.fn(),
        save: jest.fn(),
        load: jest.fn()
    }
    pinning = {
        id: 'test',
        open: jest.fn(),
        close: jest.fn(),
        pin: jest.fn(),
        unpin: jest.fn(),
        ls: jest.fn(),
        info: jest.fn()
    }
})

const state: DocState = {
    doctype: 'tile',
    content: {num: 0},
    metadata: {
        controllers: ['']
    },
    signature: SignatureStatus.GENESIS,
    anchorStatus: AnchorStatus.NOT_REQUESTED,
    log: [{ cid: new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D'), type: CommitType.GENESIS }]
}

class FakeType extends Doctype {
    change(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

test('#open', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn())
    pinStore.open(NETWORK)
    expect(stateStore.open).toBeCalledWith(NETWORK)
    expect(pinning.open).toBeCalled()
})

test('#close', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn())
    await pinStore.close()
    expect(stateStore.close).toBeCalled()
    expect(pinning.close).toBeCalled()
})

describe('#add', () => {
    test('save and pin', async () => {
        const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn())
        const document = new FakeType(state, {})
        await pinStore.add(document)
        expect(stateStore.save).toBeCalledWith(document)
        expect(pinning.pin).toBeCalledWith(state.log[0].cid)
        expect(pinning.pin).toBeCalledTimes(1)
    })

    test('save and pin proof without path', async () => {
        const stateWithProof = Object.assign(state, {
            log: [{ cid: new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')},
              { cid: new CID('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') }]
        })
        const proofCID = new CID('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR')
        const proofRootCID = new CID('QmNPqfxJDLPJFMhkUexLv431HNTfQBqh45unLg8ByBfa7h')
        const retrieve = jest.fn(async (cid) => {
            if (cid.equals(stateWithProof.log[1].cid)) {
                return {
                    proof: proofCID
                }
            }
        })
        const resolve = jest.fn(async (query: string) => {
            if (query === `${proofCID}/root`) {
                return proofRootCID
            }
        })
        const pinStore = new PinStore(stateStore, pinning, retrieve, resolve)
        const document = new FakeType(state, {})
        await pinStore.add(document)
        expect(stateStore.save).toBeCalledWith(document)
        expect(pinning.pin).toBeCalledWith(stateWithProof.log[0].cid)
        expect(pinning.pin).toBeCalledWith(stateWithProof.log[1].cid)
        expect(pinning.pin).toBeCalledWith(proofCID)
        expect(pinning.pin).toBeCalledWith(proofRootCID)
        expect(pinning.pin).toBeCalledTimes(4)
    })

    test('save and pin proof with path', async () => {
        const stateWithProof = Object.assign(state, {
          log: [{ cid: new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')},
            { cid: new CID('QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm') }]
        })
        const proofCID = new CID('QmbQDovX7wRe9ek7u6QXe9zgCXkTzoUSsTFJEkrYV1HrVR')
        const leftCID = new CID('QmdC5Hav9zdn2iS75reafXBq1PH4EnqUmoxwoxkS5QtuME')
        const rightCID = new CID('QmcyyLvDzCrduuvGVUQEh1DzFvM7UWGfc9sUg87PjjYCw7')
        const proofRootCID = new CID('QmNPqfxJDLPJFMhkUexLv431HNTfQBqh45unLg8ByBfa7h')
        const retrieve = jest.fn(async (cid) => {
            if (cid.equals(stateWithProof.log[1].cid)) {
                return {
                    proof: proofCID,
                    path: "L/R"
                }
            }
        })
        const resolve = jest.fn(async (query: string) => {
            if (query === `${proofCID}/root`) {
                return proofRootCID
            } else if (query === `${proofCID}/root/L`) {
                return leftCID
            } else if (query === `${proofCID}/root/L/R`) {
                return rightCID
            }
        })
        const pinStore = new PinStore(stateStore, pinning, retrieve, resolve)
        const document = new FakeType(state, {})
        await pinStore.add(document)
        expect(stateStore.save).toBeCalledWith(document)
        expect(pinning.pin).toBeCalledWith(stateWithProof.log[0].cid)
        expect(pinning.pin).toBeCalledWith(stateWithProof.log[1].cid)
        expect(pinning.pin).toBeCalledWith(proofCID)
        expect(pinning.pin).toBeCalledWith(proofRootCID)
        expect(pinning.pin).toBeCalledWith(leftCID)
        expect(pinning.pin).toBeCalledWith(rightCID)
        expect(pinning.pin).toBeCalledTimes(6)
    })
})

test('#rm', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn())
    const document = new FakeType(state, {})
    stateStore.load = jest.fn(async () => state)
    await pinStore.rm(document.id)
    expect(stateStore.remove).toBeCalledWith(document.id)
    expect(pinning.unpin).toBeCalledWith(state.log[0].cid)
})

test('#ls', async () => {
    const pinStore = new PinStore(stateStore, pinning, jest.fn(), jest.fn())
    const document = new FakeType(state, {})
    const list = ['1', '2', '3']
    stateStore.list = jest.fn(async () => list)
    const result = await pinStore.ls(document.id)
    expect(result).toEqual(list)
    expect(stateStore.list).toBeCalledWith(document.id)
})
