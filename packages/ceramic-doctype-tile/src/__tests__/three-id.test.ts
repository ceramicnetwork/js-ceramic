import CID from 'cids'

import { Resolver } from "did-resolver"

import dagCBOR from "ipld-dag-cbor"

import KeyDidResolver from '@ceramicnetwork/key-did-resolver'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

import { DID } from 'dids'

import { Context } from "@ceramicnetwork/ceramic-common"
import { TileDoctypeHandler } from "../tile-doctype-handler"
import { TileDoctype } from "../tile-doctype"
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
  genesis: { doctype: 'tile', header: { tags: ['3id'], owners: [ 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV' ] }, data: { publicKeys: { test: '0xabc' } } },
  r1: {
    desiredContent: { publicKeys: { test: '0xabc' }, other: 'data' },
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
        "header": {}
      }
    }
  },
  r2: { record: { proof: FAKE_CID_4 } },
  proof: {
    value: {
      blockNumber: 123456
    }
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

describe('ThreeIdHandler', () => {
  let did: DID
  let tileDoctypeHandler: TileDoctypeHandler
  let context: Context

  beforeAll(() => {
    did = new DID()
    did.createJWS = jest.fn(async () => {
      // fake jws
      return 'eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ.bbbb.cccc'
    })
    did._id = 'did:3:bafyasdfasdf'

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

    const keyDidResolver = KeyDidResolver.getResolver()
    context = {
      did,
      ipfs,
      resolver: new Resolver({
        ...threeIdResolver, ...keyDidResolver
      }),
      anchorService: null,
    }
  })

  beforeEach(() => {
    tileDoctypeHandler = new TileDoctypeHandler()
  })

  it('is constructed correctly', async () => {
    expect(tileDoctypeHandler.name).toEqual('tile')
  })

  it('makes genesis record correctly', async () => {
    const record = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: RECORDS.genesis.header }, context)
    expect(record).toEqual(RECORDS.genesis)
  })

  it('applies genesis record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)

    const state = await tileDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    expect(state).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)

    const state = await tileDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    const doctype = new TileDoctype(state, context)

    await expect(TileDoctype._makeRecord(doctype, null, RECORDS.r1.desiredContent)).rejects.toThrow(/No DID/)
    const record = await TileDoctype._makeRecord(doctype, did, RECORDS.r1.desiredContent)
    expect(record).toBeDefined()

    const { jws, linkedBlock } = record
    expect(jws).toBeDefined()
    expect(linkedBlock).toBeDefined()

    const payload = dagCBOR.util.deserialize(linkedBlock)
    expect({ jws: serialize(jws), payload: serialize(payload)}).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)

    let state = await tileDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    const doctype = new TileDoctype(state, context)
    const record = await TileDoctype._makeRecord(doctype, did, RECORDS.r1.desiredContent)

    const payload = dagCBOR.util.deserialize(record.linkedBlock)
    await context.ipfs.dag.put({ value: payload }, record.jws.link)

    state = await tileDoctypeHandler.applyRecord(record.jws, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
  })

  it('throws error if record signed by wrong DID', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)

    const genesisRecord = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { owners: ['did:3:fake'], tags: ['3id'] } }, context)
    await context.ipfs.dag.put(genesisRecord, FAKE_CID_1)

    const state = await tileDoctypeHandler.applyRecord(genesisRecord, FAKE_CID_1, context)
    await expect(tileDoctypeHandler.applyRecord(RECORDS.r1.record.jws, FAKE_CID_2, context, state)).rejects.toThrow(/wrong DID/)
  })

  it('applies anchor record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)

    let state = await tileDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    const doctype = new TileDoctype(state, context)
    const record = await TileDoctype._makeRecord(doctype, did, RECORDS.r1.desiredContent)

    const payload = dagCBOR.util.deserialize(record.linkedBlock)
    await context.ipfs.dag.put({ value: payload }, record.jws.link)

    state = await tileDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    state = await tileDoctypeHandler.applyRecord(record.jws, FAKE_CID_2, context, state)
    state = await tileDoctypeHandler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
  })
})
