import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import * as dagCBOR from '@ipld/dag-cbor'
import type { DID } from 'dids'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { ModelHandler } from '../model-handler.js'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import cloneDeep from 'lodash.clonedeep'
import jsonpatch from 'fast-json-patch'
import { Model, ModelAccountRelation, ModelDefinition } from '@ceramicnetwork/stream-model'
import {
  CeramicApi,
  CommitType,
  Context,
  SignedCommitContainer,
  TestUtils,
  IpfsApi,
  CeramicSigner,
  GenesisCommit,
  RawCommit,
} from '@ceramicnetwork/common'
import { parse as parseDidUrl } from 'did-resolver'

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

const jwsForVersion0 = {
  payload: 'bbbb',
  signatures: [
    {
      protected:
        'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
      signature: 'cccc',
    },
  ],
}

const jwsForVersion1 = {
  payload: 'bbbb',
  signatures: [
    {
      protected:
        'ewogICAgImtpZCI6ImRpZDozOmsydDZ3eWZzdTRwZzB0Mm40ajhtczNzMzN4c2dxamh0dG8wNG12cTh3NWEydjV4bzQ4aWR5ejM4bDd5ZGtpP3ZlcnNpb249MSNzaWduaW5nIgp9',
      signature: 'cccc',
    },
  ],
}

const PLACEHOLDER_CONTENT = { name: 'myModel' }

