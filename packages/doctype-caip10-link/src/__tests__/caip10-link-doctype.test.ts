import { Caip10LinkDoctypeHandler } from '../caip10-link-doctype-handler'

import cloneDeep from 'lodash.clonedeep'
import CID from 'cids'

jest.mock('3id-blockchain-utils', () => ({
  validateLink: jest.fn()
}))

import { validateLink } from '3id-blockchain-utils'
import { Caip10LinkDoctype } from "../caip10-link-doctype"
import { Context } from "@ceramicnetwork/common"

const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

const RECORDS = {
  genesis: { header: { controllers: [ '0x25954ef14cebbc9af3d71132489a9cfe87043f20@inmemory:12345' ] } },
  r1: {
    desiredContent: {
      version: 1,
      type: 'ethereum-eoa',
      signature: '0xbb800bc9e65a21e239bdc9e5f740e66edda75810a5952ff3d78fe6b41f7613c44470f81c6e4153eaded99096099afab59c7d0b8a1b61ba1bd7cd4cd0d117794c1b',
      address: '0x25954ef14cebbc9af3d71132489a9cfe87043f20@inmemory:12345',
      timestamp: 1585919920
    },
    record: {
      data: {
        version: 1,
        type: 'ethereum-eoa',
        signature: '0xbb800bc9e65a21e239bdc9e5f740e66edda75810a5952ff3d78fe6b41f7613c44470f81c6e4153eaded99096099afab59c7d0b8a1b61ba1bd7cd4cd0d117794c1b',
        address: '0x25954ef14cebbc9af3d71132489a9cfe87043f20@inmemory:12345',
        timestamp: 1585919920
      },
      header: {
        chainId: "inmemory:12345",
        controllers: [
          "0x25954ef14cebbc9af3d71132489a9cfe87043f20@inmemory:12345"
        ]
      },
      id: FAKE_CID_1,
      prev: FAKE_CID_1
    }
  },
  r2: { record: { proof: FAKE_CID_4 } },
  proof: {
    value: {
      blockNumber: 123456,
      chainId: 'inmemory:12345',
    }
  }
}

describe('Caip10LinkHandler', () => {
  let context: Context
  let handler: Caip10LinkDoctypeHandler

  beforeEach(() => {
    handler = new Caip10LinkDoctypeHandler()
    validateLink.mockImplementation(async (proof: Record<string, unknown>): Promise<Record<string, unknown>> => proof)

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

    const api = {getSupportedChains: jest.fn(async () => {return ["inmemory:12345"]})}
    context = {
      ipfs: ipfs,
      anchorService: null,
      api,
      chainInfo: {
        preferredChain: 'inmemory:12345',
        supportedChains: ['inmemory:12345']
      }
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
    await expect(Caip10LinkDoctype.makeGenesis({ content, metadata: {} }, context)).rejects.toThrow(/Controller must be specified/i)
  })

  it('throws an error if genesis record has more than one controller', async () => {
    const content: any = undefined
    const controllers = [...RECORDS.genesis.header.controllers, '0x25954ef14cebbc9af3d79876489a9cfe87043f20@inmemory:12345']
    await expect(Caip10LinkDoctype.makeGenesis({ content, metadata: { controllers } }, context)).rejects.toThrow(/Exactly one controller/i)
  })

  it('throws an error if genesis record has controller not in CAIP-10 format', async () => {
    const content: any = undefined
    const controllers = RECORDS.genesis.header.controllers.map(address => address.split('@')[0])
    await expect(Caip10LinkDoctype.makeGenesis({ content, metadata: { controllers } }, context)).rejects.toThrow(/According to CAIP-10/i)
  })

  it('applies genesis record correctly', async () => {
    const state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    expect(state).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    const state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    const doctype = new Caip10LinkDoctype(state, context)
    const record = await Caip10LinkDoctype._makeRecord(doctype, RECORDS.r1.desiredContent)
    expect(record).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    let state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    state = await handler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
  })

  it('throws an error of the proof is invalid', async () => {
    validateLink.mockResolvedValue(undefined)
    const state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    await expect(handler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)).rejects.toThrow(/Invalid proof/i)
  })

  it('throws an error of the proof doesn\'t match the controller', async () => {
    const badAddressRecord = cloneDeep(RECORDS.r1.record)
    badAddressRecord.data.address = '0xffffffffffffffffffffffffffffffffffffffff'
    const state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    await expect(handler.applyRecord(badAddressRecord, FAKE_CID_2, context, state)).rejects.toThrow(/Address doesn't match/i)
  })

  it('applies anchor record correctly', async () => {
    // create signed record
    await context.ipfs.dag.put(RECORDS.r1.record, FAKE_CID_2)
    // create anchor record
    await context.ipfs.dag.put(RECORDS.r2.record, FAKE_CID_3)
    // create anchor proof
    await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)

    // Apply genesis
    let state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    // Apply signed record
    state = await handler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    // Apply anchor record
    state = await handler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
  })

  it('Does not apply anchor record on wrong chain', async () => {
    // create signed record
    await context.ipfs.dag.put(RECORDS.r1.record, FAKE_CID_2)
    // create anchor record
    await context.ipfs.dag.put(RECORDS.r2.record, FAKE_CID_3)
    // create anchor proof with a different chainId than what's in the genesis record
    await context.ipfs.dag.put({value: { blockNumber: 123456, chainId: 'thewrongchain'}}, FAKE_CID_4)

    // Apply genesis
    let state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    // Apply signed record
    state = await handler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    // Apply anchor record
    await expect(handler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state))
        .rejects.toThrow("Anchor record with cid '" + FAKE_CID_3 + "' on caip10-link document with DocID '" +
            FAKE_CID_1 + "' is on chain 'thewrongchain' but this document is configured to be anchored on chain" +
            " 'inmemory:12345'")
  })
})
