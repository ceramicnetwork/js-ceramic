import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import * as dagCBOR from '@ipld/dag-cbor'
import { ModelInstanceDocumentHandler } from '../model-instance-document-handler.js'
import cloneDeep from 'lodash.clonedeep'
import jsonpatch from 'fast-json-patch'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import type { ModelDefinition } from '@ceramicnetwork/stream-model'
import {
  EventType,
  StreamUtils,
  SignedCommitContainer,
  IpfsApi,
  CeramicSigner,
  GenesisCommit,
  RawCommit,
  StreamReaderWriter,
  IntoSigner,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import {
  DID_ID,
  DidTestUtils,
  FAKE_CID_1,
  FAKE_CID_2,
  FAKE_CID_3,
  FAKE_CID_4,
  JWS_VERSION_1,
  RotatingSigner,
} from '@ceramicnetwork/did-test-utils'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { VerificationMethod } from 'did-resolver'
import { afterEach } from 'node:test'

// because we're doing mocking weirdly, by mocking a function two libraries deep, to test a function
// one library deep that is unrelated to ModelInstanceDocumentHandler, we need to specifically duplicate
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

const FAKE_CID_BLOB = CID.parse('bafybeig6xv5nwphfmvcnektpnojts77jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_MODEL_ID = StreamID.fromString(
  'kjzl6hvfrbw6cbclh3fplllid7yvf18w05xw41wvuf9b4lk6q9jkq7d1o01wg6v'
)
const FAKE_MODEL_ID2 = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist5a'
)
const FAKE_MODEL_IDBLOB = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist5b'
)
const FAKE_MODEL_SET_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist50'
)
const FAKE_MODEL_INTERFACE_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist5c'
)
const FAKE_MODEL_REQUIRED_RELATION_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist5d'
)
const FAKE_MODEL_OPTIONAL_RELATION_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist5e'
)
const FAKE_MODEL_INTERFACE_RELATION_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist5f'
)
const FAKE_MODEL_IMPLEMENTS_RELATION_ID = StreamID.fromString(
  'kjzl6hvfrbw6c9aememmuuc3xj3xy0zvzbxstv8dnhl6f3jg7mqeengdgdist5g'
)
const FAKE_MID_ID = StreamID.fromString(
  'k2t6wzhkh1dbrv7qx7oii5uwjngvzgatek9lzvqnv2wq87jvfhafvi1lxbx200'
)
const FAKE_MID_ID2 = StreamID.fromString(
  'k2t6wzhkh1dbrv7qx7oii5uwjngvzgatek9lzvqnv2wq87jvfhafvi1lxbx202'
)
const FAKE_MID_ID3 = StreamID.fromString(
  'k2t6wzhkh1dbrv7qx7oii5uwjngvzgatek9lzvqnv2wq87jvfhafvi1lxbx203'
)
const FAKE_MODEL_IMMUTABLE_ID = StreamID.fromString(
  'kjzl6hvfrbw6c6a53c3qh6mxliozys6ef0njomyg1t1k26xkfe757olhr84rkka'
)

const CONTENT0 = { myData: 0 }
const CONTENT1 = { myData: 1 }
const CONTENT2 = { myData: 2 }
const METADATA = { controller: DID_ID, model: FAKE_MODEL_ID }
const METADATA_WITH_CTX = { controller: DID_ID, model: FAKE_MODEL_ID, context: FAKE_MID_ID }
const METADATA_BLOB = { controller: DID_ID, model: FAKE_MODEL_IDBLOB, deterministic: false }
const DETERMINISTIC_METADATA = { controller: DID_ID, model: FAKE_MODEL_ID2, deterministic: true }

async function checkSignedCommitMatchesExpectations(
  signer: IntoSigner,
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

  const expected = await signer.signer.createDagJWS(expectedCommit)
  expect(expected).toBeDefined()

  const { jws: eJws, linkedBlock: eLinkedBlock } = expected
  const ePayload = dagCBOR.decode(eLinkedBlock)
  const signed = { jws: eJws, linkedBlock: ePayload }

  expect(unpacked).toEqual(signed)
}

