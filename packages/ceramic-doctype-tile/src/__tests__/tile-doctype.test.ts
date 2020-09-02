import { TileDoctypeHandler } from '../tile-doctype-handler'
import CID from 'cids'

import { DID } from 'dids'
import { Resolver } from "did-resolver"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

import { TileDoctype } from "../tile-doctype"
import { Context } from "@ceramicnetwork/ceramic-common"

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
  genesis: { doctype: 'tile', header: { owners: [ 'did:3:bafyasdfasdf' ] }, data: { much: 'data' } },
  genesisGenerated: { doctype: 'tile', header: { owners: [ 'did:3:bafyasdfasdf' ] }, data: { much: 'data' }, signedHeader: 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ', signature: 'cccc' },
  r1: {
    desiredContent: { much: 'data', very: 'content' },
    record: { data: [ { op: 'add', path: '/very', value: 'content' } ], header: { owners: ["did:3:bafyasdfasdf"] }, id: FAKE_CID_1, prev: FAKE_CID_1, signedHeader: 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ', signature: 'cccc' }
  },
  r2: { record: { proof: FAKE_CID_4 } },
  proof: {
    value: {
      blockNumber: 123456
    }
  }
}

const wrapWithFakeSignature = (obj: any): any => {
  obj.signedHeader = 'eyJraWQiOiJkaWQ6MzpiYWZ5YXNkZmFzZGY_dmVyc2lvbj0wI3NpZ25pbmciLCJhbGciOiJFUzI1NksifQ'
  obj.signature = 'cccc'
  return obj
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
    did._id = 'did:3:bafyuser'

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

    context = {
      did,
      ipfs: ipfs,
      anchorService: null,
      resolver: new Resolver({
        ...threeIdResolver
      })
    }
  })

  beforeEach(() => {
    tileDoctypeHandler = new TileDoctypeHandler()
  })

  it('is constructed correctly', async () => {
    expect(tileDoctypeHandler.name).toEqual('tile')
  })

  it('makes genesis record correctly', async () => {
    const record1 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { owners: [did.id] } }, { did })

    const expected1 = await did.createDagJWS(RECORDS.genesis)
    expect(record1).toEqual(expected1)

    const record2 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: RECORDS.genesis.header }, { did })
    expect(record2).toEqual(wrapWithFakeSignature(RECORDS.genesis))
  })

  it('creates genesis records deterministically by default', async () => {
    const record1 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { owners: [did.id] } }, { did })
    const record2 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { owners: [did.id] } }, { did })

    expect(record1).toEqual(record2)
  })

  it('creates a unique genesis record if specified', async () => {
    const record1 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { owners: [did.id], isUnique: true } }, { did })
    const record2 = await TileDoctype.makeGenesis({ content: RECORDS.genesis.data, metadata: { owners: [did.id], isUnique: true } }, { did } )

    expect(record1).not.toEqual(record2)
  })

  it('applies genesis record correctly', async () => {
    const tileHandler = new TileDoctypeHandler()

    await context.ipfs.dag.put(RECORDS.genesisGenerated, FAKE_CID_1)

    const docState = await tileHandler.applyRecord(RECORDS.genesisGenerated, FAKE_CID_1, context)
    expect(docState).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    await context.ipfs.dag.put(RECORDS.genesisGenerated, FAKE_CID_1)

    const state = await tileDoctypeHandler.applyRecord(RECORDS.genesisGenerated, FAKE_CID_1, context)
    const doctype = new TileDoctype(state, context)

    await expect(TileDoctype._makeRecord(doctype, null, RECORDS.r1.desiredContent)).rejects.toThrow(/No DID/)

    const record = await TileDoctype._makeRecord(doctype, did, RECORDS.r1.desiredContent)
    expect(record).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    await context.ipfs.dag.put(RECORDS.genesisGenerated, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.r1.record, FAKE_CID_2)

    let state = await tileDoctypeHandler.applyRecord(RECORDS.genesisGenerated, FAKE_CID_1, context)
    state = await tileDoctypeHandler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
  })

  it('applies anchor record correctly', async () => {
    const tileDoctypeHandler = new TileDoctypeHandler()

    await context.ipfs.dag.put(RECORDS.genesisGenerated, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.r1.record, FAKE_CID_2)
    await context.ipfs.dag.put(RECORDS.r2.record, FAKE_CID_3)
    await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)

    let state = await tileDoctypeHandler.applyRecord(RECORDS.genesisGenerated, FAKE_CID_1, context)
    state = await tileDoctypeHandler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    state = await tileDoctypeHandler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
  })
})
