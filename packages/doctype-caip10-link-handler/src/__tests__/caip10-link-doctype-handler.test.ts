import { Caip10LinkDoctypeHandler } from '../caip10-link-doctype-handler'

import cloneDeep from 'lodash.clonedeep'
import CID from 'cids'
import { Caip10LinkDoctype } from "@ceramicnetwork/doctype-caip10-link"
import { CeramicApi, CeramicCommit, Context, TestUtils } from '@ceramicnetwork/common';
import sha256 from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'

const digest = (input: string) => uint8arrays.toString(sha256.hash(uint8arrays.fromString(input)), 'base16')
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + digest(data), 'hex'))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_5 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlse')
const FAKE_CID_6 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjleu')
const FAKE_CID_7 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlwu')
const FAKE_CID_8 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam6bmye2pb54adnrtccjlwu')

const RECORDS = {
    genesis: { header: { controllers: [ '0x0544DcF4fcE959C6C4F3b7530190cB5E1BD67Cb8@eip155:1' ], family: "caip10-eip155:1" } },
    r1: {
        desiredContent: {
            version: 2,
            type: 'ethereum-eoa',
            message: 'Create a new account link to your identity.\n' + '\n' + 'did:3:testdid1 \n' + 'Timestamp: 1608116721',
            signature: '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e83078c907ccfaf9bd0de82bd5e57fe7884d9cb8a9303f5d92ea4df0d1c',
            account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
            timestamp: 1608116721
        },
        commit: {
            data: {
                version: 2,
                type: 'ethereum-eoa',
                message: 'Create a new account link to your identity.\n' + '\n' + 'did:3:testdid1 \n' + 'Timestamp: 1608116721',
                signature: '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e83078c907ccfaf9bd0de82bd5e57fe7884d9cb8a9303f5d92ea4df0d1c',
                account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
                timestamp: 1608116721
            },
            id: FAKE_CID_1,
            prev: FAKE_CID_1
        }
    },
    r2: { commit: { proof: FAKE_CID_4 } },
    proof: {
        value: {
            blockNumber: 123456,
            chainId: 'fakechain:123',
        }
    }
}