const MODEL_DEFINITION: ModelDefinition = {
  name: 'MyModel',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: {
        type: 'integer',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

// Same as MODEL_DEFINITION but uses the SINGLE accountRelation
const MODEL_DEFINITION_SINGLE: ModelDefinition = {
  name: 'MyModel',
  version: '1.0',
  accountRelation: { type: 'single' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: {
        type: 'integer',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

const MODEL_DEFINITION_SET: ModelDefinition = {
  name: 'MyModel',
  version: '2.0',
  interface: false,
  implements: [],
  accountRelation: { type: 'set', fields: ['one', 'two'] },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      one: { type: 'string', minLength: 2 },
      two: { type: 'string', minLength: 2 },
      myData: {
        type: 'integer',
        maximum: 100,
        minimum: 0,
      },
    },
    required: ['myData'],
  },
}

const MODEL_DEFINITION_BLOB: ModelDefinition = {
  name: 'MyBlobModel',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: {
        type: 'string',
      },
    },
    required: ['myData'],
  },
}

const MODEL_INTERFACE_DEFINITION: ModelDefinition = {
  name: 'MyInterfaceModel',
  version: '2.0',
  interface: true,
  implements: [],
  accountRelation: { type: 'none' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: {
        type: 'string',
      },
    },
    required: ['myData'],
  },
}

const MODEL_DEFINITION_REQUIRED_RELATION: ModelDefinition = {
  name: 'MyModel',
  version: '1.0',
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: { type: 'integer', maximum: 100, minimum: 0 },
      relationID: { type: 'string' },
    },
    required: ['myData', 'relationID'],
  },
  relations: {
    relationID: { type: 'document', model: FAKE_MODEL_ID.toString() },
  },
}

const MODEL_DEFINITION_OPTIONAL_RELATION: ModelDefinition = {
  name: 'MyModel',
  version: '2.0',
  interface: false,
  implements: [],
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: { type: 'integer', maximum: 100, minimum: 0 },
      relationID: { type: 'string' },
    },
    required: ['myData'],
  },
  relations: {
    relationID: { type: 'document', model: null },
  },
}

const MODEL_DEFINITION_INTERFACE_RELATION: ModelDefinition = {
  name: 'MyModel',
  version: '2.0',
  interface: false,
  implements: [],
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: { type: 'integer', maximum: 100, minimum: 0 },
      relationID: { type: 'string' },
    },
    required: ['myData'],
  },
  relations: {
    relationID: { type: 'document', model: FAKE_MODEL_INTERFACE_ID.toString() },
  },
}

const MODEL_DEFINITION_IMPLEMENTS_RELATION: ModelDefinition = {
  name: 'MyModel',
  version: '2.0',
  interface: false,
  implements: [FAKE_MODEL_INTERFACE_ID.toString()],
  accountRelation: { type: 'list' },
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    properties: {
      myData: { type: 'integer', maximum: 100, minimum: 0 },
    },
    required: ['myData'],
  },
}

const MODEL_DEFINITION_IMMUTABLE: ModelDefinition = {
  name: 'Person',
  views: {},
  schema: {
    type: 'object',
    $defs: {
      Address: {
        type: 'object',
        title: 'Address',
        required: ['street', 'city', 'zipCode'],
        properties: {
          city: { type: 'string', maxLength: 100, minLength: 5 },
          street: { type: 'string', maxLength: 100, minLength: 5 },
          zipCode: { type: 'string', maxLength: 100, minLength: 5 },
        },
        additionalProperties: false,
      },
    },
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    required: ['name', 'address'],
    properties: {
      name: { type: 'string', maxLength: 100, minLength: 10 },
      address: { $ref: '#/$defs/Address' },
      myArray: { type: 'array', maxItems: 3, items: { type: 'integer' } },
      myMultipleType: { oneOf: [{ type: 'integer' }, { type: 'string' }] },
    },
    additionalProperties: false,
  },
  version: '2.0',
  interface: false,
  relations: {},
  implements: [],
  description: 'Simple person with immutable field',
  accountRelation: { type: 'list' },
  immutableFields: ['address', 'name', 'myArray', 'myMultipleType'],
}

