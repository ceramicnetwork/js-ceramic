import CID from 'cids'
import {Resolver} from "did-resolver"
import dagCBOR from "ipld-dag-cbor"
import KeyDidResolver from 'key-did-resolver'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import {DID} from 'dids'
import { AnchorCommit, CeramicApi, Context, SignedCommitContainer, TestUtils } from '@ceramicnetwork/common';
import {TileDoctypeHandler} from "../tile-doctype-handler"
import {TileDoctype} from "@ceramicnetwork/doctype-tile";
import cloneDeep from 'lodash.clonedeep'
import * as sha256 from '@stablelib/sha256'
import * as uint8arrays from "uint8arrays";

jest.mock('did-jwt', () => ({
    // TODO - We should test for when this function throws as well
    verifyJWS: (): void => {
        return
    }
}))

const hash = (data: string): CID => new CID(1, 'sha2-256', uint8arrays.fromString('1220' + sha256.hash(uint8arrays.fromString(data)), 'base16'))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

const RECORDS = {
    genesis: {
        header: {tags: ['3id'], controllers: ['did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV']},
        data: {publicKeys: {test: '0xabc'}}
    },
    genesisGenerated: {
        jws: {
            payload: "bbbb",
            signatures: [
                {
                    protected: "eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ",
                    signature: "cccc"
                }
            ],
            link: new CID("bafyreig7dosektvux6a55mphri6piy3g5k4otxinanfevjeehix6rqfeym")
        },
        linkedBlock: {
            data: {
                publicKeys: {
                    test: "0xabc",
                },
            },
            header: {
                controllers: [
                    "did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV"
                ],
                "tags": [
                    "3id",
                ]
            },
        }
    },
    r1: {
        desiredContent: {publicKeys: {test: '0xabc'}, other: 'data'},
        record: {
            jws: {
                "payload": "bbbb",
                "signatures": [
                    {
                        "protected": "eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ",
                        "signature": "cccc"
                    }
                ],
                "link": "bafyreib2rxk3rybk3aobmv5cjuql3bm2twh4jo5uxgf5kpqcsgz7soitae"
            },
            payload: {
                "id": "bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu",
                "data": [
                    {
                        "op": "add",
                        "path": "/other",
                        "value": "data"
                    }
                ],
                "prev": "bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu",
                "header": {},
            }
        }
    },
    r2: {record: {proof: FAKE_CID_4}},
    proof: {
        blockNumber: 123456,
        blockTimestamp: 1615799679,
        chainId: 'fakechain:123',
    }
}

const serialize = (data: any): any => {
    if (Array.isArray(data)) {
        const serialized = []
        for (const item of data) {
            serialized.push(serialize(item))
        }
        return serialized
    }
    if (!CID.isCID(data) && typeof data === "object") {
        const serialized: Record<string, any> = {}
        for (const prop in data) {
            serialized[prop] = serialize(data[prop])
        }
        return serialized
    }
    if (CID.isCID(data)) {
        return data.toString()
    }
    return data
}

let did: DID
let tileDoctypeHandler: TileDoctypeHandler
let context: Context

beforeAll(() => {
    const recs: Record<string, any> = {}
    const ipfs = {
        dag: {
            put(rec: any, cid?: CID): any {
                if (cid) {
                    recs[cid.toString()] = {value: rec}
                    return cid
                }
                // stringify as a way of doing deep copy
                const clone = cloneDeep(rec)
                const c = hash(JSON.stringify(clone))
                recs[c.toString()] = {value: clone}
                return c
            },
            get(cid: any): any {
                return recs[cid.toString()]
            }
        }
    }

    const threeIdResolver = ThreeIdResolver.getResolver({
        loadDocument: (): any => {
            return Promise.resolve({
                content: {
                    "publicKeys": {
                        "signing": "zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV",
                        "encryption": "z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9"
                    }
                }
            })
        },
        createDocument: (): any => {
            return null
        },
    })

    const api = {
        getSupportedChains: jest.fn(async () => {
            return ["fakechain:123"]
        })
    }
    const keyDidResolver = KeyDidResolver.getResolver()
    const resolver = new Resolver({
        ...threeIdResolver, ...keyDidResolver
    })
    did = new DID({ resolver })
    did.createJWS = jest.fn(async () => {
        // fake jws
        return {
            payload: 'bbbb',
            signatures: [{
                protected: 'eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ',
                signature: 'cccc'
            }]
        }
    })
    did._id = 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'

    context = {
        did,
        ipfs,
        resolver,
        anchorService: null,
        api: api as unknown as CeramicApi,
    }
})

