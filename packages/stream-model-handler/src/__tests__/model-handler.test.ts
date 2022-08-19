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


describe('ModelHandler', () => {
  let did: DID
  let handler: ModelHandler
  let context: Context

  beforeAll(async () => {
    process.env.CERAMIC_ENABLE_EXPERIMENTAL_INDEXING = 'true'

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

    context = {
      did,
      ipfs,
      anchorService: null,
      api: api as unknown as CeramicApi,
    }
  })

  beforeEach(() => {
    handler = new ModelHandler()
  })

  it('is constructed correctly', async () => {
    expect(handler.name).toEqual('model')
  })

  it('makes genesis commits correctly', async () => {
    const commit = await Model._makeGenesis(context.api, FINAL_CONTENT)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: FINAL_CONTENT,
      header: { model: Model.MODEL.bytes },
    }


    expect(typeof commit.header.unique).toBeDefined()
    delete commit.header.unique
    expect(expectedGenesis).toEqual(commit)
  })

  it('supports view properties in genesis commit', async () => {
    const commit = await Model._makeGenesis(context.api, FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: FINAL_CONTENT_WITH_ACCOUNT_DOCUMENT_VIEW,
      header: { model: Model.MODEL.bytes },
    }

    expect(typeof commit.header.unique).toBeDefined()
    delete commit.header.unique
    expect(expectedGenesis).toEqual(commit)
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

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit,
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

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit,
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

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit,
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

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      /view definition used with a property also present in schema/
    )
  })

  it('fails to apply genesis commit with placeholder content', async () => {
    const genesisCommit = (await Model._makeGenesis(
      context.api,
      PLACEHOLDER_CONTENT
    )) as SignedCommitContainer

    // apply genesis
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: genesisCommit,
    }

    await expect(handler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      `Validation Error: schema must be defined`
    )
  })

  it('fails to apply genesis commits with extra fields', async () => {
    const commit = (await Model._makeGenesis(context.api, {
      ...PLACEHOLDER_CONTENT,
      foo: 'bar',
    })) as SignedCommitContainer

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      `Unexpected key 'foo' found in content for Model Stream`
    )
  })

  it('Does not allow signed commits', async () => {
    const genesisCommit = (await Model._makeGenesis(
      context.api,
      FINAL_CONTENT
    )) as SignedCommitContainer

    // apply genesis
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: genesisCommit,
    }
    let state = await handler.applyCommit(genesisCommitData, context)

    // apply signed
    const signedCommitData = {
      cid: FAKE_CID_2,
      type: CommitType.SIGNED,
      commit: FINAL_CONTENT,
    }
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      `Cannot update a finalized Model`
    )
  })

  it('applies anchor commit correctly', async () => {
    const genesisCommit = (await Model._makeGenesis(
      context.api,
      FINAL_CONTENT
    )) as SignedCommitContainer

    // apply genesis
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: genesisCommit,
    }
    let state = await handler.applyCommit(genesisCommitData, context)

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
      commit: { proof: FAKE_CID_3, id: FAKE_CID_1, prev: FAKE_CID_1 },
      proof: anchorProof,
    }
    state = await handler.applyCommit(anchorCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })
})