const STREAMS = {
  [FAKE_MODEL_ID.toString()]: {
    content: MODEL_DEFINITION,
    commitId: FAKE_MODEL_ID,
  },
  [FAKE_MODEL_ID2.toString()]: {
    content: MODEL_DEFINITION_SINGLE,
    commitId: FAKE_MODEL_ID2,
  },
  [FAKE_MODEL_IDBLOB.toString()]: {
    content: MODEL_DEFINITION_BLOB,
    commitId: FAKE_MODEL_IDBLOB,
  },
  [FAKE_MODEL_SET_ID.toString()]: {
    idd: FAKE_MODEL_SET_ID,
    content: MODEL_DEFINITION_SET,
    commitId: FAKE_MODEL_ID,
  },
  [FAKE_MODEL_INTERFACE_ID.toString()]: {
    id: FAKE_MODEL_INTERFACE_ID,
    content: MODEL_INTERFACE_DEFINITION,
    commitId: FAKE_MODEL_ID,
  },
  [FAKE_MODEL_REQUIRED_RELATION_ID.toString()]: {
    id: FAKE_MODEL_REQUIRED_RELATION_ID,
    content: MODEL_DEFINITION_REQUIRED_RELATION,
    commitId: FAKE_MODEL_ID,
  },
  [FAKE_MODEL_OPTIONAL_RELATION_ID.toString()]: {
    id: FAKE_MODEL_OPTIONAL_RELATION_ID,
    content: MODEL_DEFINITION_OPTIONAL_RELATION,
    commitId: FAKE_MODEL_ID,
  },
  [FAKE_MODEL_INTERFACE_RELATION_ID.toString()]: {
    id: FAKE_MODEL_INTERFACE_RELATION_ID,
    content: MODEL_DEFINITION_INTERFACE_RELATION,
    commitId: FAKE_MODEL_ID,
  },
  [FAKE_MODEL_IMPLEMENTS_RELATION_ID.toString()]: {
    id: FAKE_MODEL_IMPLEMENTS_RELATION_ID,
    content: MODEL_DEFINITION_IMPLEMENTS_RELATION,
    commitId: FAKE_MODEL_ID,
  },
  [FAKE_MID_ID.toString()]: {
    content: {},
    metadata: { model: FAKE_MODEL_ID },
  },
  [FAKE_MID_ID2.toString()]: {
    content: {},
    metadata: { model: FAKE_MODEL_ID2 },
  },
  [FAKE_MID_ID3.toString()]: {
    content: {},
    metadata: { model: FAKE_MODEL_IMPLEMENTS_RELATION_ID },
  },
  [FAKE_MODEL_IMMUTABLE_ID.toString()]: {
    id: FAKE_MODEL_IMMUTABLE_ID,
    content: MODEL_DEFINITION_IMMUTABLE,
    commitId: FAKE_MODEL_ID,
  },
}

