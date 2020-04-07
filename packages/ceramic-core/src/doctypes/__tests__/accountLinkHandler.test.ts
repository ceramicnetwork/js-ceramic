import AccountLinkHandler from '../accountLinkHandler'

import cloneDeep from 'lodash.clonedeep'

jest.mock('3id-blockchain-utils', () => ({
  validateLink: jest.fn()
}))

import { validateLink } from '3id-blockchain-utils'

const RECORDS = {
  genesis: { doctype: 'account-link', owners: [ '0x25954ef14cebbc9af3d71132489a9cfe87043f20@eip155:1' ] },
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
      next: { '/': 'cid1' }
    }
  },
  r2: { record: {}, proof: { blockNumber: 123456 } }
}

describe('AccountLinkHandler', () => {
  let handler

  beforeEach(() => {
    handler = new AccountLinkHandler()
    validateLink.mockImplementation(async (proof: object): object => proof)
  })

  it('is constructed correctly', async () => {
    expect(handler.doctype).toEqual('account-link')
  })

  it('makes genesis record correctly', async () => {
    const record = await handler.makeGenesis(undefined, RECORDS.genesis.owners)
    
    expect(record).toEqual(RECORDS.genesis)
  })

  it('throws an error if genesis record has content', async () => {
    const content = {}
    const owners = RECORDS.genesis.owners

    await expect(handler.makeGenesis(content, owners)).rejects.toThrow(/Cannot have content/i)
  })

  it('throws an error if genesis record has no owners specified', async () => {
    const content = undefined
    const owners = undefined

    await expect(handler.makeGenesis(content, owners)).rejects.toThrow(/Owner must be specified/i)
  })

  it('throws an error if genesis record has more than one owner', async () => {
    const content = undefined
    const owners = [...RECORDS.genesis.owners, '0x25954ef14cebbc9af3d79876489a9cfe87043f20@eip155:1']

    await expect(handler.makeGenesis(content, owners)).rejects.toThrow(/Exactly one owner/i)
  })

  it('throws an error if genesis record has owner not in CAIP-10 format', async () => {
    const content = undefined
    const owners = RECORDS.genesis.owners.map(address => address.split('@')[0])

    await expect(handler.makeGenesis(content, owners)).rejects.toThrow(/According to CAIP-10/i)
  })

  it('throws an error if genesis record has owner not on mainnet', async () => {
    const content = undefined
    const owners = RECORDS.genesis.owners.map(address => address.split('@')[0] = '@eip155:3')

    await expect(handler.makeGenesis(content, owners)).rejects.toThrow(/Ethereum mainnet/i)
  })

  it('applies genesis record correctly', async () => {
    const state = await handler.applyGenesis(RECORDS.genesis, 'cid1')
    
    expect(state).toMatchSnapshot()
  })

  it('makes signed record correctly', async () => {
    const state = await handler.applyGenesis(RECORDS.genesis, 'cid1')
    
    const record = await handler.makeRecord(state, RECORDS.r1.desiredContent)
    
    expect(record).toEqual(RECORDS.r1.record)
  })

  it('applies signed record correctly', async () => {
    let state = await handler.applyGenesis(RECORDS.genesis, 'cid1')
    
    state = await handler.applySigned(RECORDS.r1.record, 'cid2', state)
    
    expect(state).toMatchSnapshot()
  })

  it('throws an error of the proof is invalid', async () => {
    validateLink.mockResolvedValue(undefined)
    const state = await handler.applyGenesis(RECORDS.genesis, 'cid1')
    
    await expect(handler.applySigned(RECORDS.r1.record, 'cid2', state)).rejects.toThrow(/Invalid proof/i)
  })

  it('throws an error of the proof doesn\'t match the owner', async () => {
    const badAddressRecord = cloneDeep(RECORDS.r1.record)
    badAddressRecord.content.address = '0xffffffffffffffffffffffffffffffffffffffff'
    const state = await handler.applyGenesis(RECORDS.genesis, 'cid1')

    await expect(handler.applySigned(badAddressRecord, 'cid2', state)).rejects.toThrow(/Address doesn't match/i)
  })

  it('applies anchor record correctly', async () => {
    let state = await handler.applyGenesis(RECORDS.genesis, 'cid1')
    state = await handler.applySigned(RECORDS.r1.record, 'cid2', state)
    state = await handler.applyAnchor(RECORDS.r2.record, RECORDS.r2.proof, 'cid3', state)
    expect(state).toMatchSnapshot()
  })
})