beforeEach(() => {
    tileDoctypeHandler = new TileDoctypeHandler()
})

it('is constructed correctly', async () => {
    expect(tileDoctypeHandler.name).toEqual('tile')
})

it('makes genesis record correctly', async () => {
    const record = await TileDoctype.makeGenesis({
        content: RECORDS.genesis.data,
        metadata: RECORDS.genesis.header,
        deterministic: true
    }, context) as SignedCommitContainer
    const {jws, linkedBlock} = record

    const payload = dagCBOR.util.deserialize(linkedBlock)
    const generated = {jws: serialize(jws), linkedBlock: serialize(payload)}
    expect(generated).toEqual(serialize(RECORDS.genesisGenerated))
})

it('applies genesis record correctly', async () => {
    const tileHandler = new TileDoctypeHandler()

    const record = await TileDoctype.makeGenesis({
        content: RECORDS.genesis.data,
        metadata: {controllers: [did.id], tags: ['3id']},
        deterministic: true,
    }, context) as SignedCommitContainer
    await context.ipfs.dag.put(record, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(record.linkedBlock)
    await context.ipfs.dag.put(payload, record.jws.link)

    const docState = await tileHandler.applyCommit(record.jws, FAKE_CID_1, context)
    expect(docState).toMatchSnapshot()
})

it('makes signed record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    await context.ipfs.dag.put(RECORDS.genesisGenerated.jws, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.genesisGenerated.linkedBlock, RECORDS.genesisGenerated.jws.link)

    const state = await tileDoctypeHandler.applyCommit(RECORDS.genesisGenerated.jws, FAKE_CID_1, context)
    const state$ = TestUtils.runningState(state)
    const doctype = new TileDoctype(state$, context)

    await expect(TileDoctype._makeCommit(doctype, null, RECORDS.r1.desiredContent)).rejects.toThrow(/No DID/)

    const record = await TileDoctype._makeCommit(doctype, did, RECORDS.r1.desiredContent) as SignedCommitContainer
    const {jws: rJws, linkedBlock: rLinkedBlock} = record
    const rPayload = dagCBOR.util.deserialize(rLinkedBlock)
    expect({jws: serialize(rJws), payload: serialize(rPayload)}).toEqual(RECORDS.r1.record)
})

it('applies signed record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({
        content: RECORDS.genesis.data,
        metadata: {controllers: [did.id], tags: ['3id']},
        deterministic: true,
    }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

    const state$ = TestUtils.runningState(state)
    const doctype = new TileDoctype(state$, context)
    const signedRecord = await TileDoctype._makeCommit(doctype, did, RECORDS.r1.desiredContent) as SignedCommitContainer

    await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

    // apply signed
    state = await tileDoctypeHandler.applyCommit(signedRecord.jws, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
})

it('throws error if record signed by wrong DID', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({
        content: RECORDS.genesis.data,
        metadata: {controllers: ['did:3:fake'], tags: ['3id']}
    }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    await expect(tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)).rejects.toThrow(/wrong DID/)
})

it('applies anchor record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({
        content: RECORDS.genesis.data,
        metadata: {controllers: [did.id], tags: ['3id']},
        deterministic: true,
    }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

    const state$ = TestUtils.runningState(state)
    const doctype = new TileDoctype(state$, context)
    const signedRecord = await TileDoctype._makeCommit(doctype, did, RECORDS.r1.desiredContent) as SignedCommitContainer

    await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

    // apply signed
    state = await tileDoctypeHandler.applyCommit(signedRecord.jws, FAKE_CID_2, context, state)

    await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)
    // apply anchor
    state = await tileDoctypeHandler.applyCommit(RECORDS.r2.record as AnchorCommit, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
})
