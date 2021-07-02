import CID from 'cids'
import {Resolver} from "did-resolver"
import dagCBOR from "ipld-dag-cbor"
import KeyDidResolver from 'key-did-resolver'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import {DID} from 'dids'
import { AnchorCommit, CeramicApi, Context, SignedCommitContainer, TestUtils } from '@ceramicnetwork/common';
import {TileDocumentHandler} from "../tile-document-handler"
import {TileDocument} from "@ceramicnetwork/stream-tile";
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
let tileDocumentHandler: TileDocumentHandler
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
        loadStream: (): any => {
            return Promise.resolve({
                content: {
                    "publicKeys": {
                        "signing": "zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV",
                        "encryption": "z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9"
                    }
                }
            })
        },
    } as any as CeramicApi)

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
    const api = {
        getSupportedChains: jest.fn(async () => {
            return ["fakechain:123"]
        }),
        did,
    }

    context = {
        did,
        ipfs,
        resolver,
        anchorService: null,
        api: api as unknown as CeramicApi,
    }
})

beforeEach(() => {
    tileDocumentHandler = new TileDocumentHandler()
})

it('is constructed correctly', async () => {
    expect(tileDocumentHandler.name).toEqual('tile')
})

it('makes genesis record correctly', async () => {
    const record = await TileDocument.makeGenesis(
        context.api,
        RECORDS.genesis.data,
        {...RECORDS.genesis.header}) as SignedCommitContainer
    const {jws, linkedBlock} = record

    const payload = dagCBOR.util.deserialize(linkedBlock)
    const generated = {jws: serialize(jws), linkedBlock: serialize(payload)}

    // Add the 'unique' header field to the data used to generate the expected genesis record
    const genesis = cloneDeep(RECORDS.genesis)
    genesis.header['unique'] = generated.linkedBlock.header.unique

    const expected = await did.createDagJWS(genesis)
    expect(expected).toBeDefined()

    const { jws: eJws, linkedBlock: eLinkedBlock } = expected
    const ePayload = dagCBOR.util.deserialize(eLinkedBlock)
    const signed = { jws: serialize(eJws), linkedBlock: serialize(ePayload)}

    expect(generated).toEqual(serialize(signed))
})

it('applies genesis record correctly', async () => {
    const tileHandler = new TileDocumentHandler()

    const record = await TileDocument.makeGenesis(
        context.api,
        RECORDS.genesis.data,
        { controllers: [did.id], tags: ['3id'] }) as SignedCommitContainer
    await context.ipfs.dag.put(record, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(record.linkedBlock)
    await context.ipfs.dag.put(payload, record.jws.link)

    const streamState = await tileHandler.applyCommit(record.jws, { cid: FAKE_CID_1 }, context)
    delete streamState.metadata.unique
    expect(streamState).toMatchSnapshot()
})

it('makes signed record correctly', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    await context.ipfs.dag.put(RECORDS.genesisGenerated.jws, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.genesisGenerated.linkedBlock, RECORDS.genesisGenerated.jws.link)

    const state = await tileDocumentHandler.applyCommit(RECORDS.genesisGenerated.jws, { cid: FAKE_CID_1 }, context)
    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)

    await expect(doc.makeCommit({} as CeramicApi, RECORDS.r1.desiredContent)).rejects.toThrow(/No DID/)

    const record = await doc.makeCommit(context.api, RECORDS.r1.desiredContent) as SignedCommitContainer
    const {jws: rJws, linkedBlock: rLinkedBlock} = record
    const rPayload = dagCBOR.util.deserialize(rLinkedBlock)
    expect({jws: serialize(rJws), payload: serialize(rPayload)}).toEqual(RECORDS.r1.record)
})

it('applies signed record correctly', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisRecord = await TileDocument.makeGenesis(
        context.api,
        RECORDS.genesis.data,
        { controllers: [did.id], tags: ['3id'] }) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDocumentHandler.applyCommit(genesisRecord.jws, { cid: FAKE_CID_1 }, context)

    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)
    const signedRecord = await doc.makeCommit(context.api, RECORDS.r1.desiredContent) as SignedCommitContainer

    await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

    // apply signed
    state = await tileDocumentHandler.applyCommit(signedRecord.jws, {cid: FAKE_CID_2}, context, state)
    delete state.metadata.unique
    delete state.next.metadata.unique
    expect(state).toMatchSnapshot()
})

it('throws error if record signed by wrong DID', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisRecord = await TileDocument.makeGenesis(
        context.api,
        RECORDS.genesis.data,
        { controllers: ['did:3:fake'], tags: ['3id'] }) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    await expect(tileDocumentHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)).rejects.toThrow(/wrong DID/)
})

it('applies anchor record correctly', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisRecord = await TileDocument.makeGenesis(
        context.api,
        RECORDS.genesis.data,
        { controllers: [did.id], tags: ['3id'] }) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDocumentHandler.applyCommit(genesisRecord.jws, { cid: FAKE_CID_1 }, context)

    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)
    const signedRecord = await doc.makeCommit(context.api, RECORDS.r1.desiredContent) as SignedCommitContainer

    await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

    // apply signed
    state = await tileDocumentHandler.applyCommit(signedRecord.jws, { cid: FAKE_CID_2 }, context, state)

    await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)
    // apply anchor
    state = await tileDocumentHandler.applyCommit(RECORDS.r2.record as AnchorCommit, { cid: FAKE_CID_3 }, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
})
