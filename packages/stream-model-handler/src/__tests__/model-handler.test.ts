import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import * as dagCBOR from '@ipld/dag-cbor'
import type { DID } from 'dids'
import { ModelHandler } from '../model-handler.js'
import cloneDeep from 'lodash.clonedeep'
import { Model, ModelDefinition } from '@ceramicnetwork/stream-model'
import {
  CeramicApi,
  CommitType,
  Context,
  SignedCommitContainer,
  IpfsApi,
  CeramicSigner,
  GenesisCommit,
  RawCommit,
} from '@ceramicnetwork/common'
import {
  DidTestUtils,
  FAKE_CID_1,
  FAKE_CID_3,
  FAKE_CID_4,
  JWS_VERSION_0,
  JWS_VERSION_1,
} from '@ceramicnetwork/did-test-utils'

const PLACEHOLDER_CONTENT = { name: 'myModel' }

const FINAL_CONTENT: ModelDefinition = {
  name: 'MyModel',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      stringPropName: {
        type: 'string',
        maxLength: 80,
      },
    },
    additionalProperties: false,
    required: ['stringPropName'],
  },
}

const FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW: ModelDefinition = {
  ...FINAL_CONTENT,
  views: {
    owner: { type: 'documentAccount' },
  },
}

const CONTENT_WITH_INVALID_VIEWS: ModelDefinition = {
  ...FINAL_CONTENT,
  views: {
    stringPropName: { type: 'documentAccount' },
  },
}

const CONTENT_WITH_INVALID_SCHEMA = {
  name: 'MyModel',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      stringPropName: {
        type: 'CLEARLY_A_WRONG_TYPE',
      },
    },
    $defs: ['$DEFS_SHOULD_BE_AN_OBJECT'],
    additionalProperties: false,
    required: 'THIS_SHOULD_BE_AN_ARRAY_OF_STRINGS',
  },
}

async function checkSignedCommitMatchesExpectations(
  did: DID,
  commit: SignedCommitContainer,
  expectedCommit: GenesisCommit | RawCommit
) {
  const { jws, linkedBlock } = commit
  expect(jws).toBeDefined()
  expect(linkedBlock).toBeDefined()

  const payload = dagCBOR.decode(linkedBlock)

  const unpacked = { jws, linkedBlock: payload }

  const expected = await did.createDagJWS(expectedCommit)
  expect(expected).toBeDefined()

  const { jws: eJws, linkedBlock: eLinkedBlock } = expected
  const ePayload = dagCBOR.decode(eLinkedBlock)
  const signed = { jws: eJws, linkedBlock: ePayload }

  expect(unpacked).toEqual(signed)
}

