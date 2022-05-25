import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import * as dagCBOR from '@ipld/dag-cbor'
import type { DID } from 'dids'
import * as KeyDidResolver from 'key-did-resolver'
import { ModelHandler } from '../model-handler.js'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import cloneDeep from 'lodash.clonedeep'
import jsonpatch from 'fast-json-patch'
import { Model, ModelAccountRelation } from '@ceramicnetwork/stream-model'
import {
  CeramicApi,
  CommitType,
  Context,
  SignedCommitContainer,
  TestUtils,
  IpfsApi,
  CeramicSigner,
} from '@ceramicnetwork/common'

jest.unstable_mockModule('did-jwt', () => {
  return {
    // TODO - We should test for when this function throws as well
    // Mock: Blindly accept a signature
    verifyJWS: (): void => {
      return
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

const hash = (data: string): CID => {
  const body = uint8arrays.concat([
    uint8arrays.fromString('1220', 'base16'),
    sha256.hash(uint8arrays.fromString(data)),
  ])
  return CID.create(1, 0x12, decodeMultiHash(body))
}

const FAKE_CID_1 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_2 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_3 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts55jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID_4 = CID.parse('bafybeig6xv5nwphfmvcnektpnojts66jqcuam7bmye2pb54adnrtccjlsu')
const DID_ID = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'

const PLACEHOLDER_CONTENT = { name: 'myModel' }

const FINAL_CONTENT = {
  name: 'myModel',
  schema: {},
  accountRelation: ModelAccountRelation.LIST,
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

async function checkSignedCommitMatchesExpectations(
  did: DID,
  commit: SignedCommitContainer,
  expectedCommit: Record<string, any>
) {
  const { jws, linkedBlock } = commit
  expect(jws).toBeDefined()
  expect(linkedBlock).toBeDefined()

  const payload = dagCBOR.decode(linkedBlock)

  const serialized = { jws: serialize(jws), linkedBlock: serialize(payload) }

  // Add the 'unique' header field to the data used to generate the expected genesis commit
  if (serialized.linkedBlock.header?.unique) {
    expectedCommit.header['unique'] = serialized.linkedBlock.header.unique
  }

  const expected = await did.createDagJWS(expectedCommit)
  expect(expected).toBeDefined()

  const { jws: eJws, linkedBlock: eLinkedBlock } = expected
  const ePayload = dagCBOR.decode(eLinkedBlock)
  const signed = { jws: serialize(eJws), linkedBlock: serialize(ePayload) }

  expect(serialized).toEqual(signed)
}

describe('ModelHandler', () => {
  let did: DID
  let modelHandler: ModelHandler
  let context: Context
  let signerUsingNewKey: CeramicSigner
  let signerUsingOldKey: CeramicSigner

  beforeAll(async () => {
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
    } as IpfsApi

    const keyDidResolver = KeyDidResolver.getResolver()
    const { DID } = await import('dids')
    did = new DID({
      resolver: {
        ...keyDidResolver,
      },
    })
    ;(did as any)._id = DID_ID
    const api = {
      getSupportedChains: jest.fn(async () => {
        return ['fakechain:123']
      }),
      did,
    }

    signerUsingNewKey = { did: new DID({}) }
    ;(signerUsingNewKey.did as any)._id = DID_ID
    signerUsingNewKey.did.createJWS = async () => jwsForVersion1

    signerUsingOldKey = { did: new DID({}) }
    ;(signerUsingOldKey.did as any)._id = DID_ID
    signerUsingOldKey.did.createJWS = async () => jwsForVersion0

    context = {
      did,
      ipfs,
      anchorService: null,
      api: api as unknown as CeramicApi,
    }
  })

  beforeEach(() => {
    modelHandler = new ModelHandler()

    TestUtils.resetDidToNotRotatedState(did)
  })

  it('is constructed correctly', async () => {
    expect(modelHandler.name).toEqual('model')
  })

  it('makes genesis commits correctly', async () => {
    const commit = await Model._makeGenesis(context.api, FINAL_CONTENT)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: FINAL_CONTENT,
      header: { controllers: [context.api.did.id], model: Model._MODEL.bytes },
    }

    await checkSignedCommitMatchesExpectations(did, commit, expectedGenesis)
  })

  it('Content is required', async () => {
    await expect(Model._makeGenesis(context.api, null)).rejects.toThrow(
      /Genesis content cannot be null/
    )
  })

  it('creates genesis commits uniquely', async () => {
    const commit1 = await Model._makeGenesis(context.api, FINAL_CONTENT)
    const commit2 = await Model._makeGenesis(context.api, FINAL_CONTENT)

    expect(commit1).not.toEqual(commit2)
  })

  it('applies genesis commit correctly', async () => {
    const modelHandler = new ModelHandler()

    const commit = (await Model._makeGenesis(context.api, FINAL_CONTENT)) as SignedCommitContainer
    await context.ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await context.ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: commit.jws,
    }
    const streamState = await modelHandler.applyCommit(commitData, context)
    delete streamState.metadata.unique
    expect(streamState).toMatchSnapshot()
  })

  it('makes signed commit correctly', async () => {
    const modelHandler = new ModelHandler()

    const genesisCommit = (await Model._makeGenesis(
      context.api,
      PLACEHOLDER_CONTENT
    )) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: genesisCommit.jws,
    }
    const state = await modelHandler.applyCommit(genesisCommitData, context)
    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)

    await expect(doc._makeCommit({} as CeramicApi, FINAL_CONTENT)).rejects.toThrow(/No DID/)

    const commit = (await doc._makeCommit(context.api, FINAL_CONTENT)) as SignedCommitContainer
    const patch = jsonpatch.compare(PLACEHOLDER_CONTENT, FINAL_CONTENT)
    const expectedCommit = { data: patch, prev: FAKE_CID_1, id: FAKE_CID_1 }
    await checkSignedCommitMatchesExpectations(did, commit, expectedCommit)
  })

  it('applies signed commit correctly', async () => {
    const modelHandler = new ModelHandler()

    const genesisCommit = (await Model._makeGenesis(
      context.api,
      PLACEHOLDER_CONTENT
    )) as SignedCommitContainer
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
    let state = await modelHandler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(
      context.api,
      FINAL_CONTENT
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
    state = await modelHandler.applyCommit(signedCommitData, context, state)
    delete state.metadata.unique
    delete state.next.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('incomplete update rejected', async () => {
    const modelHandler = new ModelHandler()

    const genesisCommit = (await Model._makeGenesis(
      context.api,
      PLACEHOLDER_CONTENT
    )) as SignedCommitContainer
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
    let state = await modelHandler.applyCommit(genesisCommitData, context)

    const incompleteFinalConent = { name: 'myModel', schema: {} }
    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(
      context.api,
      incompleteFinalConent
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
    await expect(modelHandler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /missing a 'accountRelation' field/
    )
  })

  it('updating existing model fails', async () => {
    const modelHandler = new ModelHandler()

    const genesisCommit = (await Model._makeGenesis(
      context.api,
      FINAL_CONTENT
    )) as SignedCommitContainer
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
    let state = await modelHandler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const updatedContent = {
      ...FINAL_CONTENT,
      name: 'updatedName',
    }
    const signedCommit = (await doc._makeCommit(
      context.api,
      updatedContent
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
    await expect(modelHandler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /Cannot update a finalized Model/
    )
  })

  it('throws error if commit signed by wrong DID', async () => {
    const modelHandler = new ModelHandler()

    const genesisCommit = (await Model._makeGenesis(context.api, FINAL_CONTENT, {
      controller: 'did:3:fake',
    })) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: Date.now(),
    }
    await expect(modelHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: not a valid verificationMethod for issuer/
    )
  })

  it('applies anchor commit correctly', async () => {
    const modelHandler = new ModelHandler()

    const genesisCommit = (await Model._makeGenesis(
      context.api,
      PLACEHOLDER_CONTENT
    )) as SignedCommitContainer
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
    let state = await modelHandler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(
      context.api,
      FINAL_CONTENT
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
    state = await modelHandler.applyCommit(signedCommitData, context, state)

    const anchorProof = {
      blockNumber: 123456,
      blockTimestamp: 1615799679,
      chainId: 'fakechain:123',
    }
    await context.ipfs.dag.put(anchorProof, FAKE_CID_3)
    // apply anchor
    const anchorCommitData = {
      cid: FAKE_CID_4,
      type: CommitType.ANCHOR,
      commit: { proof: FAKE_CID_3 },
      proof: anchorProof,
    }
    state = await modelHandler.applyCommit(anchorCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('fails to apply commit if old key is used to make the commit and keys have been rotated', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    const modelHandler = new ModelHandler()

    // make and apply genesis with old key
    const genesisCommit = (await Model._makeGenesis(
      signerUsingOldKey,
      PLACEHOLDER_CONTENT
    )) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    // genesis commit applied one hour before rotation
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: rotateDate.valueOf() / 1000 - 60 * 60,
    }

    const state = await modelHandler.applyCommit(genesisCommitData, context)

    TestUtils.rotateKey(did, rotateDate.toISOString())

    // make update with old key
    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(
      signerUsingOldKey,
      FINAL_CONTENT
    )) as SignedCommitContainer

    await context.ipfs.dag.put(signedCommit, FAKE_CID_2)

    const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
    await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

    const signedCommitData = {
      cid: FAKE_CID_2,
      type: CommitType.SIGNED,
      commit: sPayload,
      envelope: signedCommit.jws,
      // 24 hours after rotation
      timestamp: rotateDate.valueOf() / 1000 + 24 * 60 * 60,
    }

    // applying a commit made with the old key after rotation
    await expect(modelHandler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /invalid_jws: signature authored with a revoked DID version/
    )
  })

  it('fails to apply commit if new key used before rotation', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    const modelHandler = new ModelHandler()

    // make genesis with new key
    const genesisCommit = (await Model._makeGenesis(
      signerUsingNewKey,
      FINAL_CONTENT
    )) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    // commit is applied 1 hour before rotation
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: rotateDate.valueOf() / 1000 - 60 * 60,
    }

    TestUtils.rotateKey(did, rotateDate.toISOString())

    await expect(modelHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: signature authored before creation of DID version/
    )
  })

  it('applies commit made using an old key if it is applied within the revocation period', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')
    TestUtils.rotateKey(did, rotateDate.toISOString())

    const modelHandler = new ModelHandler()

    // make genesis commit using old key
    const genesisCommit = (await Model._makeGenesis(
      signerUsingOldKey,
      FINAL_CONTENT
    )) as SignedCommitContainer
    await context.ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await context.ipfs.dag.put(payload, genesisCommit.jws.link)

    // commit is applied 1 hour after the rotation
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: rotateDate.valueOf() / 1000 + 60 * 60,
    }
    const state = await modelHandler.applyCommit(genesisCommitData, context)
    delete state.metadata.unique

    expect(state).toMatchSnapshot()
  })
})