const FINAL_CONTENT: ModelDefinition = {
  name: 'MyModel',
  accountRelation: ModelAccountRelation.LIST,
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
  accountRelation: ModelAccountRelation.LIST,
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

const ThreeIdResolver = {
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

const setDidToNotRotatedState = (did: DID) => {
  const keyDidResolver = KeyDidResolver.getResolver()
  did.setResolver({
    ...keyDidResolver,
    ...ThreeIdResolver,
  })

  did.createJWS = async () => jwsForVersion0
}

// TODO: De-dupe this with similar code from tile-document-handler.test.ts and model-instance-document.test.ts
const rotateKey = (did: DID, rotateDate: string) => {
  did.resolve = async (didUrl) => {
    const { did } = parseDidUrl(didUrl)
    const isVersion0 = /version=0/.exec(didUrl)

    if (isVersion0) {
      return {
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
        didDocumentMetadata: {
          nextUpdate: rotateDate,
        },
      }
    }

    return {
      didResolutionMetadata: { contentType: 'application/did+json' },
      didDocument: wrapDocument(
        {
          publicKeys: {
            signing: 'zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV',
            encryption: 'z6MkjKeH8SgVAYCvTBoyxx7uRJFGM2a9HUeFwfJfd6ctuA3X',
          },
        },
        did
      ),
      didDocumentMetadata: {
        updated: rotateDate,
      },
    }
  }

  did.createJWS = async () => jwsForVersion1
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

  // Add the 'unique' header field to the data used to generate the expected genesis commit
  if (unpacked.linkedBlock.header?.unique) {
    expectedCommit.header['unique'] = unpacked.linkedBlock.header.unique
  }

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
    handler = new ModelHandler()

    setDidToNotRotatedState(did)
  })

  it('is constructed correctly', async () => {
    expect(handler.name).toEqual('model')
  })

  it('makes genesis commits correctly', async () => {
    const commit = await Model._makeGenesis(context.api, FINAL_CONTENT)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: FINAL_CONTENT,
      header: { controllers: [context.api.did.id], model: Model.MODEL.bytes },
    }

    await checkSignedCommitMatchesExpectations(did, commit, expectedGenesis)
  })

  it('supports view properties in genesis commit', async () => {
    const commit = await Model._makeGenesis(context.api, FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW,
      header: { controllers: [context.api.did.id], model: Model.MODEL.bytes },
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

  it('fails to apply signed commit with invalid schema', async () => {
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(
      context.api,
      CONTENT_WITH_INVALID_SCHEMA
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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      `Validation Error: data/$defs must be object, data/properties/stringPropName/type must be equal to one of the allowed values, data/properties/stringPropName/type must be array, data/properties/stringPropName/type must match a schema in anyOf, data/required must be array`
    )
  })

  it('fails to apply signed commit if views validation fails', async () => {
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(
      context.api,
      CONTENT_WITH_INVALID_VIEWS
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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /view definition used with a property also present in schema/
    )
  })

  it('fails to apply genesis commits with extra fields', async () => {
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

  it('makes signed commit correctly', async () => {
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
    const state = await handler.applyCommit(genesisCommitData, context)
    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)

    await expect(doc._makeCommit({} as CeramicApi, FINAL_CONTENT)).rejects.toThrow(/No DID/)

    const commit = (await doc._makeCommit(context.api, FINAL_CONTENT)) as SignedCommitContainer
    const patch = jsonpatch.compare(PLACEHOLDER_CONTENT, FINAL_CONTENT)
    const expectedCommit = { data: patch, prev: FAKE_CID_1, id: FAKE_CID_1 }
    await checkSignedCommitMatchesExpectations(did, commit, expectedCommit)
  })

  it('applies signed commit correctly', async () => {
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
    let state = await handler.applyCommit(genesisCommitData, context)

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
    state = await handler.applyCommit(signedCommitData, context, state)
    delete state.metadata.unique
    delete state.next.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('applies signed commit with views property correctly', async () => {
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
    let state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(
      context.api,
      FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW
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
    state = await handler.applyCommit(signedCommitData, context, state)
    delete state.metadata.unique
    delete state.next.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('incomplete update rejected', async () => {
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
    const state = await handler.applyCommit(genesisCommitData, context)

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /missing a 'accountRelation' field/
    )
  })

  it('updating existing model fails', async () => {
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
    const state = await handler.applyCommit(genesisCommitData, context)

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /Cannot update a finalized Model/
    )
  })

  it('update rejected that adds unexpected field', async () => {
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const signedCommit = (await doc._makeCommit(context.api, {
      ...FINAL_CONTENT,
      foo: 'bar',
    })) as SignedCommitContainer

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      `Unexpected key 'foo' found in content for Model Stream`
    )
  })

  it('throws error if commit signed by wrong DID', async () => {
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

  it('throws error if changes metadata', async () => {
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new Model(state$, context)
    const rawCommit = doc._makeRawCommit(FINAL_CONTENT)
    const newDid = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7zzzz'
    rawCommit.header = { controller: newDid }
    const signedCommit = await Model._signDagJWS(context.api, rawCommit)

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /Updating metadata for Model Streams is not allowed/
    )
  })

  it('applies anchor commit correctly', async () => {
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
    let state = await handler.applyCommit(genesisCommitData, context)

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
    state = await handler.applyCommit(signedCommitData, context, state)

    // apply anchor
    const anchorProof = {
      blockNumber: 123456,
      blockTimestamp: 1615799679,
      chainId: 'fakechain:123',
    }
    await context.ipfs.dag.put(anchorProof, FAKE_CID_3)
    const anchorCommitData = {
      cid: FAKE_CID_4,
      type: CommitType.ANCHOR,
      commit: { proof: FAKE_CID_3, prev: FAKE_CID_2 },
      proof: anchorProof,
    }
    state = await handler.applyCommit(anchorCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('fails to apply commit if old key is used to make the commit and keys have been rotated', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

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

    const state = await handler.applyCommit(genesisCommitData, context)

    rotateKey(did, rotateDate.toISOString())

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /invalid_jws: signature authored with a revoked DID version/
    )
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

    rotateKey(did, rotateDate.toISOString())

    await expect(handler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: signature authored before creation of DID version/
    )
  })

  it('applies commit made using an old key if it is applied within the revocation period', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')
    rotateKey(did, rotateDate.toISOString())

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
    const state = await handler.applyCommit(genesisCommitData, context)
    delete state.metadata.unique

    expect(state).toMatchSnapshot()
  })
})
