import TileHandler from '../tileHandler'
import CID from 'cids'

jest.mock('../../user')
import User from '../../user'
jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWT: (): any => 'verified'
}))

const FAKE_CID_1 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsr')
const FAKE_CID_3 = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlss')
const RECORDS = {
  genesis: { doctype: 'tile', owners: [ 'did:3:bafyasdfasdf' ], content: { much: 'data' } },
  genesisGenerated: { doctype: 'tile', owners: [ 'did:3:bafyasdfasdf' ], content: { much: 'data' }, iss: 'did:3:bafyuser', header: 'aaaa', signature: 'cccc' },
  r1: {
    desiredContent: { much: 'data', very: 'content' },
    record: { content: [ { op: 'add', path: '/very', value: 'content' } ], id: FAKE_CID_1, prev: FAKE_CID_1, iss: 'did:3:bafyuser', header: 'aaaa', signature: 'cccc' }
  },
  r2: { record: {}, proof: { blockNumber: 123456 } }
}

const wrapWithFakeSignature = (obj: any): any => {
  obj.header = 'aaaa'
  obj.signature = 'cccc'
  obj.iss = 'did:3:bafyuser'
  return obj
}

describe('ThreeIdHandler', () => {
  let user, handler

  beforeAll(() => {
    user = new User()
    user.sign = jest.fn(async () => {
      // fake jwt
      return 'aaaa.bbbb.cccc'
    })
    user.DID = 'did:3:bafyuser'
  })

  beforeEach(() => {
    handler = new TileHandler()
  })

  it('is constructed correctly', async () => {
    expect(handler.doctype).toEqual('tile')
  })

  it('user is set correctly', async () => {
    handler.user = user
    expect(handler.user).toEqual(user)
  })

  it('makes genesis record correctly', async () => {
    handler.user = user
    const record1 = await handler.makeGenesis(RECORDS.genesis.content)
    const expected1 = wrapWithFakeSignature({ doctype: RECORDS.genesis.doctype, content: RECORDS.genesis.content, owners: [user.DID] })
    expect(record1).toEqual(expected1)
    const record2 = await handler.makeGenesis(RECORDS.genesis.content, RECORDS.genesis.owners)
    expect(record2).toEqual(wrapWithFakeSignature(RECORDS.genesis))
  })

  it('applies genesis record correctly', async () => {
    const state = await handler.applyGenesis(RECORDS.genesis, FAKE_CID_1)
    expect(state).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    const state = await handler.applyGenesis(RECORDS.genesisGenerated, FAKE_CID_1)
    await expect(handler.makeRecord(state, RECORDS.r1.desiredContent)).rejects.toThrow(/No user/)
    handler.user = user
    const record = await handler.makeRecord(state, RECORDS.r1.desiredContent)
    expect(record).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    let state = await handler.applyGenesis(RECORDS.genesisGenerated, FAKE_CID_1)
    state = await handler.applySigned(RECORDS.r1.record, FAKE_CID_2, state)
    expect(state).toMatchSnapshot()
  })

  it('applies anchor record correctly', async () => {
    let state = await handler.applyGenesis(RECORDS.genesis, FAKE_CID_1)
    state = await handler.applySigned(RECORDS.r1.record, FAKE_CID_2, state)
    state = await handler.applyAnchor(RECORDS.r2.record, RECORDS.r2.proof, FAKE_CID_3, state)
    expect(state).toMatchSnapshot()
  })
})
