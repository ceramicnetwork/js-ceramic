import { Caip10LinkHandler } from '../caip10-link-handler.js'
import cloneDeep from 'lodash.clonedeep'
import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link'
import { CeramicApi, CommitType, Context, TestUtils } from '@ceramicnetwork/common'
import sha256 from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'
import { AccountId } from 'caip'

const digest = (input: string) =>
  uint8arrays.toString(sha256.hash(uint8arrays.fromString(input)), 'base16')
const hash = (data: string): CID =>
  CID.create(1, 0x12, decodeMultiHash(Buffer.from('1220' + digest(data), 'hex')))

const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_5 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlse')
const FAKE_CID_6 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjleu')
const FAKE_CID_7 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlwu')
const FAKE_CID_8 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts66jqcuam6bmye2pb54adnrtccjlwu')

const ACCOUNT = '0x0544DcF4fcE959C6C4F3b7530190cB5E1BD67Cb8@eip155:1'

const COMMITS = {
  genesis: { header: { controllers: [ACCOUNT.toLowerCase()], family: 'caip10-eip155:1' } },
  r1: {
    desiredContent: {
      version: 2,
      type: 'ethereum-eoa',
      message:
        'Create a new account link to your identity.\n' +
        '\n' +
        'did:3:testdid1 \n' +
        'Timestamp: 1608116721',
      signature:
        '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e83078c907ccfaf9bd0de82bd5e57fe7884d9cb8a9303f5d92ea4df0d1c',
      account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
      timestamp: 1608116721,
    },
    commit: {
      data: {
        version: 2,
        type: 'ethereum-eoa',
        message:
          'Create a new account link to your identity.\n' +
          '\n' +
          'did:3:testdid1 \n' +
          'Timestamp: 1608116721',
        signature:
          '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e83078c907ccfaf9bd0de82bd5e57fe7884d9cb8a9303f5d92ea4df0d1c',
        account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
        timestamp: 1608116721,
      },
      id: FAKE_CID_1,
      prev: FAKE_CID_1,
    },
  },
  r2: { commit: { proof: FAKE_CID_4 } },
  proof: {
    value: {
      blockNumber: 123456,
      chainId: 'fakechain:123',
    },
  },
}

