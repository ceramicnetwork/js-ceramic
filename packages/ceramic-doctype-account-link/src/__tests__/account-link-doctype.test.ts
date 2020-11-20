import { AccountLinkDoctypeHandler } from '../account-link-doctype-handler'

import cloneDeep from 'lodash.clonedeep'
import CID from 'cids'

jest.mock('3id-blockchain-utils', () => ({
  validateLink: jest.fn()
}))

import { validateLink } from '3id-blockchain-utils'
import { AccountLinkDoctype } from "../account-link-doctype"
import { Context } from "@ceramicnetwork/ceramic-common"

const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

const RECORDS = {
  genesis: { doctype: 'account-link', header: { controllers: [ '0x25954ef14cebbc9af3d71132489a9cfe87043f20@eip155:1' ] } },
  r1: {
    desiredContent: {
      version: 1,
      type: 'ethereum-eoa',
      signature: '0xbb800bc9e65a21e239bdc9e5f740e66edda75810a5952ff3d78fe6b41f7613c44470f81c6e4153eaded99096099afab59c7d0b8a1b61ba1bd7cd4cd0d117794c1b',
      address: '0x25954ef14cebbc9af3d71132489a9cfe87043f20@eip155:1',
      timestamp: 1585919920
    },
    record: {
      content: {
        version: 1,
        type: 'ethereum-eoa',
        signature: '0xbb800bc9e65a21e239bdc9e5f740e66edda75810a5952ff3d78fe6b41f7613c44470f81c6e4153eaded99096099afab59c7d0b8a1b61ba1bd7cd4cd0d117794c1b',
        address: '0x25954ef14cebbc9af3d71132489a9cfe87043f20@eip155:1',
        timestamp: 1585919920
      },
      "header": {
        "controllers": [
          "0x25954ef14cebbc9af3d71132489a9cfe87043f20@eip155:1"
        ]
      },
      id: FAKE_CID_1,
      prev: FAKE_CID_1
    }
  },
  r2: { record: { proof: FAKE_CID_4 } },
  proof: {
    value: {
      blockNumber: 123456
    }
  }
}

describe('AccountLinkHandler', () => {
  let context: Context
  let handler: AccountLinkDoctypeHandler

  beforeEach(() => {
    handler = new AccountLinkDoctypeHandler()
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

    context = {
      ipfs: ipfs,
      anchorService: null,
    }
  })

  it('is constructed correctly', async () => {
    expect(handler.name).toEqual('account-link')
  })

  it('makes genesis record correctly', async () => {
    const record = await AccountLinkDoctype.makeGenesis({ content: undefined, metadata: RECORDS.genesis.header })
    expect(record).toEqual(RECORDS.genesis)
  })

  it('throws an error if genesis record has content', async () => {
    const content = {}
    await expect(AccountLinkDoctype.makeGenesis({ content })).rejects.toThrow(/Cannot have content/i)
  })

  it('throws an error if genesis record has no metadata specified', async () => {
    const content: any = undefined
    const controllers: any = undefined
    await expect(AccountLinkDoctype.makeGenesis({ content, controllers })).rejects.toThrow(/Metadata must be specified/i)
  })

  it('throws an error if genesis record has no controllers specified', async () => {
    const content: any = undefined
    await expect(AccountLinkDoctype.makeGenesis({ content, metadata: {} })).rejects.toThrow(/Controller must be specified/i)
  })

  it('throws an error if genesis record has more than one controller', async () => {
    const content: any = undefined
    const controllers = [...RECORDS.genesis.header.controllers, '0x25954ef14cebbc9af3d79876489a9cfe87043f20@eip155:1']
    await expect(AccountLinkDoctype.makeGenesis({ content, metadata: { controllers } })).rejects.toThrow(/Exactly one controller/i)
  })

  it('throws an error if genesis record has controller not in CAIP-10 format', async () => {
    const content: any = undefined
    const controllers = RECORDS.genesis.header.controllers.map(address => address.split('@')[0])
    await expect(AccountLinkDoctype.makeGenesis({ content, metadata: { controllers } })).rejects.toThrow(/According to CAIP-10/i)
  })

  it('applies genesis record correctly', async () => {
    const state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    expect(state).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    const state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    const doctype = new AccountLinkDoctype(state, context)
    const record = await AccountLinkDoctype._makeRecord(doctype, RECORDS.r1.desiredContent)
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
    badAddressRecord.content.address = '0xffffffffffffffffffffffffffffffffffffffff'
    const state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    await expect(handler.applyRecord(badAddressRecord, FAKE_CID_2, context, state)).rejects.toThrow(/Address doesn't match/i)
  })

  it('applies anchor record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesisGenerated, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.r1.record, FAKE_CID_2)
    await context.ipfs.dag.put(RECORDS.r2.record, FAKE_CID_3)
    await context.ipfs.dag.put(RECORDS.proof, FAKE_CID_4)

    let state = await handler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    state = await handler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    state = await handler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
  })
})