describe('ModelHandler', () => {
  let did: DID
  let handler: ModelHandler
  let context: Context
  let signerUsingNewKey: CeramicSigner
  let signerUsingOldKey: CeramicSigner
  let ipfs: IpfsApi

  beforeAll(async () => {
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
  })

  beforeEach(() => {
    handler = new ModelHandler()

    did = DidTestUtils.generateDID()
    const api = DidTestUtils.apiForDid(did)

    signerUsingNewKey = { did: DidTestUtils.generateDID() }
    signerUsingNewKey.did.createJWS = async () => JWS_VERSION_1

    signerUsingOldKey = { did: DidTestUtils.generateDID() }
    signerUsingOldKey.did.createJWS = async () => JWS_VERSION_0

    context = {
      did,
      ipfs,
      anchorService: null,
      api: api as unknown as CeramicApi,
    }
  })

  it('is constructed correctly', async () => {
    expect(handler.name).toEqual('model')
  })

  it('makes genesis commits correctly', async () => {
    const commit = await Model._makeGenesis(context.api, FINAL_CONTENT)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: FINAL_CONTENT,
      header: { controllers: [context.api.did.id], model: Model.MODEL.bytes, sep: 'model' },
    }

    await checkSignedCommitMatchesExpectations(did, commit, expectedGenesis)
  })

  it('supports view properties in genesis commit', async () => {
    const commit = await Model._makeGenesis(context.api, FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW,
      header: { controllers: [context.api.did.id], model: Model.MODEL.bytes, sep: 'model' },
    }

    await checkSignedCommitMatchesExpectations(did, commit, expectedGenesis)
  })

  it('Content is required', async () => {
    await expect(Model._makeGenesis(context.api, null)).rejects.toThrow(
      /Genesis content cannot be null/
    )
  })

  it('creates genesis commits deterministically', async () => {
    const commit1 = await Model._makeGenesis(context.api, FINAL_CONTENT)
    const commit2 = await Model._makeGenesis(context.api, FINAL_CONTENT)

    expect(commit1).toEqual(commit2)
  })

  it('applies genesis commit correctly', async () => {
    DidTestUtils.disableJwsVerification(context.did)
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
    const streamState = await handler.applyCommit(commitData, context)
    expect(streamState).toMatchSnapshot()
  })

  it('applies genesis commits with views properties correctly', async () => {
    DidTestUtils.disableJwsVerification(context.did)
    const commit = (await Model._makeGenesis(
      context.api,
      FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW
    )) as SignedCommitContainer
    await context.ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await context.ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: commit.jws,
    }
    const streamState = await handler.applyCommit(commitData, context)
    expect(streamState).toMatchSnapshot()
  })

  it('fails to apply genesis commits with invalid schema', async () => {
    DidTestUtils.disableJwsVerification(context.did)
    const commit = (await Model._makeGenesis(
      context.api,
      CONTENT_WITH_INVALID_SCHEMA
    )) as SignedCommitContainer
    await context.ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await context.ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      `Validation Error: data/$defs must be object, data/properties/stringPropName/type must be equal to one of the allowed values, data/properties/stringPropName/type must be array, data/properties/stringPropName/type must match a schema in anyOf, data/required must be array`
    )
  })

  it(`fails to apply genesis commits if views validation fails`, async () => {
    DidTestUtils.disableJwsVerification(context.did)
    const commit = (await Model._makeGenesis(
      context.api,
      CONTENT_WITH_INVALID_VIEWS
    )) as SignedCommitContainer
    await context.ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await context.ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      /view definition used with a property also present in schema/
    )
  })

  it('fails to apply signed commit', async () => {
    await expect(handler.applyCommit({}, context, {})).rejects.toThrow(
      `Cannot update a finalized Model`
    )
  })

  it('fails to apply genesis commits with extra fields', async () => {
    DidTestUtils.disableJwsVerification(context.did)
    const commit = (await Model._makeGenesis(context.api, {
      ...PLACEHOLDER_CONTENT,
      foo: 'bar',
    })) as SignedCommitContainer
    await context.ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await context.ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      `Unexpected key 'foo' found in content for Model Stream`
    )
  })

  it('throws error if commit signed by DID that is not controller', async () => {
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
    await expect(handler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: not a valid verificationMethod for issuer/
    )
  })

  it('applies anchor commit correctly', async () => {
    DidTestUtils.disableJwsVerification(context.did)
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
    let state = await handler.applyCommit(genesisCommitData, context)

    // apply anchor
    const anchorProof = {
      chainId: 'fakechain:123',
    }
    await context.ipfs.dag.put(anchorProof, FAKE_CID_3)
    const anchorCommitData = {
      cid: FAKE_CID_4,
      type: CommitType.ANCHOR,
      commit: { proof: FAKE_CID_3, id: FAKE_CID_1, prev: FAKE_CID_1 },
      proof: anchorProof,
      timestamp: 1615799679,
    }
    state = await handler.applyCommit(anchorCommitData, context, state)
    expect(state).toMatchSnapshot()
  })

  it('fails to apply commit if new key used before rotation', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

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

    context.api = DidTestUtils.apiForDid(
      DidTestUtils.generateDID({
        ignoreValidation: false,
      })
    )

    DidTestUtils.rotateKey(context.did, rotateDate.toISOString())

    await expect(handler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: signature authored before creation of DID version/
    )
  })

  it('applies commit made using an old key if it is applied within the revocation period', async () => {
    DidTestUtils.disableJwsVerification(context.did)
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')
    DidTestUtils.rotateKey(did, rotateDate.toISOString())

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
      timestamp: Math.floor(rotateDate.valueOf() / 1000) + 60 * 60,
    }
    const state = await handler.applyCommit(genesisCommitData, context)
    expect(state).toMatchSnapshot()
  })
})
