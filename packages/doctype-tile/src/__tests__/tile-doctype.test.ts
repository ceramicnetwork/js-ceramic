import CID from 'cids'

import dagCBOR from "ipld-dag-cbor"

import { DID } from 'dids'
import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from '@ceramicnetwork/key-did-resolver'
import { TileDoctypeHandler } from '../tile-doctype-handler'

import { TileDoctype } from "../tile-doctype"
import { Context } from "@ceramicnetwork/common"

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

const RECORDS = {
  genesis: { header: { controllers: [ 'did:3:bafyasdfasdf' ], chainId: 'fakechain:123' }, data: { much: 'data' }, unique: '0' },
  genesisGenerated: {
    "jws": {
      "payload": "bbbb",
      "signatures": [
        {
          "protected": "eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ",
          "signature": "cccc"
        }
      ],
      "link": "bafyreiau5pqllna6pewhp3w2hbvohxxeqsmffnwf6o2fwoln4ubbc6fldq"
    },
    "linkedBlock": {
      "data": {
        "much": "data"
      },
      "header": {
        "controllers": [
          "did:3:bafyasdfasdf"
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
            "protected": "eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ",
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
      return 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ.bbbb.cccc'
    })
    did._id = 'did:3:bafyasdfasdf'

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
      }
    })

    const api = {getSupportedChains: jest.fn(async () => {return ["fakechain:123"]})}
    const keyDidResolver = KeyDidResolver.getResolver()
    context = {
      did,
      ipfs: ipfs,
      anchorService: null,
      resolver: new Resolver({
        ...threeIdResolver,
        ...keyDidResolver,
      }),
      api
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

    const { jws, linkedBlock } = record1
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

  it('applies genesis record correctly', async () => {
    const tileHandler = new TileDoctypeHandler()

    const record = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context)
    await context.ipfs.dag.put(record, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(record.linkedBlock)
    await context.ipfs.dag.put(payload, record.jws.link)

    const docState = await tileHandler.applyRecord(record.jws, FAKE_CID_1, context)
    expect(docState).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    await context.ipfs.dag.put(RECORDS.genesisGenerated.jws, FAKE_CID_1)

    await context.ipfs.dag.put(RECORDS.genesisGenerated.linkedBlock, RECORDS.genesisGenerated.jws.link)

    const state = await tileDoctypeHandler.applyRecord(RECORDS.genesisGenerated.jws, FAKE_CID_1, context)
    const doctype = new TileDoctype(state, context)

    await expect(TileDoctype._makeRecord(doctype, null, RECORDS.r1.desiredContent)).rejects.toThrow(/No DID/)

    const record = await TileDoctype._makeRecord(doctype, did, RECORDS.r1.desiredContent)
    const { jws: rJws, linkedBlock: rLinkedBlock} = record
    const rPayload = dagCBOR.util.deserialize(rLinkedBlock)
    expect({ jws: serialize(rJws), linkedPayload: serialize(rPayload)}).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context)
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyRecord(genesisRecord.jws, FAKE_CID_1, context)

    const doctype = new TileDoctype(state, context)
    const signedRecord = await TileDoctype._makeRecord(doctype, did, RECORDS.r1.desiredContent)

    await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

    // apply signed
    state = await tileDoctypeHandler.applyRecord(signedRecord.jws, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
  })

  it('throws error if record signed by wrong DID', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: ['did:3:fake'] } }, context)
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    await expect(tileDoctypeHandler.applyRecord(genesisRecord.jws, FAKE_CID_1, context)).rejects.toThrow(/wrong DID/)
  })

  it('applies anchor record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context)
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    let state = await tileDoctypeHandler.applyRecord(genesisRecord.jws, FAKE_CID_1, context)

    const doctype = new TileDoctype(state, context)
    const signedRecord = await TileDoctype._makeRecord(doctype, did, RECORDS.r1.desiredContent)

    await context.ipfs.dag.put(signedRecord, FAKE_CID_2)

    const sPayload = dagCBOR.util.deserialize(signedRecord.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedRecord.jws.link)

    // apply signed
    state = await tileDoctypeHandler.applyRecord(signedRecord.jws, FAKE_CID_2, context, state)

    await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)
    // apply anchor
    state = await tileDoctypeHandler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
  })

  it('Does not apply anchor record on wrong chain', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { controllers: [did.id] } }, context)
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const payload = dagCBOR.util.deserialize(genesisRecord.linkedBlock)
    await context.ipfs.dag.put(payload, genesisRecord.jws.link)

    // apply genesis
    const state = await tileDoctypeHandler.applyRecord(genesisRecord.jws, FAKE_CID_1, context)

    // Create anchor proof with a different chainId than what's in the genesis record
    await context.ipfs.dag.put({ blockNumber: 123456, chainId: 'thewrongchain'}, FAKE_CID_4)
    // apply anchor
    await expect(tileDoctypeHandler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state))
        .rejects.toThrow("Anchor record with cid '" + FAKE_CID_3 + "' on tile document with DocID '" +
            FAKE_CID_1 + "' is on chain 'thewrongchain' but this document is configured to be anchored on chain 'fakechain:123'")
  })

})
