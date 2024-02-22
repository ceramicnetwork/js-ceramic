import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import * as dagCBOR from '@ipld/dag-cbor'
import {
  CeramicSigner,
  CommitData,
  EventType,
  IpfsApi,
  SignedCommitContainer,
  StreamReaderWriter,
} from '@ceramicnetwork/common'
import { TileDocumentHandler } from '../tile-document-handler.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import cloneDeep from 'lodash.clonedeep'
import {
  DidTestUtils,
  FAKE_CID_1,
  FAKE_CID_2,
  FAKE_CID_3,
  FAKE_CID_4,
  NO_DID_SIGNER,
  RotatingSigner,
} from '@ceramicnetwork/did-test-utils'
import { CommonTestUtils as TestUtils, describeIfV3 } from '@ceramicnetwork/common-test-utils'
import { VerificationMethod } from 'did-resolver'

// because we're doing mocking weirdly, by mocking a function two libraries deep, to test a function
// one library deep that is unrelated to TileDocumentHandler, we need to specifically duplicate
// this mock here. This is due to import resolution, and not being able to use the mock specification
// in did-test-utils
jest.unstable_mockModule('did-jwt', () => {
  return {
    // TODO - We should test for when this function throws as well
    // Mock: Blindly accept a signature
    verifyJWS: (
      _jws: string,
      _keys: VerificationMethod | VerificationMethod[]
    ): VerificationMethod => {
      return {
        id: '',
        controller: '',
        type: '',
      }
    },
    // And these functions are required for the test to run ¯\_(ツ)_/¯
    resolveX25519Encrypters: () => {
      return []
    },
    createJWE: () => {
      return {}
    },
  }
})

const DID_ID = 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'

const COMMITS = {
  genesis: {
    header: {
      tags: ['3id'],
      controllers: [DID_ID],
    },
    data: { publicKeys: { test: '0xabc' } },
  },
  genesisGenerated: {
    jws: {
      payload: 'bbbb',
      signatures: [
        {
          protected:
            'eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ',
          signature: 'cccc',
        },
      ],
      link: CID.parse('bafyreig7dosektvux6a55mphri6piy3g5k4otxinanfevjeehix6rqfeym'),
    },
    linkedBlock: {
      data: {
        publicKeys: {
          test: '0xabc',
        },
      },
      header: {
        controllers: [DID_ID],
        tags: ['3id'],
      },
    },
  },
  r1: {
    desiredContent: { publicKeys: { test: '0xabc' }, other: 'data' },
    commit: {
      jws: {
        payload: 'bbbb',
        signatures: [
          {
            protected:
              'eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ',
            signature: 'cccc',
          },
        ],
        link: 'bafyreib2rxk3rybk3aobmv5cjuql3bm2twh4jo5uxgf5kpqcsgz7soitae',
      },
      payload: {
        id: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
        data: [
          {
            op: 'add',
            path: '/other',
            value: 'data',
          },
        ],
        prev: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
        header: {},
      },
    },
  },
  r2: { commit: { proof: FAKE_CID_4, id: FAKE_CID_1, prev: FAKE_CID_2 } },
  proof: {
    chainId: 'fakechain:123',
  },
}

let tileDocumentHandler: TileDocumentHandler
let ipfs: IpfsApi
let defaultSigner: CeramicSigner
let context: StreamReaderWriter

