import CID from 'cids'

import dagCBOR from "ipld-dag-cbor"

import { DID } from 'dids'
import { Resolver } from "did-resolver"
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { TileDocumentHandler } from '../tile-document-handler'
import * as uint8arrays from "uint8arrays"
import * as sha256 from '@stablelib/sha256'
import cloneDeep from 'lodash.clonedeep'

import { TileDocument } from "@ceramicnetwork/stream-tile"
import {AnchorCommit, CeramicApi, Context, StreamUtils, SignedCommitContainer, TestUtils} from "@ceramicnetwork/common"

jest.mock('did-jwt', () => ({
    // TODO - We should test for when this function throws as well
    verifyJWS: (): void => { return }
}))



const hash = (data: string): CID => {
    const body = uint8arrays.concat([uint8arrays.fromString('1220', 'base16'), sha256.hash(uint8arrays.fromString(data))])
    return new CID(1, 'sha2-256', body)
}

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

// did:3:bafyasdfasdf

const RECORDS = {
    genesis: { header: { controllers: [ 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki' ] }, data: { much: 'data' } },
    genesisGenerated: {
        "jws": {
            "payload": "bbbb",
            "signatures": [
                {
                    "protected": "eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9",
                    "signature": "cccc"
                }
            ],
            "link": new CID("bafyreiau5pqllna6pewhp3w2hbvohxxeqsmffnwf6o2fwoln4ubbc6fldq")
        },
        "linkedBlock": {
            "data": {
                "much": "data"
            },
            "header": {
                "controllers": [
                    "did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki"
                ]
            },
        }
    },
    r1: {
        desiredContent: { much: 'data', very: 'content' },
        record: {
            "jws": {
                "payload": "bbbb",
                "signatures": [
                    {
                        "protected": "eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9",
                        "signature": "cccc"
                    }
                ],
                "link": "bafyreia6chsgnfihmdrl2d36llrfevc6xgmgzryi3ittdg3j5ohdifb7he"
            },
            "linkedPayload": {
                "id": "bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu",
                "data": [
                    {
                        "op": "add",
                        "path": "/very",
                        "value": "content"
                    }
                ],
                "prev": "bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu",
                "header": {},
            }
        }
    },
    r2: { record: { proof: FAKE_CID_4 } },
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

describe('TileDocumentHandler', () => {
    let did: DID;
    let tileDocumentHandler: TileDocumentHandler;
    let context: Context;

    beforeAll(() => {
        const recs: Record<string, any> = {}
        const ipfs = {
            dag: {
                put(rec: any, cid?: CID): any {
                    if (cid) {
                        recs[cid.toString()] = { value: rec }
                        return cid
                    }
                    // stringify as a way of doing deep copy
                    const clone = cloneDeep(rec)
                    const c = hash(JSON.stringify(clone))
                    recs[c.toString()] = { value: clone }
                    return c
                },
                get(cid: any): any {
                    return recs[cid.toString()]
                }
            }
        }

        const threeIdResolver = {
          '3': async (did) => ({
            didResolutionMetadata: { contentType: 'application/did+json' },
            didDocument: wrapDocument({
                  content: {
                      "publicKeys": {
                          "signing": "zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV",
                          "encryption": "z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9"
                      }
                  }
              }, did),
            didDocumentMetadata: {}
          })
        }

        const keyDidResolver = KeyDidResolver.getResolver()
        const resolver = new Resolver({
            ...threeIdResolver,
            ...keyDidResolver,
        })
        did = new DID({ resolver })
        did.createJWS = jest.fn(async () => {
            // fake jws
            return { payload: 'bbbb', signatures: [{ protected: 'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9', signature: 'cccc'}]}
        })
        did._id = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'
        const api = { getSupportedChains: jest.fn(async () => {return ["fakechain:123"]}), did }

        context = {
            did,
            ipfs: ipfs,
            anchorService: null,
            resolver,
            api: api as unknown as CeramicApi
        }
    })

    beforeEach(() => {
        tileDocumentHandler = new TileDocumentHandler()
    })

    it('is constructed correctly', async () => {
        expect(tileDocumentHandler.name).toEqual('tile')
    })

    it('makes genesis record correctly', async () => {
        const record = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data)
        expect(record).toBeDefined()

        const { jws, linkedBlock } = record as SignedCommitContainer
        expect(jws).toBeDefined()
        expect(linkedBlock).toBeDefined()

        const payload = dagCBOR.util.deserialize(linkedBlock)

        const serialized = { jws: serialize(jws), linkedBlock: serialize(payload)}

        // Add the 'unique' header field to the data used to generate the expected genesis record
        const genesis = cloneDeep(RECORDS.genesis)
        genesis.header['unique'] = serialized.linkedBlock.header.unique

        const expected = await did.createDagJWS(genesis)
        expect(expected).toBeDefined()

        const { jws: eJws, linkedBlock: eLinkedBlock } = expected
        const ePayload = dagCBOR.util.deserialize(eLinkedBlock)
        const signed = { jws: serialize(eJws), linkedBlock: serialize(ePayload)}

        expect(serialized).toEqual(signed)
    })

    it('throws error for deterministic genesis record with data', async () => {
        await expect(TileDocument.makeGenesis(context.api, RECORDS.genesis.data, { deterministic: true })).rejects.toThrow(/Initial content must be null/)
    })

    it('Does not sign commit if no content', async () => {
        const commit = await TileDocument.makeGenesis(context.api, null)
        expect(commit.header.controllers[0]).toEqual(did.id)
    })

    it('Takes controller from authenticated DID if controller not specified', async () => {
        const signedCommitWithContent = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data)
        const { jws, linkedBlock } = signedCommitWithContent as SignedCommitContainer
        expect(jws).toBeDefined()
        expect(linkedBlock).toBeDefined()

        const payload = dagCBOR.util.deserialize(linkedBlock)
        expect(payload.data).toEqual(RECORDS.genesis.data)
        expect(payload.header.controllers[0]).toEqual(did.id)

        const commitWithoutContent = await TileDocument.makeGenesis(context.api, null)
        expect(commitWithoutContent.data).toBeUndefined
        expect(commitWithoutContent.header.controllers[0]).toEqual(did.id)
    })

    it('throws if more than one controller', async () => {
        const record1Promised = TileDocument.makeGenesis(
            context.api,
            RECORDS.genesis.data,
            { controllers: [did.id, "did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV"],
              deterministic: true })
        await expect(record1Promised).rejects.toThrow(/Exactly one controller must be specified/)
    })

    it('creates genesis records uniquely by default', async () => {
        const record1 = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data)
        const record2 = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data)

        expect(record1).not.toEqual(record2)
    })

    it('creates genesis records deterministically if deterministic:true is specified', async () => {
        const metadata = { deterministic: true, controllers: ["a"], family: "family", tags: ["x", "y"] }
        const record1 = await TileDocument.makeGenesis(context.api, null, metadata)
        const record2 = await TileDocument.makeGenesis(context.api, null, metadata)

        expect(record1).toEqual(record2)
    })

    it('creates genesis records without DID if content is undefined', async () => {
        await expect(TileDocument.makeGenesis({} as CeramicApi, { foo: 'asdf' }, { controllers: [did.id] })).rejects.toThrow('No DID provided')
        const record1 = await TileDocument.makeGenesis({} as CeramicApi, null, { controllers: [did.id] })

        expect(record1).toBeDefined()
    })

    it('applies genesis record correctly', async () => {
        const tileHandler = new TileDocumentHandler()

        const record = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data) as SignedCommitContainer
        await context.ipfs.dag.put(record, FAKE_CID_1)

        const payload = dagCBOR.util.deserialize(record.linkedBlock)
        await context.ipfs.dag.put(payload, record.jws.link)

        const streamState = await tileHandler.applyCommit(record.jws, FAKE_CID_1, context)
        delete streamState.metadata.unique
        expect(streamState).toMatchSnapshot()
    })

    it('makes signed record correctly', async () => {
        const tileDocumentHandler = new TileDocumentHandler()

        await context.ipfs.dag.put(RECORDS.genesisGenerated.jws, FAKE_CID_1)

        await context.ipfs.dag.put(RECORDS.genesisGenerated.linkedBlock, RECORDS.genesisGenerated.jws.link)

        const state = await tileDocumentHandler.applyCommit(RECORDS.genesisGenerated.jws, FAKE_CID_1, context)
        const state$ = TestUtils.runningState(state)
        const doc = new TileDocument(state$, context)

        await expect(doc.makeCommit({} as CeramicApi, RECORDS.r1.desiredContent)).rejects.toThrow(/No DID/)

        const record = await doc.makeCommit(context.api, RECORDS.r1.desiredContent) as SignedCommitContainer
        const { jws: rJws, linkedBlock: rLinkedBlock} = record
        const rPayload = dagCBOR.util.deserialize(rLinkedBlock)
        expect({ jws: serialize(rJws), linkedPayload: serialize(rPayload)}).toEqual(RECORDS.r1.record)
    })

    it('applies signed record correctly', async () => {
        const tileDocumentHandler = new TileDocumentHandler()

        const genesisRecord = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data) as SignedCommitContainer
        await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

        const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
        await context.ipfs.dag.put(payload, genesisRecord.jws.link)

        // apply genesis
        let state = await tileDocumentHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

        const state$ = TestUtils.runningState(state)
        const doc = new TileDocument(state$, context)
        const signedRecord = await doc.makeCommit(context.api, RECORDS.r1.desiredContent) as SignedCommitContainer

        await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

        const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
        await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

        // apply signed
        state = await tileDocumentHandler.applyCommit(signedRecord.jws, FAKE_CID_2, context, state)
        delete state.metadata.unique
        delete state.next.metadata.unique
        expect(state).toMatchSnapshot()
    })

    it('multiple consecutive updates', async () => {
        const deepCopy = o => StreamUtils.deserializeState(StreamUtils.serializeState(o))
        const tileDocumentHandler = new TileDocumentHandler()

        const genesisRecord = await TileDocument.makeGenesis(context.api, { test: 'data' }) as SignedCommitContainer
        await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)
        const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
        await context.ipfs.dag.put(payload, genesisRecord.jws.link)
        // apply genesis
        const genesisState = await tileDocumentHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

        // make a first update
        const state$ = TestUtils.runningState(genesisState)
        let doc = new TileDocument(state$, context)
        const signedRecord1 = await doc.makeCommit(context.api, { other: { obj: 'content' } }) as SignedCommitContainer

        await context.ipfs.dag.put(signedRecord1, FAKE_CID_2)
        const sPayload1 = dagCBOR.util.deserialize(signedRecord1.linkedBlock)
        await context.ipfs.dag.put(sPayload1, signedRecord1.jws.link)
        // apply signed
        const state1 = await tileDocumentHandler.applyCommit(signedRecord1.jws, FAKE_CID_2, context, deepCopy(genesisState))

        // make a second update on top of the first
        const state1$ = TestUtils.runningState(state1)
        doc = new TileDocument(state1$, context)
        const signedRecord2 = await doc.makeCommit(context.api, { other: { obj2: 'fefe' } }) as SignedCommitContainer

        await context.ipfs.dag.put(signedRecord2, FAKE_CID_3)
        const sPayload2 = dagCBOR.util.deserialize(signedRecord2.linkedBlock)
        await context.ipfs.dag.put(sPayload2, signedRecord2.jws.link)

        // apply signed
        const state2 = await tileDocumentHandler.applyCommit(signedRecord2.jws, FAKE_CID_3, context, deepCopy(state1))
        delete state2.metadata.unique
        delete state2.next.metadata.unique
        expect(state2).toMatchSnapshot()
    })

    it('throws error if record signed by wrong DID', async () => {
        const tileDocumentHandler = new TileDocumentHandler()

        const genesisRecord = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data, { controllers: ['did:3:fake'] }) as SignedCommitContainer
        await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

        const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
        await context.ipfs.dag.put(payload, genesisRecord.jws.link)

        await expect(tileDocumentHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)).rejects.toThrow(/wrong DID/)
    })

    it('throws error if changes to more than one controller', async () => {
        const tileDocumentHandler = new TileDocumentHandler()

        const genesisRecord = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data, { controllers: [did.id] }) as SignedCommitContainer
        await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

        const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
        await context.ipfs.dag.put(payload, genesisRecord.jws.link)

        const state = await tileDocumentHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)
        const doc = new TileDocument(state, context)
        const makeCommit = doc.makeCommit(context.api, RECORDS.r1.desiredContent, { controllers: [did.id, did.id] })
        await expect(makeCommit).rejects.toThrow(/Exactly one controller must be specified/)
    })

    it('applies anchor record correctly', async () => {
        const tileDocumentHandler = new TileDocumentHandler()

        const genesisRecord = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data) as SignedCommitContainer
        await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

        const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
        await context.ipfs.dag.put(payload, genesisRecord.jws.link)

        // apply genesis
        let state = await tileDocumentHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

        const state$ = TestUtils.runningState(state)
        const doc = new TileDocument(state$, context)
        const signedRecord = await doc.makeCommit(context.api, RECORDS.r1.desiredContent) as SignedCommitContainer

        await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

        const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
        await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

        // apply signed
        state = await tileDocumentHandler.applyCommit(signedRecord.jws, FAKE_CID_2, context, state)

        await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)
        // apply anchor
        state = await tileDocumentHandler.applyCommit(RECORDS.r2.record as AnchorCommit, FAKE_CID_3, context, state)
        delete state.metadata.unique
        expect(state).toMatchSnapshot()
    })

    it('Does not apply anchor record on unsupported chain', async () => {
        const tileDocumentHandler = new TileDocumentHandler()

        const genesisRecord = await TileDocument.makeGenesis(context.api, RECORDS.genesis.data) as SignedCommitContainer
        await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

        const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
        await context.ipfs.dag.put(payload, genesisRecord.jws.link)

        // apply genesis
        const state = await tileDocumentHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

        // Create anchor proof with a different chainId than what's in the genesis record
        await context.ipfs.dag.put({ blockNumber: 123456, chainId: 'thewrongchain'}, FAKE_CID_4)
        // apply anchor
        await expect(tileDocumentHandler.applyCommit(RECORDS.r2.record as AnchorCommit, FAKE_CID_3, context, state))
            .rejects.toThrow("Anchor proof chainId 'thewrongchain' is not supported. Supported chains are: 'fakechain:123'")
    })
})
