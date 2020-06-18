import CID from 'cids'

jest.mock('../../../user')
import User from '../../../user'
import ThreeIdDoctypeHandler from "../three-id-doctype-handler"
import { ThreeIdDoctype } from "../three-id-doctype"
import { Context } from "../../../context"
import { DoctypeUtils } from "../../../doctype"
jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWT: (): any => 'verified'
}))

const cloneDeep = require('lodash.clonedeep') // eslint-disable-line @typescript-eslint/no-var-requires
const { sha256 } = require('js-sha256') // eslint-disable-line @typescript-eslint/no-var-requires
const hash = (data: string): CID => new CID(1, 'sha2-256', Buffer.from('1220' + sha256(data), 'hex'))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsr')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlss')
const FAKE_CID_4 = new CID('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')

const RECORDS = {
  genesis: { doctype: '3id', owners: [ '0x123' ], content: { publicKeys: { test: '0xabc' } } },
  r1: {
    desiredContent: { publicKeys: { test: '0xabc' }, other: 'data' },
    record: { content: [ { op: 'add', path: '/other', value: 'data' } ], id: FAKE_CID_1, prev: FAKE_CID_1, header: 'aaaa', signature: 'cccc' }
  },
  r2: { record: { proof: FAKE_CID_4 }, proof: { blockNumber: 123456 } }
}

describe('ThreeIdHandler', () => {
  let user: User, threeIdDoctypeHandler: ThreeIdDoctypeHandler, context: Context

  beforeAll(() => {
    user = new User(null)
    user.sign = jest.fn(async () => {
      // fake jwt
      return 'aaaa.bbbb.cccc'
    })

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
      ipfs,
      anchorService: null,
    }
  })

  beforeEach(() => {
    threeIdDoctypeHandler = new ThreeIdDoctypeHandler()
  })

  it('is constructed correctly', async () => {
    expect(threeIdDoctypeHandler.name).toEqual('3id')
  })

  it('makes genesis record correctly', async () => {
    await expect(ThreeIdDoctype.makeGenesis({ content: RECORDS.genesis.content })).rejects.toThrow(/The owner/)
    const record = await ThreeIdDoctype.makeGenesis({ content: RECORDS.genesis.content, owners: RECORDS.genesis.owners })
    expect(record).toEqual(RECORDS.genesis)
  })

  it('applies genesis record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)

    const state = await threeIdDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    expect(state).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)

    const state = await threeIdDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    const docId = ['/ceramic', FAKE_CID_1.toString()].join('/')

    const doctype = DoctypeUtils.docStateToDoctype<ThreeIdDoctype>(docId, state)
    await expect(ThreeIdDoctype._makeRecord(doctype, null, RECORDS.r1.desiredContent)).rejects.toThrow(/No user/)
    const record = await ThreeIdDoctype._makeRecord(doctype, user, RECORDS.r1.desiredContent)
    expect(record).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.r1.record, FAKE_CID_2)

    let state = await threeIdDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    state = await threeIdDoctypeHandler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    expect(state).toMatchSnapshot()
  })

  it('applies anchor record correctly', async () => {
    await context.ipfs.dag.put(RECORDS.genesis, FAKE_CID_1)
    await context.ipfs.dag.put(RECORDS.r1.record, FAKE_CID_2)
    await context.ipfs.dag.put(RECORDS.r2.record, FAKE_CID_3)
    await context.ipfs.dag.put(RECORDS.r2.record.proof, FAKE_CID_4)

    let state = await threeIdDoctypeHandler.applyRecord(RECORDS.genesis, FAKE_CID_1, context)
    state = await threeIdDoctypeHandler.applyRecord(RECORDS.r1.record, FAKE_CID_2, context, state)
    state = await threeIdDoctypeHandler.applyRecord(RECORDS.r2.record, FAKE_CID_3, context, state)
    expect(state).toMatchSnapshot()
  })
})