describe('Caip10LinkHandler', () => {
    let context: Context
    let handler: Caip10LinkDoctypeHandler

    beforeEach(() => {
        handler = new Caip10LinkDoctypeHandler()
        const recs: Record<string, any> = {}
        const ipfs = {
            dag: {
                put(rec: any, cid?: CID): any {
                    if (cid) {
                        recs[cid.toString()] = rec
                        return cid
                    }
                    // stringify as a way of doing deep copy
                    const clone = cloneDeep(rec)
                    const c = hash(JSON.stringify(clone))
                    recs[c.toString()] = clone
                    return c
                },
                get(cid: any): any {
                    return recs[cid.toString()]
                }
            }
        }

        const api = {getSupportedChains: jest.fn(async () => {return ["fakechain:123"]})}
        context = {
            ipfs: ipfs,
            anchorService: null,
            api: api as unknown as CeramicApi,
        }
    })

    it('is constructed correctly', async () => {
        expect(handler.name).toEqual('caip10-link')
    })

    it('makes genesis record correctly', async () => {
        const record = await Caip10LinkDoctype.makeGenesis({ content: undefined, metadata: RECORDS.genesis.header }, context)
        expect(record).toEqual(RECORDS.genesis)
    })

    it('throws an error if genesis record has content', async () => {
        const content = {}
        await expect(Caip10LinkDoctype.makeGenesis({ content }, context)).rejects.toThrow(/Cannot have content/i)
    })

    it('throws an error if genesis record has no metadata specified', async () => {
        const content: any = undefined
        const controllers: any = undefined
        await expect(Caip10LinkDoctype.makeGenesis({ content, controllers }, context)).rejects.toThrow(/Metadata must be specified/i)
    })

    it('throws an error if genesis record has no controllers specified', async () => {
        const content: any = undefined
        await expect(Caip10LinkDoctype.makeGenesis({ content, metadata: {} }, context)).rejects.toThrow(/Exactly one controller must be specified/i)
    })

    it('throws an error if genesis record has more than one controller', async () => {
        const content: any = undefined
        const controllers = [...RECORDS.genesis.header.controllers, '0x25954ef14cebbc9af3d79876489a9cfe87043f20@eip155:1']
        await expect(Caip10LinkDoctype.makeGenesis({ content, metadata: { controllers } }, context)).rejects.toThrow(/Exactly one controller must be specified/i)
    })

    it('throws an error if genesis record has controller not in CAIP-10 format', async () => {
        const content: any = undefined
        const controllers = RECORDS.genesis.header.controllers.map(address => address.split('@')[0])
        await expect(Caip10LinkDoctype.makeGenesis({ content, metadata: { controllers } }, context)).rejects.toThrow(/According to CAIP-10/i)
    })

    it('applies genesis record correctly', async () => {
        const state = await handler.applyCommit(RECORDS.genesis, FAKE_CID_1, context)
        expect(state).toMatchSnapshot()
    })

    it('makes signed record correctly', async () => {
        const state = await handler.applyCommit(RECORDS.genesis, FAKE_CID_1, context)
        const state$ = TestUtils.runningState(state)
        const doctype = new Caip10LinkDoctype(state$, context)
        const record = await Caip10LinkDoctype._makeCommit(doctype, RECORDS.r1.desiredContent)
        // Have to compare the 'id' and 'prev' CIDs manually (with toString()) otherwise jest gets
        // confused by Symbol(@ipld/js-cid/CID)
        expect(record.data).toEqual(RECORDS.r1.commit.data)
        expect(record.id.toString()).toEqual(RECORDS.r1.commit.id.toString())
        expect(record.prev.toString()).toEqual(RECORDS.r1.commit.prev.toString())
    })

    it('applies signed record correctly', async () => {
        let state = await handler.applyCommit(RECORDS.genesis, FAKE_CID_1, context)
        state = await handler.applyCommit(RECORDS.r1.commit, FAKE_CID_2, context, state)
        expect(state).toMatchSnapshot()
    })

    it('throws an error of the proof is invalid', async () => {
        const badRecord = cloneDeep(RECORDS.r1.commit)
        badRecord.data.signature = '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e8302348762387462387648726346877884d9cb8a9303f5d92ea4df0d1c'
        const state = await handler.applyCommit(RECORDS.genesis, FAKE_CID_1, context)
        await expect(handler.applyCommit(badRecord, FAKE_CID_2, context, state)).rejects.toThrow(/Invalid proof/i)
    })

    it('throws an error of the proof doesn\'t match the controller', async () => {
        const badAddressGenesis = cloneDeep(RECORDS.genesis)
        badAddressGenesis.header.controllers = ['0xffffffffffffffffffffffffffffffffffffffff@eip155:1']
        const state = await handler.applyCommit(badAddressGenesis, FAKE_CID_1, context)
        await expect(handler.applyCommit(RECORDS.r1.commit, FAKE_CID_2, context, state)).rejects.toThrow(/Address doesn't match/i)
    })

    it('applies anchor record correctly', async () => {
        // create signed record
        await context.ipfs.dag.put(RECORDS.r1.commit, FAKE_CID_2)
        // create anchor record
        await context.ipfs.dag.put(RECORDS.r2.commit, FAKE_CID_3)
        // create anchor proof
        await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)

        // Apply genesis
        let state = await handler.applyCommit(RECORDS.genesis, FAKE_CID_1, context)
        // Apply signed record
        state = await handler.applyCommit(RECORDS.r1.commit, FAKE_CID_2, context, state)
        // Apply anchor record
        state = await handler.applyCommit(RECORDS.r2.commit as unknown as CeramicCommit, FAKE_CID_3, context, state)
        expect(state).toMatchSnapshot()
    })

    it('Does not apply anchor record on unsupported chain', async () => {
        // create signed record
        await context.ipfs.dag.put(RECORDS.r1.commit, FAKE_CID_2)
        // create anchor record
        await context.ipfs.dag.put(RECORDS.r2.commit, FAKE_CID_3)
        // create anchor proof with a different chainId than what's in the genesis record
        await context.ipfs.dag.put({value: { blockNumber: 123456, chainId: 'thewrongchain'}}, FAKE_CID_4)

        // Apply genesis
        let state = await handler.applyCommit(RECORDS.genesis, FAKE_CID_1, context)
        // Apply signed record
        state = await handler.applyCommit(RECORDS.r1.commit, FAKE_CID_2, context, state)
        // Apply anchor record
        await expect(handler.applyCommit(RECORDS.r2.commit as unknown as CeramicCommit, FAKE_CID_3, context, state))
            .rejects.toThrow("Anchor proof chainId 'thewrongchain' is not supported. Supported chains are: 'fakechain:123'")
    })

    it('Should not allow replay attack', async () => {
        const records = {
            genesis: { header: { controllers: [ '0x0544DcF4fcE959C6C4F3b7530190cB5E1BD67Cb8@eip155:1' ], family: "caip10-eip155:1" } },
            r1: {
                data: {
                    version: 2,
                    type: 'ethereum-eoa',
                    message: 'Create a new account link to your identity.\n' + '\n' + 'did:3:testdid1 \n' + 'Timestamp: 1608116721',
                    signature: '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e83078c907ccfaf9bd0de82bd5e57fe7884d9cb8a9303f5d92ea4df0d1c',
                    account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
                    timestamp: 1608116721
                },
                id: FAKE_CID_1,
                prev: FAKE_CID_1
            },
            r2: { proof: FAKE_CID_4 },
            r2proof: {
                value: {
                    blockNumber: 123456,
                    blockTimestamp: 1608116723,
                    chainId: 'fakechain:123',
                }
            },
            r3: {
                data: {
                    version: 2,
                    type: 'ethereum-eoa',
                    message: 'Create a new account link to your identity.\n' + '\n' + 'did:3:testdid2 \n' + 'Timestamp: 1608116725',
                    signature: '0xe1bcc3f3b67ae303cb95db9d2d266f95984fd76bf3a4452dbb64ad4d3941998f4cb37f85197c74f9fb5cdf33e9042949a5452a204db2d48d85929406f64aac811b',
                    account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
                    timestamp: 1608116725
                },
                id: FAKE_CID_1,
                prev: FAKE_CID_3
            },
            r4: { proof: FAKE_CID_7 },
            r4proof: {
                value: {
                    blockNumber: 123456,
                    blockTimestamp: 1608116727,
                    chainId: 'fakechain:123',
                }
            }
        }
        await context.ipfs.dag.put(records.r2proof, FAKE_CID_4)
        await context.ipfs.dag.put(records.r4proof, FAKE_CID_7)

        let state = await handler.applyCommit(records.genesis, FAKE_CID_1, context)
        state = await handler.applyCommit(records.r1, FAKE_CID_2, context, state)
        state = await handler.applyCommit(records.r2 as unknown as CeramicCommit, FAKE_CID_3, context, state)
        expect(state.content).toEqual('did:3:testdid1')
        state = await handler.applyCommit(records.r3, FAKE_CID_5, context, state)

        // create a fake update based on the r1 data to try a replay attack
        const r4 = {
            data: records.r1.data,
            id: FAKE_CID_1,
            prev: FAKE_CID_5
        }
        await expect(handler.applyCommit(r4, FAKE_CID_8, context, state)).rejects.toThrow('Invalid commit, proof timestamp too old')

        state = await handler.applyCommit(records.r4 as unknown as CeramicCommit, FAKE_CID_6, context, state)
        expect(state.content).toEqual('did:3:testdid2')

        // create a fake update based on the r1 data to try a replay attack
        const r5 = {
            data: records.r1.data,
            id: FAKE_CID_1,
            prev: FAKE_CID_6
        }
        await expect(handler.applyCommit(r5, FAKE_CID_8, context, state)).rejects.toThrow('Invalid commit, proof timestamp too old')
    })
})
