import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import { Resolver } from 'did-resolver'
import * as dagCBOR from '@ipld/dag-cbor'
import * as KeyDidResolver from 'key-did-resolver'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import { DID } from 'dids'
import {
  CeramicApi,
  CommitType,
  Context,
  SignedCommitContainer,
  TestUtils,
} from '@ceramicnetwork/common'
import { TileDocumentHandler } from '../tile-document-handler.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import cloneDeep from 'lodash.clonedeep'
import * as sha256 from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'

jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWS: (): void => {
    return
  },
}))

const hash = (data: string): CID =>
  CID.create(
    1,
    0x12,
    decodeMultiHash(
      uint8arrays.fromString('1220' + sha256.hash(uint8arrays.fromString(data)), 'base16')
    )
  )

const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')

const COMMITS = {
  genesis: {
    header: {
      tags: ['3id'],
      controllers: ['did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'],
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
        controllers: ['did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'],
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
  r2: { commit: { proof: FAKE_CID_4 } },
  proof: {
    blockNumber: 123456,
    blockTimestamp: 1615799679,
    chainId: 'fakechain:123',
  },
}

const serialize = (data: any): any => {
  if (Array.isArray(data)) {
    const serialized = []
    for (const item of data) {
      serialized.push(serialize(item))
    }
    return serialized
  }
  const cid = CID.asCID(data)
  if (!cid && typeof data === 'object') {
    const serialized: Record<string, any> = {}
    for (const prop in data) {
      serialized[prop] = serialize(data[prop])
    }
    return serialized
  }
  if (cid) {
    return data.toString()
  }
  return data
}

let did: DID
let tileDocumentHandler: TileDocumentHandler
let context: Context

beforeAll(() => {
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
      },
    },
  }

  const threeIdResolver = {
    '3': async (did) => ({
      didResolutionMetadata: { contentType: 'application/did+json' },
      didDocument: wrapDocument(
        {
          publicKeys: {
            signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
            encryption: 'z6LSfQabSbJzX8WAm1qdQcHCHTzVv8a2u6F7kmzdodfvUCo9',
          },
        },
        did
      ),
      didDocumentMetadata: {},
    }),
  }

  const keyDidResolver = KeyDidResolver.getResolver()
  const resolver = new Resolver({
    ...threeIdResolver,
    ...keyDidResolver,
  })
  did = new DID({ resolver })
  did.createJWS = jest.fn(async () => {
    // fake jws
    return {
      payload: 'bbbb',
      signatures: [
        {
          protected:
            'eyJraWQiOiJkaWQ6a2V5OnpRM3Nod3NDZ0ZhbkJheDZVaWFMdTFvR3ZNN3ZodXFvVzg4VkJVaVVUQ2VIYlRlVFYiLCJhbGciOiJFUzI1NksifQ',
          signature: 'cccc',
        },
      ],
    }
  })
  did._id = 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'
  const api = {
    getSupportedChains: jest.fn(async () => {
      return ['fakechain:123']
    }),
    did,
  }

  context = {
    did,
    ipfs,
    resolver,
    anchorService: null,
    api: api as unknown as CeramicApi,
  }
})

beforeEach(() => {
  tileDocumentHandler = new TileDocumentHandler()
})

it('is constructed correctly', async () => {
  expect(tileDocumentHandler.name).toEqual('tile')
})

it('makes genesis commit correctly', async () => {
  const commit = (await TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
    ...COMMITS.genesis.header,
  })) as SignedCommitContainer
  const { jws, linkedBlock } = commit

  const payload = dagCBOR.decode(linkedBlock)
  const generated = { jws: serialize(jws), linkedBlock: serialize(payload) }

  // Add the 'unique' header field to the data used to generate the expected genesis commit
  const genesis = cloneDeep(COMMITS.genesis)
  genesis.header['unique'] = generated.linkedBlock.header.unique

  const expected = await did.createDagJWS(genesis)
  expect(expected).toBeDefined()

  const { jws: eJws, linkedBlock: eLinkedBlock } = expected
  const ePayload = dagCBOR.decode(eLinkedBlock)
  const signed = { jws: serialize(eJws), linkedBlock: serialize(ePayload) }

  expect(generated).toEqual(serialize(signed))
})

it('applies genesis commit correctly', async () => {
  const tileHandler = new TileDocumentHandler()

  const commit = (await TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
    controllers: [did.id],
    tags: ['3id'],
  })) as SignedCommitContainer
  await context.ipfs.dag.put(commit, FAKE_CID_1)

  const payload = dagCBOR.decode(commit.linkedBlock)
  await context.ipfs.dag.put(payload, commit.jws.link)

  const signedCommitData = {
    cid: FAKE_CID_1,
    type: CommitType.GENESIS,
    commit: payload,
    envelope: commit.jws,
  }
  const streamState = await tileHandler.applyCommit(signedCommitData, context)
  delete streamState.metadata.unique
  expect(streamState).toMatchSnapshot()
})

