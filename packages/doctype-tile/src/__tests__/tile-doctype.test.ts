import CID from 'cids'

import dagCBOR from "ipld-dag-cbor"

import { DID } from 'dids'
import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { TileDoctypeHandler } from '../tile-doctype-handler'

import { TileDoctype } from "../tile-doctype"
import {AnchorCommit, CeramicApi, Context, DoctypeUtils, SignedCommitContainer} from "@ceramicnetwork/common"

jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWS: (): void => { return }
}))

const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

// did:3:bafyasdfasdf

const RECORDS = {
  genesis: { header: { controllers: [ 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki' ] }, data: { much: 'data' }, unique: '0' },
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
      "unique": "0",
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

describe('TileDoctypeHandler', () => {
  let did: DID;
  let tileDoctypeHandler: TileDoctypeHandler;
  let context: Context;

  beforeAll(() => {
    did = new DID()
    did.createJWS = jest.fn(async () => {
      // fake jws
      return { payload: 'bbbb', signatures: [{ protected: 'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9', signature: 'cccc'}]}
    })
    did._id = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'

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
      createDocument: (): any => { return null }
    })

    const api = { getSupportedChains: jest.fn(async () => {return ["fakechain:123"]}) }
    const keyDidResolver = KeyDidResolver.getResolver()
    context = {
      did,
      ipfs: ipfs,
      anchorService: null,
      resolver: new Resolver({
        ...threeIdResolver,
        ...keyDidResolver,
      }),
      api: api as unknown as CeramicApi
    }
  })

  beforeEach(() => {
    tileDoctypeHandler = new TileDoctypeHandler()
  })

  it('is constructed correctly', async () => {
    expect(tileDoctypeHandler.name).toEqual('tile')
  })

  it('makes genesis record correctly', async () => {
    const record1 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] }, deterministic: true }, context)
    expect(record1).toBeDefined()

    const { jws, linkedBlock } = record1 as SignedCommitContainer
    expect(jws).toBeDefined()
    expect(linkedBlock).toBeDefined()

    const payload = dagCBOR.util.deserialize(linkedBlock)

    const serialized = { jws: serialize(jws), linkedBlock: serialize(payload)}

    const expected1 = await did.createDagJWS(RECORDS.genesis)
    expect(expected1).toBeDefined()

    const { jws: eJws, linkedBlock: eLinkedBlock } = expected1
    const ePayload = dagCBOR.util.deserialize(eLinkedBlock)
    const signed = { jws: serialize(eJws), linkedBlock: serialize(ePayload)}

    expect(serialized).toEqual(signed)
  })

  it('creates genesis records uniquely by default', async () => {
    const record1 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context)
    const record2 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context)

    expect(record1).not.toEqual(record2)
  })

  it('creates genesis records deterministically if deterministic:true is specified', async () => {
    const record1 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] }, deterministic: true }, context)
    const record2 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] }, deterministic: true }, context )

    expect(record1).toEqual(record2)
  })

  it('creates genesis records without DID if content is undefined', async () => {
    expect(TileDoctype.makeGenesis({ content: 'asdf', metadata: { controllers: [did.id] } }, {})).rejects.toThrow('No DID authenticated')
    const record1 = await TileDoctype.makeGenesis({ metadata: { controllers: [did.id] } }, {})

    expect(record1).toBeDefined()
  })

  it('applies genesis record correctly', async () => {
    const tileHandler = new TileDoctypeHandler()

    const record = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context) as SignedCommitContainer
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
    const doctype = new TileDoctype(state, context)

    await expect(TileDoctype._makeCommit(doctype, null, RECORDS.r1.desiredContent)).rejects.toThrow(/No DID/)

    const record = await TileDoctype._makeCommit(doctype, did, RECORDS.r1.desiredContent) as SignedCommitContainer
    const { jws: rJws, linkedBlock: rLinkedBlock} = record
    const rPayload = dagCBOR.util.deserialize(rLinkedBlock)
    expect({ jws: serialize(rJws), linkedPayload: serialize(rPayload)}).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

    const doctype = new TileDoctype(state, context)
    const signedRecord = await TileDoctype._makeCommit(doctype, did, RECORDS.r1.desiredContent) as SignedCommitContainer

    await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

    // apply signed
    state = await tileDoctypeHandler.applyCommit(signedRecord.jws, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
  })

  it('multiple consecutive updates', async () => {
    const deepCopy = o => DoctypeUtils.deserializeState(DoctypeUtils.serializeState(o))
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: { test: 'data' }, metadata: { controllers: [did.id] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)
    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)
    // apply genesis
    const genesisState = await tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

    // make a first update
    let doctype = new TileDoctype(genesisState, context)
    const signedRecord1 = await TileDoctype._makeCommit(doctype, did, { other: { obj: 'content' } }, null, "a new schema") as SignedCommitContainer

    await context.ipfs.dag.put(signedRecord1, FAKE_CID_2)
    const sPayload1 = dagCBOR.util.deserialize(signedRecord1.linkedBlock)
    await context.ipfs.dag.put(sPayload1, signedRecord1.jws.link)
    // apply signed
    const state1 = await tileDoctypeHandler.applyCommit(signedRecord1.jws, FAKE_CID_2, context, deepCopy(genesisState))

    // make a second update on top of the first
    doctype = new TileDoctype(state1, context)
    const signedRecord2 = await TileDoctype._makeCommit(doctype, did, { other: { obj2: 'fefe' } }) as SignedCommitContainer

    await context.ipfs.dag.put(signedRecord2, FAKE_CID_3)
    const sPayload2 = dagCBOR.util.deserialize(signedRecord2.linkedBlock)
    await context.ipfs.dag.put(sPayload2, signedRecord2.jws.link)

    // apply signed
    const state2 = await tileDoctypeHandler.applyCommit(signedRecord2.jws, FAKE_CID_3, context, deepCopy(state1))

    expect(state2).toMatchSnapshot()
  })

  it('throws error if record signed by wrong DID', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: ['did:3:fake'] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    await expect(tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)).rejects.toThrow(/wrong DID/)
  })

  it('applies anchor record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

    const doctype = new TileDoctype(state, context)
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

  it('Does not apply anchor record on unsupported chain', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context) as SignedCommitContainer
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    const state = await tileDoctypeHandler.applyCommit(genesisRecord.jws, FAKE_CID_1, context)

    // Create anchor proof with a different chainId than what's in the genesis record
    await context.ipfs.dag.put({ blockNumber: 123456, chainId: 'thewrongchain'}, FAKE_CID_4)
    // apply anchor
    await expect(tileDoctypeHandler.applyCommit(RECORDS.r2.record as AnchorCommit, FAKE_CID_3, context, state))
        .rejects.toThrow("Anchor proof chainId 'thewrongchain' is not supported. Supported chains are: 'fakechain:123'")
  })
})