describe('ModelInstanceDocumentHandler', () => {
  let handler: ModelInstanceDocumentHandler
  let context: StreamReaderWriter
  let defaultSigner: RotatingSigner
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

  beforeEach(async () => {
    ModelInstanceDocument.MAX_DOCUMENT_SIZE = 16_000_000

    handler = new ModelInstanceDocumentHandler()

    defaultSigner = await DidTestUtils.rotatingSigner({})
    context = DidTestUtils.api(defaultSigner)
    context.loadStream = jest.fn(async (streamId: StreamID) => {
      const stream = STREAMS[streamId.toString()]
      if (stream == null) {
        throw new Error(
          'Trying to load unexpected stream in model-instance-document-handler.test.ts'
        )
      }
      return stream
    })

    signerUsingNewKey = CeramicSigner.fromDID(
      await DidTestUtils.generateDID({ jws: JWS_VERSION_1 })
    )

    signerUsingOldKey = CeramicSigner.fromDID(await DidTestUtils.generateDID({}))
  })

  afterEach(async () => {
    await handler.shutdown()
  })

  it('is constructed correctly', async () => {
    expect(handler.name).toEqual('MID')
  })

  it('makes genesis commits correctly', async () => {
    const commit = await ModelInstanceDocument._makeGenesis(context.signer, CONTENT0, METADATA)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: CONTENT0,
      header: { controllers: [METADATA.controller], model: METADATA.model.bytes, sep: 'model' },
    }

    await checkSignedCommitMatchesExpectations(context, commit, expectedGenesis)
  })

  it('makes genesis commits correctly with context', async () => {
    const commit = await ModelInstanceDocument._makeGenesis(context, CONTENT0, METADATA_WITH_CTX)
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: CONTENT0,
      header: {
        controllers: [METADATA_WITH_CTX.controller],
        model: METADATA_WITH_CTX.model.bytes,
        sep: 'model',
        context: METADATA_WITH_CTX.context.bytes,
      },
    }

    await checkSignedCommitMatchesExpectations(context, commit, expectedGenesis)
  })

  it('Takes controller from authenticated DID if controller not specified', async () => {
    const commit = await ModelInstanceDocument._makeGenesis(context.signer, CONTENT0, {
      model: FAKE_MODEL_ID,
    })
    expect(commit).toBeDefined()

    const expectedGenesis = {
      data: CONTENT0,
      header: { controllers: [METADATA.controller], model: METADATA.model.bytes, sep: 'model' },
    }

    await checkSignedCommitMatchesExpectations(context, commit, expectedGenesis)
  })

  it('model is required', async () => {
    await expect(ModelInstanceDocument._makeGenesis(context.signer, null, {})).rejects.toThrow(
      /Must specify a 'model' when creating a ModelInstanceDocument/
    )
  })

  it('creates genesis commits uniquely', async () => {
    const commit1 = await ModelInstanceDocument._makeGenesis(context.signer, CONTENT0, METADATA)
    const commit2 = await ModelInstanceDocument._makeGenesis(context.signer, CONTENT0, METADATA)

    expect(commit1).not.toEqual(commit2)
    expect(StreamUtils.isSignedCommitContainer(commit1)).toBeTruthy()
  })

  it('Can create deterministic genesis commit', async () => {
    const commit1 = await ModelInstanceDocument._makeGenesis(context.signer, null, {
      ...METADATA,
      deterministic: true,
    })
    const commit2 = await ModelInstanceDocument._makeGenesis(context.signer, null, {
      ...METADATA,
      deterministic: true,
    })
    expect(commit1).toEqual(commit2)
    expect(StreamUtils.isSignedCommitContainer(commit1)).toBeFalsy()
  })

  it('Can create deterministic genesis commits with a provided unique value', async () => {
    const commit1 = await ModelInstanceDocument._makeGenesis(
      context.signer,
      null,
      DETERMINISTIC_METADATA
    )
    const commit2 = await ModelInstanceDocument._makeGenesis(
      context.signer,
      null,
      DETERMINISTIC_METADATA,
      ['a']
    )
    expect(commit2).not.toEqual(commit1)

    const commit3 = await ModelInstanceDocument._makeGenesis(
      context.signer,
      null,
      DETERMINISTIC_METADATA,
      ['a']
    )
    expect(commit3).toEqual(commit2)

    const commit4 = await ModelInstanceDocument._makeGenesis(
      context.signer,
      null,
      DETERMINISTIC_METADATA,
      ['b']
    )
    expect(commit4).not.toEqual(commit3)
  })

  it('applies genesis commit correctly', async () => {
    const commit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    const streamState = await handler.applyCommit(commitData, context)
    delete streamState.metadata.unique
    expect(streamState).toMatchSnapshot()
  })

  it('applies genesis commit correctly with small allowable content length', async () => {
    const commit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      { myData: 'abcdefghijk' },
      METADATA_BLOB
    )) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_BLOB)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_BLOB,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    const streamState = await handler.applyCommit(commitData, context)
    delete streamState.metadata.unique
    expect(streamState).toMatchSnapshot()
  })

  it('genesis commit with content must be signed', async () => {
    const commit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      DETERMINISTIC_METADATA
    )) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_1)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      /ModelInstanceDocument genesis commit with content must be signed/
    )
  })

  it('applies deterministic genesis commit correctly', async () => {
    const commit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      null,
      DETERMINISTIC_METADATA
    )) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_1)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit,
    }
    expect(commitData.commit.data).toBeNull()

    const streamState = await handler.applyCommit(commitData, context)
    expect(streamState).toMatchSnapshot()
  })

  it('deterministic genesis commit cannot have content', async () => {
    const rawCommit = await ModelInstanceDocument._makeGenesis(
      context,
      CONTENT0,
      DETERMINISTIC_METADATA
    )

    await ipfs.dag.put(rawCommit, FAKE_CID_1)
    const commit = await context.signer.createDagJWS(rawCommit)
    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      /Deterministic genesis commits for ModelInstanceDocuments must not have content/
    )
  })

  it('applies genesis commit correctly with context', async () => {
    const commit = (await ModelInstanceDocument._makeGenesis(
      context,
      CONTENT0,
      METADATA_WITH_CTX
    )) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    const streamState = await handler.applyCommit(commitData, context)
    delete streamState.metadata.unique
    expect(streamState.metadata.context).toBeInstanceOf(StreamID)
    expect(streamState).toMatchSnapshot()
  })

  it('MIDs for Models with SINGLE accountRelations must be created deterministically', async () => {
    const commit = await ModelInstanceDocument._makeGenesis(context.signer, null, {
      ...DETERMINISTIC_METADATA,
      deterministic: false,
    })

    await ipfs.dag.put(commit, FAKE_CID_1)
    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      /ModelInstanceDocuments for models with SINGLE accountRelations must be created deterministically/
    )
  })

  it('MIDs for Models without SINGLE accountRelations must be created uniquely', async () => {
    const rawCommit = await ModelInstanceDocument._makeGenesis(context.signer, CONTENT0, {
      ...METADATA,
      deterministic: true,
    })

    await ipfs.dag.put(rawCommit, FAKE_CID_1)
    const commit = await context.signer.createDagJWS(rawCommit)
    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      /Deterministic ModelInstanceDocuments are only allowed on models that have the SINGLE accountRelation/
    )
  })

  it('model must be a Model streamtype', async () => {
    const nonModelStreamId = StreamID.fromString(
      'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
    )

    const commit = await ModelInstanceDocument._makeGenesis(context.signer, CONTENT0, {
      model: nonModelStreamId,
    })

    await ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      /Model for ModelInstanceDocument must refer to a StreamID of a Model stream/
    )
  })

  it('makes signed commit correctly', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
    }
    const state = await handler.applyCommit(genesisCommitData, context)
    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)

    await expect(
      ModelInstanceDocument.makeUpdateCommit(
        CeramicSigner.invalid(),
        doc.commitId,
        doc.content,
        CONTENT1
      )
    ).rejects.toThrow(/No DID/)

    const commit = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      CONTENT1
    )) as SignedCommitContainer
    const patch = jsonpatch.compare(CONTENT0, CONTENT1)
    const expectedCommit = { data: patch, prev: FAKE_CID_1, id: FAKE_CID_1 }
    await checkSignedCommitMatchesExpectations(context, commit, expectedCommit)
  })

  it('applies signed commit correctly', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
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
    let state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)
    const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      CONTENT1
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
    state = await handler.applyCommit(signedCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('MIDs with SET account relation validate signed commit fields', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      null,
      { ...DETERMINISTIC_METADATA, model: FAKE_MODEL_SET_ID },
      ['foo', 'bar']
    )) as GenesisCommit
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    // apply genesis
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: genesisCommit,
    }
    let state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)

    const signedCommitFail = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      { one: 'foo', two: 'baz', myData: 2 }
    )) as SignedCommitContainer
    await ipfs.dag.put(signedCommitFail, FAKE_CID_2)

    const payloadFail = dagCBOR.decode(signedCommitFail.linkedBlock)
    await ipfs.dag.put(payloadFail, signedCommitFail.jws.link)

    const signedCommitDataFail = {
      cid: FAKE_CID_2,
      type: EventType.DATA,
      commit: payloadFail,
      envelope: signedCommitFail.jws,
    }
    await expect(handler.applyCommit(signedCommitDataFail, context, state)).rejects.toThrow(
      'Unique content fields value does not match metadata. If you are trying to change the value of these fields, this is causing this error: these fields values are not mutable.'
    )

    const signedCommitOK = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      { one: 'foo', two: 'bar', myData: 2 }
    )) as SignedCommitContainer
    await ipfs.dag.put(signedCommitOK, FAKE_CID_3)

    const payloadOK = dagCBOR.decode(signedCommitOK.linkedBlock)
    await ipfs.dag.put(payloadOK, signedCommitOK.jws.link)

    const signedCommitDataOK = {
      cid: FAKE_CID_3,
      type: EventType.DATA,
      commit: payloadOK,
      envelope: signedCommitOK.jws,
    }
    state = await handler.applyCommit(signedCommitDataOK, context, state)
    expect(state).toMatchSnapshot()
  })

  it('MIDs with SET account relation validate content schema on update', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      null,
      { ...DETERMINISTIC_METADATA, model: FAKE_MODEL_SET_ID },
      ['a', 'b']
    )) as GenesisCommit
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    // apply genesis
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: genesisCommit,
    }

    // The deterministic genesis creation works independently of content validation as determinitic commits have no content
    const state = await handler.applyCommit(genesisCommitData, context)
    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)

    const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      { one: 'a', two: 'b', myData: 2 }
    )) as SignedCommitContainer
    await ipfs.dag.put(signedCommit, FAKE_CID_2)

    const payload = dagCBOR.decode(signedCommit.linkedBlock)
    await ipfs.dag.put(payload, signedCommit.jws.link)

    const signedCommitData = {
      cid: FAKE_CID_2,
      type: EventType.DATA,
      commit: payload,
      envelope: signedCommit.jws,
    }
    // MID can't be updated with content that does not pass schema validation
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toMatch(
      'data/one must NOT have fewer than 2 characters, data/two must NOT have fewer than 2 characters'
    )
  })

  it('multiple consecutive updates', async () => {
    const deepCopy = (o) => StreamUtils.deserializeState(StreamUtils.serializeState(o))

    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
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
    const genesisState = await handler.applyCommit(genesisCommitData, context)

    // make a first update
    const state$ = TestUtils.runningState(genesisState)
    let doc = new ModelInstanceDocument(state$, context)
    const signedCommit1 = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      CONTENT1
    )) as SignedCommitContainer

    await ipfs.dag.put(signedCommit1, FAKE_CID_2)
    const sPayload1 = dagCBOR.decode(signedCommit1.linkedBlock)
    await ipfs.dag.put(sPayload1, signedCommit1.jws.link)
    // apply signed
    const signedCommitData_1 = {
      cid: FAKE_CID_2,
      type: EventType.DATA,
      commit: sPayload1,
      envelope: signedCommit1.jws,
    }
    const state1 = await handler.applyCommit(signedCommitData_1, context, deepCopy(genesisState))

    // make a second update on top of the first
    const state1$ = TestUtils.runningState(state1)
    doc = new ModelInstanceDocument(state1$, context)
    const signedCommit2 = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      CONTENT2
    )) as SignedCommitContainer

    await ipfs.dag.put(signedCommit2, FAKE_CID_3)
    const sPayload2 = dagCBOR.decode(signedCommit2.linkedBlock)
    await ipfs.dag.put(sPayload2, signedCommit2.jws.link)

    // apply signed
    const signedCommitData_2 = {
      cid: FAKE_CID_3,
      type: EventType.DATA,
      commit: sPayload2,
      envelope: signedCommit2.jws,
    }
    const state2 = await handler.applyCommit(signedCommitData_2, context, deepCopy(state1))
    delete state2.metadata.unique
    expect(state2).toMatchSnapshot()
  })

  describe('Immutable checks', () => {
    let state
    beforeEach(async () => {
      const customContent = {
        name: 'Foo Bar FooBar',
        address: { city: 'FooVille', street: 'Bar St', zipCode: '10111' },
        myArray: [1, 2],
        myMultipleType: 1,
      }
      const genesisCommit = (await ModelInstanceDocument._makeGenesis(
        context.signer,
        customContent,
        {
          controller: DID_ID,
          model: FAKE_MODEL_IMMUTABLE_ID,
        }
      )) as SignedCommitContainer
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

      state = await handler.applyCommit(genesisCommitData, context)
    })

    it('Rejects commit if scalar field is immutable', async () => {
      const state$ = TestUtils.runningState(state)
      const doc = new ModelInstanceDocument(state$, context)

      const customNewContent = doc.content
      customNewContent.name = 'Foo Bar FooFoo'
      const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
        context.signer,
        doc.commitId,
        doc.content,
        customNewContent
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

      await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
        `Immutable field "name" cannot be updated`
      )
    })

    it('Rejects commit if nested field is immutable', async () => {
      const state$ = TestUtils.runningState(state)
      const doc = new ModelInstanceDocument(state$, context)

      const customNewContent = doc.content
      customNewContent.address = { city: 'BarVille', street: 'Bar St', zipCode: '10111' }
      const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
        context.signer,
        doc.commitId,
        doc.content,
        customNewContent
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

      await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
        `Immutable field "address" cannot be updated`
      )
    })

    it('Rejects commit if array field is immutable', async () => {
      const state$ = TestUtils.runningState(state)
      const doc = new ModelInstanceDocument(state$, context)

      const customNewContent = doc.content
      customNewContent.myArray = [1, 2, 3]
      const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
        context.signer,
        doc.commitId,
        doc.content,
        customNewContent
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

      await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
        `Immutable field "myArray" cannot be updated`
      )
    })

    it('Rejects commit on schema that allows multiple types', async () => {
      const state$ = TestUtils.runningState(state)
      const doc = new ModelInstanceDocument(state$, context)

      const customNewContent = doc.content
      customNewContent.myMultipleType = '1'
      const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
        context.signer,
        doc.commitId,
        doc.content,
        customNewContent
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

      await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
        `Immutable field "myMultipleType" cannot be updated`
      )
    })
  })

  test('throws error when applying genesis commit with invalid schema', async () => {
    const commit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      {},
      METADATA
    )) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }

    await expect(handler.applyCommit(commitData, context)).rejects.toMatch(
      /data must have required property 'myData'/
    )
  })

  test('throws error when applying genesis commit with invalid length', async () => {
    ModelInstanceDocument.MAX_DOCUMENT_SIZE = 10
    await expect(
      ModelInstanceDocument._makeGenesis(context.signer, { myData: 'abcdefghijk' }, METADATA)
    ).rejects.toThrow(/which exceeds maximum size/)
  })

  test('throws error when applying signed commit with invalid schema', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)
    const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      {}
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

    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toMatch(
      /data must have required property 'myData'/
    )
  })

  it.skip('throws error if commit signed by wrong DID', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(context.signer, CONTENT0, {
      controller: 'did:3:fake',
      model: FAKE_MODEL_ID,
    })) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: Date.now(),
    }

    await expect(handler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: not a valid verificationMethod for issuer/
    )
  })

  it('throws error if changes metadata', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)
    const rawCommit = ModelInstanceDocument._makeRawCommit(doc.commitId, doc.content, CONTENT1)
    const newDid = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7zzzz'
    rawCommit.header = { controllers: [newDid] }
    const signedCommit = await context.signer.createDagJWS(rawCommit)

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /Updating metadata for ModelInstanceDocument Streams is not allowed/
    )
  })

  it('fails to apply commit with invalid prev link', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)
    const rawCommit = ModelInstanceDocument._makeRawCommit(doc.commitId, doc.content, CONTENT1)
    rawCommit.prev = FAKE_CID_3
    const signedCommit = await context.signer.createDagJWS(rawCommit)

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /Commit doesn't properly point to previous commit in log/
    )
  })

  it('fails to apply commit with invalid id property', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
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
    const state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)
    const rawCommit = ModelInstanceDocument._makeRawCommit(doc.commitId, doc.content, CONTENT1)
    rawCommit.id = FAKE_CID_3
    const signedCommit = await context.signer.createDagJWS(rawCommit)

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
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /Invalid genesis CID in commit/
    )
  })

  it('applies anchor commit correctly', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      context.signer,
      CONTENT0,
      METADATA
    )) as SignedCommitContainer
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
    let state = await handler.applyCommit(genesisCommitData, context)

    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)
    const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
      context.signer,
      doc.commitId,
      doc.content,
      CONTENT1
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
    state = await handler.applyCommit(signedCommitData, context, state)

    // apply anchor
    const anchorProof = {
      chainId: 'fakechain:123',
    }
    await ipfs.dag.put(anchorProof, FAKE_CID_3)
    const anchorCommitData = {
      cid: FAKE_CID_4,
      type: EventType.TIME,
      commit: { proof: FAKE_CID_3, id: FAKE_CID_1, prev: FAKE_CID_2 },
      proof: anchorProof,
      timestamp: 1615799679,
    }
    state = await handler.applyCommit(anchorCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it.skip('fails to apply commit if old key is used to make the commit and keys have been rotated', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    // make and apply genesis with old key
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(signerUsingOldKey, CONTENT0, {
      model: FAKE_MODEL_ID,
    })) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    // genesis commit applied one hour before rotation
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: rotateDate.valueOf() / 1000 - 60 * 60,
    }

    const state = await handler.applyCommit(genesisCommitData, context)

    // make update with old key
    const state$ = TestUtils.runningState(state)
    const doc = new ModelInstanceDocument(state$, context)
    const signedCommit = (await ModelInstanceDocument.makeUpdateCommit(
      signerUsingOldKey,
      doc.commitId,
      doc.content,
      CONTENT1
    )) as SignedCommitContainer

    await ipfs.dag.put(signedCommit, FAKE_CID_2)

    const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
    await ipfs.dag.put(sPayload, signedCommit.jws.link)

    const signedCommitData = {
      cid: FAKE_CID_2,
      type: EventType.DATA,
      commit: sPayload,
      envelope: signedCommit.jws,
      // 24 hours after rotation
      timestamp: rotateDate.valueOf() / 1000 + 24 * 60 * 60,
    }

    // applying a commit made with the old key after rotation
    DidTestUtils.withRotationDate(defaultSigner, rotateDate.toISOString())
    await expect(handler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /invalid_jws: signature authored with a revoked DID version/
    )
  })

  it.skip('fails to apply commit if new key used before rotation', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    // make genesis with new key
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(signerUsingNewKey, CONTENT0, {
      model: FAKE_MODEL_ID,
    })) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    // commit is applied 1 hour before rotation
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: rotateDate.valueOf() / 1000 - 60 * 60,
    }

    // applying a commit made with the old key after rotation
    DidTestUtils.withRotationDate(defaultSigner, rotateDate.toISOString())
    await expect(handler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: signature authored before creation of DID version/
    )
  })

  it('applies commit made using an old key if it is applied within the revocation period', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    // make genesis commit using old key
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(signerUsingOldKey, CONTENT0, {
      model: FAKE_MODEL_ID,
    })) as SignedCommitContainer
    await ipfs.dag.put(genesisCommit, FAKE_CID_1)

    const payload = dagCBOR.decode(genesisCommit.linkedBlock)
    await ipfs.dag.put(payload, genesisCommit.jws.link)

    // commit is applied 1 hour after the rotation
    const genesisCommitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: genesisCommit.jws,
      timestamp: Math.floor(rotateDate.valueOf() / 1000) + 60 * 60,
    }
    // applying a commit made with the old key after rotation
    DidTestUtils.withRotationDate(defaultSigner, rotateDate.toISOString())
    const state = await handler.applyCommit(genesisCommitData, context)
    delete state.metadata.unique

    expect(state).toMatchSnapshot()
  })

  test('throws when trying to create a MID with an interface model', async () => {
    const commit = (await ModelInstanceDocument._makeGenesis(defaultSigner, CONTENT0, {
      controller: METADATA.controller,
      model: FAKE_MODEL_INTERFACE_ID,
    })) as SignedCommitContainer
    await ipfs.dag.put(commit, FAKE_CID_1)

    const payload = dagCBOR.decode(commit.linkedBlock)
    await ipfs.dag.put(payload, commit.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: payload,
      envelope: commit.jws,
    }
    await expect(handler.applyCommit(commitData, context)).rejects.toThrow(
      `ModelInstanceDocument Streams cannot be created on interface Models. Use a different model than ${FAKE_MODEL_INTERFACE_ID.toString()} to create the ModelInstanceDocument.`
    )
  })

  test('validates relations with required model - throws if invalid', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      defaultSigner,
      { myData: 3, relationID: FAKE_MID_ID2.toString() },
      { controller: METADATA.controller, model: FAKE_MODEL_REQUIRED_RELATION_ID }
    )) as SignedCommitContainer
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
    await expect(handler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      `Relation on field relationID points to Stream ${FAKE_MID_ID2.toString()}, which belongs to Model ${FAKE_MODEL_ID2.toString()}, but this Stream's Model (${FAKE_MODEL_REQUIRED_RELATION_ID.toString()}) specifies that this relation must be to a Stream in the Model ${FAKE_MODEL_ID.toString()}`
    )
  })

  test('validates relations with required model - model match', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      defaultSigner,
      { myData: 3, relationID: FAKE_MID_ID.toString() },
      { controller: METADATA.controller, model: FAKE_MODEL_REQUIRED_RELATION_ID }
    )) as SignedCommitContainer
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
    await expect(handler.applyCommit(genesisCommitData, context)).resolves.not.toThrow()
  })

  test('validates relations with optional model - linked MID not provided', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      defaultSigner,
      { myData: 3 },
      { controller: METADATA.controller, model: FAKE_MODEL_OPTIONAL_RELATION_ID }
    )) as SignedCommitContainer
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
    await expect(handler.applyCommit(genesisCommitData, context)).resolves.not.toThrow()
  })

  test('validates relations with optional model - linked MID provided', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      defaultSigner,
      { myData: 3, relationID: FAKE_MID_ID2.toString() },
      { controller: METADATA.controller, model: FAKE_MODEL_OPTIONAL_RELATION_ID }
    )) as SignedCommitContainer
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
    await expect(handler.applyCommit(genesisCommitData, context)).resolves.not.toThrow()
  })

  test('validates relations with interface model', async () => {
    const genesisCommit = (await ModelInstanceDocument._makeGenesis(
      defaultSigner,
      { myData: 3, relationID: FAKE_MID_ID3.toString() },
      { controller: METADATA.controller, model: FAKE_MODEL_INTERFACE_RELATION_ID }
    )) as SignedCommitContainer
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

    await expect(handler.applyCommit(genesisCommitData, context)).resolves.not.toThrow()
  })
})