describe('Caip10LinkHandler', () => {
  let context: Context
  let handler: Caip10LinkHandler

  beforeEach(() => {
    handler = new Caip10LinkHandler()
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
        },
      },
    }

    const api = {
      getSupportedChains: jest.fn(async () => {
        return ['fakechain:123']
      }),
    }
    context = {
      ipfs: ipfs,
      anchorService: null,
      api: api as unknown as CeramicApi,
    }
  })

  it('is constructed correctly', async () => {
    expect(handler.name).toEqual('caip10-link')
  })

  it('makes genesis commit correctly', async () => {
    const commit = Caip10Link.makeGenesis(
      new AccountId({ address: '0x0544DcF4fcE959C6C4F3b7530190cB5E1BD67Cb8', chainId: 'eip155:1' })
    )
    expect(commit).toEqual(COMMITS.genesis)
  })

  it('throws an error if genesis commit has data', async () => {
    const commitWithData = { ...COMMITS.genesis, data: {} }
    const genesisWithData = { cid: FAKE_CID_1, type: CommitType.GENESIS, commit: commitWithData }
    await expect(handler.applyCommit(genesisWithData, context)).rejects.toThrow(/cannot have data/)
  })

  it('throws an error if genesis commit has no controllers specified', async () => {
    const commitWithoutControllers = cloneDeep(COMMITS.genesis)
    delete commitWithoutControllers.header.controllers
    const genesisWithoutControllers = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: commitWithoutControllers,
    }
    await expect(handler.applyCommit(genesisWithoutControllers, context)).rejects.toThrow(
      /Exactly one controller must be specified/i
    )
  })

  it('throws an error if genesis commit has more than one controller', async () => {
    const commitWithMultipleControllers = cloneDeep(COMMITS.genesis)
    commitWithMultipleControllers.header.controllers.push(
      '0x25954ef14cebbc9af3d79876489a9cfe87043f20@eip155:1'
    )
    const genesisWithMultipleControllers = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: commitWithMultipleControllers,
    }
    await expect(handler.applyCommit(genesisWithMultipleControllers, context)).rejects.toThrow(
      /Exactly one controller must be specified/i
    )
  })

  it('applies genesis commit correctly', async () => {
    const genesisCommitData = { cid: FAKE_CID_1, type: CommitType.GENESIS, commit: COMMITS.genesis }
    const state = await handler.applyCommit(genesisCommitData, context)
    expect(state).toMatchSnapshot()
  })

  it('makes update commit correctly', async () => {
    const genesisCommitData = { cid: FAKE_CID_1, type: CommitType.GENESIS, commit: COMMITS.genesis }
    const state = await handler.applyCommit(genesisCommitData, context)
    const state$ = TestUtils.runningState(state)
    const stream = new Caip10Link(state$, context)
    const commit = await stream.makeCommit(COMMITS.r1.desiredContent)
    // Have to compare the 'id' and 'prev' CIDs manually (with toString()) otherwise jest gets
    // confused by Symbol(@ipld/js-cid/CID)
    expect(commit.data).toEqual(COMMITS.r1.commit.data)
    expect(commit.id.toString()).toEqual(COMMITS.r1.commit.id.toString())
    expect(commit.prev.toString()).toEqual(COMMITS.r1.commit.prev.toString())
  })

  it('applies signed commit correctly', async () => {
    const genesisCommitData = { cid: FAKE_CID_1, type: CommitType.GENESIS, commit: COMMITS.genesis }
    let state = await handler.applyCommit(genesisCommitData, context)
    const signedCommitData = { cid: FAKE_CID_2, type: CommitType.SIGNED, commit: COMMITS.r1.commit }
    state = await handler.applyCommit(signedCommitData, context, state)
    expect(state).toMatchSnapshot()
  })

  it('throws an error of the proof is invalid', async () => {
    const genesisCommitData = { cid: FAKE_CID_1, type: CommitType.GENESIS, commit: COMMITS.genesis }
    const state = await handler.applyCommit(genesisCommitData, context)
    const badRecord = cloneDeep(COMMITS.r1.commit)
    badRecord.data.signature =
      '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e8302348762387462387648726346877884d9cb8a9303f5d92ea4df0d1c'
    const badCommitData = { cid: FAKE_CID_2, type: CommitType.SIGNED, commit: badRecord }
    await expect(handler.applyCommit(badCommitData, context, state)).rejects.toThrow(
      /Invalid proof/i
    )
  })

  it("throws an error of the proof doesn't match the controller", async () => {
    const badAddressGenesis = cloneDeep(COMMITS.genesis)
    badAddressGenesis.header.controllers = ['0xffffffffffffffffffffffffffffffffffffffff@eip155:1']
    const badAddressGenesisData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: badAddressGenesis,
    }
    const state = await handler.applyCommit(badAddressGenesisData, context)
    const signedCommitData = { cid: FAKE_CID_2, type: CommitType.SIGNED, commit: COMMITS.r1.commit }
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /Address doesn't match/i
    )
  })

  it('applies anchor commit correctly', async () => {
    // create signed commit
    await context.ipfs.dag.put(COMMITS.r1.commit, FAKE_CID_2)
    // create anchor commit
    await context.ipfs.dag.put(COMMITS.r2.commit, FAKE_CID_3)
    // create anchor proof
    await context.ipfs.dag.put(COMMITS.proof, FAKE_CID_4)

    // Apply genesis
    const genesisCommitData = { cid: FAKE_CID_1, type: CommitType.GENESIS, commit: COMMITS.genesis }
    let state = await handler.applyCommit(genesisCommitData, context)
    // Apply signed record
    const signedCommitData = { cid: FAKE_CID_2, type: CommitType.SIGNED, commit: COMMITS.r1.commit }
    state = await handler.applyCommit(signedCommitData, context, state)
    // Apply anchor record
    const anchorCommitData = {
      cid: FAKE_CID_3,
      type: CommitType.ANCHOR,
      commit: COMMITS.r2.commit,
      proof: COMMITS.proof.value,
    }
    state = await handler.applyCommit(anchorCommitData, context, state)
    expect(state).toMatchSnapshot()
  })

  it('Should not allow replay attack', async () => {
    const commits = {
      genesis: {
        header: {
          controllers: ['0x0544DcF4fcE959C6C4F3b7530190cB5E1BD67Cb8@eip155:1'],
          family: 'caip10-eip155:1',
        },
      },
      r1: {
        data: {
          version: 2,
          type: 'ethereum-eoa',
          message:
            'Create a new account link to your identity.\n' +
            '\n' +
            'did:3:testdid1 \n' +
            'Timestamp: 1608116721',
          signature:
            '0xc6a5f50945bc7b06320b66cfe144e2b571391c88827eed0490f7f8e5e8af769c4246e27e83078c907ccfaf9bd0de82bd5e57fe7884d9cb8a9303f5d92ea4df0d1c',
          account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
          timestamp: 1608116721,
        },
        id: FAKE_CID_1,
        prev: FAKE_CID_1,
      },
      r2: { proof: FAKE_CID_4 },
      r2proof: {
        value: {
          blockNumber: 123456,
          blockTimestamp: 1608116723,
          chainId: 'fakechain:123',
        },
      },
      r3: {
        data: {
          version: 2,
          type: 'ethereum-eoa',
          message:
            'Create a new account link to your identity.\n' +
            '\n' +
            'did:3:testdid2 \n' +
            'Timestamp: 1608116725',
          signature:
            '0xe1bcc3f3b67ae303cb95db9d2d266f95984fd76bf3a4452dbb64ad4d3941998f4cb37f85197c74f9fb5cdf33e9042949a5452a204db2d48d85929406f64aac811b',
          account: '0x0544dcf4fce959c6c4f3b7530190cb5e1bd67cb8@eip155:1',
          timestamp: 1608116725,
        },
        id: FAKE_CID_1,
        prev: FAKE_CID_3,
      },
      r4: { proof: FAKE_CID_7 },
      r4proof: {
        value: {
          blockNumber: 123456,
          blockTimestamp: 1608116727,
          chainId: 'fakechain:123',
        },
      },
    }
    await context.ipfs.dag.put(commits.r2proof, FAKE_CID_4)
    await context.ipfs.dag.put(commits.r4proof, FAKE_CID_7)

    const genesisCommitData = { cid: FAKE_CID_1, type: CommitType.GENESIS, commit: commits.genesis }
    let state = await handler.applyCommit(genesisCommitData, context)
    const signedCommitData_1 = { cid: FAKE_CID_2, type: CommitType.SIGNED, commit: commits.r1 }
    state = await handler.applyCommit(signedCommitData_1, context, state)
    const anchorCommitData_1 = {
      cid: FAKE_CID_3,
      type: CommitType.ANCHOR,
      commit: commits.r2,
      proof: commits.r2proof.value,
      timestamp: commits.r2proof.value.blockTimestamp,
    }
    state = await handler.applyCommit(anchorCommitData_1, context, state)
    expect(state.content).toEqual('did:3:testdid1')
    const signedCommitData_2 = { cid: FAKE_CID_5, type: CommitType.SIGNED, commit: commits.r3 }
    state = await handler.applyCommit(signedCommitData_2, context, state)

    // create a fake update based on the r1 data to try a replay attack
    const r4 = {
      data: commits.r1.data,
      id: FAKE_CID_1,
      prev: FAKE_CID_5,
    }
    const signedCommitData_3 = { cid: FAKE_CID_8, type: CommitType.SIGNED, commit: r4 }
    await expect(handler.applyCommit(signedCommitData_3, context, state)).rejects.toThrow(
      'Invalid commit, proof timestamp too old'
    )

    const anchorCommitData_2 = {
      cid: FAKE_CID_6,
      type: CommitType.ANCHOR,
      commit: commits.r4,
      proof: commits.r4proof.value,
    }
    state = await handler.applyCommit(anchorCommitData_2, context, state)
    expect(state.content).toEqual('did:3:testdid2')

    // create a fake update based on the r1 data to try a replay attack
    const r5 = {
      data: commits.r1.data,
      id: FAKE_CID_1,
      prev: FAKE_CID_6,
    }
    const signedCommitData_4 = { cid: FAKE_CID_8, type: CommitType.SIGNED, commit: r5 }
    await expect(handler.applyCommit(signedCommitData_4, context, state)).rejects.toThrow(
      'Invalid commit, proof timestamp too old'
    )
  })
})