it('makes signed commit correctly', async () => {
  const tileDocumentHandler = new TileDocumentHandler()

  await context.ipfs.dag.put(COMMITS.genesisGenerated.jws, FAKE_CID_1)
  await context.ipfs.dag.put(
    COMMITS.genesisGenerated.linkedBlock,
    COMMITS.genesisGenerated.jws.link
  )

  const genesisCommitData = {
    cid: FAKE_CID_1,
    type: CommitType.GENESIS,
    commit: COMMITS.genesisGenerated.linkedBlock,
    envelope: COMMITS.genesisGenerated.jws,
  }
  const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)
  const state$ = TestUtils.runningState(state)
  const doc = new TileDocument(state$, context)

  await expect(doc.makeCommit({} as CeramicApi, COMMITS.r1.desiredContent)).rejects.toThrow(
    /No DID/
  )

  const commit = (await doc.makeCommit(
    context.api,
    COMMITS.r1.desiredContent
  )) as SignedCommitContainer
  const { jws: rJws, linkedBlock: rLinkedBlock } = commit
  const rPayload = dagCBOR.decode(rLinkedBlock)
  expect({ jws: serialize(rJws), payload: serialize(rPayload) }).toEqual(COMMITS.r1.commit)
})

it('applies signed commit correctly', async () => {
  const tileDocumentHandler = new TileDocumentHandler()

  const genesisCommit = (await TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
    controllers: [did.id],
    tags: ['3id'],
  })) as SignedCommitContainer
  await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

  const payload = dagCBOR.decode(genesisCommit.linkedBlock)
  await context.ipfs.dag.put(payload, genesisCommit.jws.link)

  // apply genesis
  const genesisCommitData = {
    cid: FAKE_CID_1,
    type: CommitType.GENESIS,
    commit: payload,
    envelope: genesisCommit.jws,
  }
  let state = await tileDocumentHandler.applyCommit(genesisCommitData, context)

  const state$ = TestUtils.runningState(state)
  const doc = new TileDocument(state$, context)
  const signedCommit = (await doc.makeCommit(
    context.api,
    COMMITS.r1.desiredContent
  )) as SignedCommitContainer

  await context.ipfs.dag.put(signedCommit, FAKE_CID_2)

  const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
  await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

  // apply signed
  const signedCommitData = {
    cid: FAKE_CID_2,
    type: CommitType.SIGNED,
    commit: sPayload,
    envelope: signedCommit.jws,
  }
  state = await tileDocumentHandler.applyCommit(signedCommitData, context, state)
  delete state.metadata.unique
  delete state.next.metadata.unique
  expect(state).toMatchSnapshot()
})

it('throws error if commit signed by wrong DID', async () => {
  const tileDocumentHandler = new TileDocumentHandler()

  const genesisCommit = (await TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
    controllers: ['did:3:fake'],
    tags: ['3id'],
  })) as SignedCommitContainer
  await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

  const payload = dagCBOR.decode(genesisCommit.linkedBlock)
  await context.ipfs.dag.put(payload, genesisCommit.jws.link)

  const genesisCommitData = {
    cid: FAKE_CID_1,
    type: CommitType.GENESIS,
    commit: payload,
    envelope: genesisCommit.jws,
  }
  await expect(tileDocumentHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
    /invalid_jws: not a valid verificationMethod for issuer/
  )
})

it('applies anchor commit correctly', async () => {
  const tileDocumentHandler = new TileDocumentHandler()

  const genesisCommit = (await TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
    controllers: [did.id],
    tags: ['3id'],
  })) as SignedCommitContainer
  await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

  const payload = dagCBOR.decode(genesisCommit.linkedBlock)
  await context.ipfs.dag.put(payload, genesisCommit.jws.link)

  // apply genesis
  const genesisCommitData = {
    cid: FAKE_CID_1,
    type: CommitType.GENESIS,
    commit: payload,
    envelope: genesisCommit.jws,
  }
  let state = await tileDocumentHandler.applyCommit(genesisCommitData, context)

  const state$ = TestUtils.runningState(state)
  const doc = new TileDocument(state$, context)
  const signedCommit = (await doc.makeCommit(
    context.api,
    COMMITS.r1.desiredContent
  )) as SignedCommitContainer

  await context.ipfs.dag.put(signedCommit, FAKE_CID_2)

  const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
  await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

  // apply signed
  const signedCommitData = {
    cid: FAKE_CID_2,
    type: CommitType.SIGNED,
    commit: sPayload,
    envelope: signedCommit.jws,
  }
  state = await tileDocumentHandler.applyCommit(signedCommitData, context, state)

  await context.ipfs.dag.put(COMMITS.proof, FAKE_CID_4)
  // apply anchor
  const anchorCommitData = {
    cid: FAKE_CID_3,
    type: CommitType.ANCHOR,
    commit: COMMITS.r2.commit,
    proof: COMMITS.proof,
  }
  state = await tileDocumentHandler.applyCommit(anchorCommitData, context, state)
  delete state.metadata.unique
  expect(state).toMatchSnapshot()
})