// These tests are never expected to be run in v' mode because caip10 link is not supported
describeIfV3('TileDocument with 3ID', () => {
  beforeEach(async () => {
    jest.resetAllMocks()

    const recs: Record<string, any> = {}
    ipfs = {
      dag: {
        put(rec: any, cid?: CID): any {
          if (cid) {
            recs[cid.toString()] = { value: rec }
            return cid
          }
          // stringify as a way of doing deep copy
          const clone = cloneDeep(rec)
          const c = DidTestUtils.hash(JSON.stringify(clone))
          recs[c.toString()] = { value: clone }
          return c
        },
        get(cid: any): any {
          return recs[cid.toString()]
        },
      },
    } as IpfsApi

    const did = await DidTestUtils.generateDID({
      id: DID_ID,
      jws: {
        payload: 'bbbb',
        signatures: [
          {
            protected:
              'eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ',
            signature: 'cccc',
          },
        ],
      },
    })
    defaultSigner = CeramicSigner.fromDID(did)
    context = DidTestUtils.api(defaultSigner)

    tileDocumentHandler = new TileDocumentHandler()
  })

  it('is constructed correctly', async () => {
    expect(tileDocumentHandler.name).toEqual('tile')
  })

  it('makes genesis commit correctly', async () => {
    const commit = (await TileDocument.makeGenesis(context.signer, COMMITS.genesis.data, {
      ...COMMITS.genesis.header,
    })) as SignedCommitContainer
    const { jws, linkedBlock } = commit

    const payload = dagCBOR.decode(linkedBlock)
    const generated = {
      jws: DidTestUtils.serialize(jws),
      linkedBlock: DidTestUtils.serialize(payload),
    }

    // Add the 'unique' header field to the data used to generate the expected genesis commit
    const genesis = cloneDeep(COMMITS.genesis)
    genesis.header['unique'] = generated.linkedBlock.header.unique

    const expected = await defaultSigner.signer.createDagJWS(genesis)
    expect(expected).toBeDefined()

    const { jws: eJws, linkedBlock: eLinkedBlock } = expected
    const ePayload = dagCBOR.decode(eLinkedBlock)
    const signed = {
      jws: DidTestUtils.serialize(eJws),
      linkedBlock: DidTestUtils.serialize(ePayload),
    }

    expect(generated).toEqual(DidTestUtils.serialize(signed))
  })

  it('applies genesis commit correctly', async () => {
    const commit = (await TileDocument.makeGenesis(context, COMMITS.genesis.data, {
      controllers: [DID_ID],
      tags: ['3id'],
    })) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const signedCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    const streamState = await tileDocumentHandler.applyCommit(signedCommitData, context)
    delete streamState.metadata.unique
    expect(streamState).toMatchSnapshot()
  })

  it('makes signed commit correctly', async () => {
    await ipfs.dag.put(COMMITS.genesisGenerated.jws, FAKE_CID_1)
    await ipfs.dag.put(COMMITS.genesisGenerated.linkedBlock, COMMITS.genesisGenerated.jws.link)

    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: COMMITS.genesisGenerated.linkedBlock,
      envelope: COMMITS.genesisGenerated.jws,
    }
    const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)
    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)

    await expect(doc.makeCommit(NO_DID_SIGNER, COMMITS.r1.desiredContent)).rejects.toThrow(/No DID/)

    const commit = (await doc.makeCommit(
      context.signer,
      COMMITS.r1.desiredContent
    )) as SignedCommitContainer
    const { jws: rJws, linkedBlock: rLinkedBlock } = commit
    const rPayload = dagCBOR.decode(rLinkedBlock)
    expect({
      jws: DidTestUtils.serialize(rJws),
      payload: DidTestUtils.serialize(rPayload),
    }).toEqual(COMMITS.r1.commit)
  })

  it('applies signed commit correctly', async () => {
    const genesisCommit = (await TileDocument.makeGenesis(context.signer, COMMITS.genesis.data, {
      controllers: [DID_ID],
      tags: ['3id'],
    })) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    // apply genesis
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
    }
    let state = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)
    const signedCommit = (await doc.makeCommit(
      context.signer,
      COMMITS.r1.desiredContent
    )) as SignedCommitContainer

    await ipfs.dag.put(signedCommit, FAKE_CID_2)

    const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
    await ipfs.dag.put(sPayload, signedCommit.jws.link)

    // apply signed
    const signedCommitData = {
      cid: FAKE_CID_2,
      type: EventType.DATA,
      commit: sPayload,
      envelope: signedCommit.jws,
    }
    state = await tileDocumentHandler.applyCommit(signedCommitData, context, state)
    delete state.metadata.unique
    delete state.next.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('throws error if commit signed by DID not matching controller', async () => {
    const genesisCommit = (await TileDocument.makeGenesis(context, COMMITS.genesis.data, {
      controllers: ['did:3:fake'],
      tags: ['3id'],
    })) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
    }

    await expect(tileDocumentHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: not a valid verificationMethod for issuer/
    )
  })

  it('applies anchor commit correctly', async () => {
    const genesisCommit = (await TileDocument.makeGenesis(context.signer, COMMITS.genesis.data, {
      controllers: [DID_ID],
      tags: ['3id'],
    })) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    // apply genesis
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
    }
    let state = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)
    const signedCommit = (await doc.makeCommit(
      context.signer,
      COMMITS.r1.desiredContent
    )) as SignedCommitContainer

    await ipfs.dag.put(signedCommit, FAKE_CID_2)

    const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
    await ipfs.dag.put(sPayload, signedCommit.jws.link)

    // apply signed
    const signedCommitData = {
      cid: FAKE_CID_2,
      type: EventType.DATA,
      commit: sPayload,
      envelope: signedCommit.jws,
    }
    state = await tileDocumentHandler.applyCommit(signedCommitData, context, state)

    await ipfs.dag.put(COMMITS.proof, FAKE_CID_4)
    // apply anchor
    const anchorCommitData = {
      cid: FAKE_CID_3,
      type: EventType.TIME,
      commit: COMMITS.r2.commit,
      proof: COMMITS.proof,
      timestamp: 1615799679,
    } as CommitData
    state = await tileDocumentHandler.applyCommit(anchorCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })
})
