import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import * as dagCBOR from '@ipld/dag-cbor'
import type { DID } from 'dids'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import { TileDocumentHandler } from '../tile-document-handler.js'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import cloneDeep from 'lodash.clonedeep'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  CeramicApi,
  CommitType,
  Context,
  StreamUtils,
  SignedCommitContainer,
  TestUtils,
  IpfsApi,
  GenesisCommit,
  CeramicSigner,
  CommitData,
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

// did:3:bafyasdfasdf

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

const COMMITS = {
  genesis: {
    header: {
      controllers: [DID_ID],
    },
    data: { much: 'data' },
  },
  genesisGenerated: {
    jws: {
      payload: 'bbbb',
      signatures: [
        {
          protected:
            'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
          signature: 'cccc',
        },
      ],
      link: CID.parse('bafyreiau5pqllna6pewhp3w2hbvohxxeqsmffnwf6o2fwoln4ubbc6fldq'),
    },
    linkedBlock: {
      data: {
        much: 'data',
      },
      header: {
        controllers: [DID_ID],
      },
    },
  },
  r1: {
    desiredContent: { much: 'data', very: 'content' },
    commit: {
      jws: {
        payload: 'bbbb',
        signatures: [
          {
            protected:
              'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
            signature: 'cccc',
          },
        ],
        link: 'bafyreia6chsgnfihmdrl2d36llrfevc6xgmgzryi3ittdg3j5ohdifb7he',
      },
      linkedPayload: {
        id: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
        data: [
          {
            op: 'add',
            path: '/very',
            value: 'content',
          },
        ],
        prev: 'bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu',
        header: {},
      },
    },
  },
  r2: { commit: { proof: FAKE_CID_4, id: FAKE_CID_1, prev: FAKE_CID_2 } },
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

describe('TileDocumentHandler', () => {
  let did: DID
  let tileDocumentHandler: TileDocumentHandler
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
    tileDocumentHandler = new TileDocumentHandler()

    setDidToNotRotatedState(did)
  })

  it('is constructed correctly', async () => {
    expect(tileDocumentHandler.name).toEqual('tile')
  })

  it('makes genesis commits correctly', async () => {
    const commit = await TileDocument.makeGenesis(context.api, COMMITS.genesis.data)
    expect(commit).toBeDefined()

    const { jws, linkedBlock } = commit as SignedCommitContainer
    expect(jws).toBeDefined()
    expect(linkedBlock).toBeDefined()

    const payload = dagCBOR.decode(linkedBlock)

    const serialized = { jws: serialize(jws), linkedBlock: serialize(payload) }

    // Add the 'unique' header field to the data used to generate the expected genesis commit
    const genesis = cloneDeep(COMMITS.genesis)
    genesis.header['unique'] = serialized.linkedBlock.header.unique

    const expected = await did.createDagJWS(genesis)
    expect(expected).toBeDefined()

    const { jws: eJws, linkedBlock: eLinkedBlock } = expected
    const ePayload = dagCBOR.decode(eLinkedBlock)
    const signed = { jws: serialize(eJws), linkedBlock: serialize(ePayload) }

    expect(serialized).toEqual(signed)
  })

  it('throws error for deterministic genesis commit with data', async () => {
    await expect(
      TileDocument.makeGenesis(context.api, COMMITS.genesis.data, { deterministic: true })
    ).rejects.toThrow(/Initial content must be null/)
  })

  it('Takes controller from authenticated DID if controller not specified', async () => {
    const commit = (await TileDocument.makeGenesis(context.api, null)) as GenesisCommit
    expect(commit.header.controllers[0]).toEqual(did.id)
  })

  it('Does not sign commit if no content', async () => {
    const signedCommitWithContent = await TileDocument.makeGenesis(
      context.api,
      COMMITS.genesis.data
    )
    const { jws, linkedBlock } = signedCommitWithContent as SignedCommitContainer
    expect(jws).toBeDefined()
    expect(linkedBlock).toBeDefined()

    const payload = dagCBOR.decode<any>(linkedBlock)
    expect(payload.data).toEqual(COMMITS.genesis.data)
    expect(payload.header.controllers[0]).toEqual(did.id)

    const commitWithoutContent = (await TileDocument.makeGenesis(
      context.api,
      null
    )) as GenesisCommit
    expect(commitWithoutContent.data).toBeUndefined
    expect(commitWithoutContent.header.controllers[0]).toEqual(did.id)
  })

  it('throws if more than one controller', async () => {
    const commit1Promised = TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
      controllers: [did.id, 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'],
      deterministic: true,
    })
    await expect(commit1Promised).rejects.toThrow(/Exactly one controller must be specified/)
  })

  it('creates genesis commits uniquely by default', async () => {
    const commit1 = await TileDocument.makeGenesis(context.api, COMMITS.genesis.data)
    const commit2 = await TileDocument.makeGenesis(context.api, COMMITS.genesis.data)

    expect(commit1).not.toEqual(commit2)
  })

  it('creates genesis commits deterministically if deterministic:true is specified', async () => {
    const metadata = { deterministic: true, controllers: ['a'], family: 'family', tags: ['x', 'y'] }
    const commit1 = await TileDocument.makeGenesis(context.api, null, metadata)
    const commit2 = await TileDocument.makeGenesis(context.api, null, metadata)

    expect(commit1).toEqual(commit2)
  })

  it('creates genesis commits without DID if content is undefined', async () => {
    await expect(
      TileDocument.makeGenesis({} as CeramicApi, { foo: 'asdf' }, { controllers: [did.id] })
    ).rejects.toThrow('No DID provided')
    const commit1 = await TileDocument.makeGenesis({} as CeramicApi, null, {
      controllers: [did.id],
    })

    expect(commit1).toBeDefined()
  })

  it('applies genesis commit correctly', async () => {
    const tileHandler = new TileDocumentHandler()

    const commit = (await TileDocument.makeGenesis(
      context.api,
      COMMITS.genesis.data
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
    const streamState = await tileHandler.applyCommit(commitData, context)
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

    const commitData = {
      cid: FAKE_CID_1,
      type: CommitType.GENESIS,
      commit: COMMITS.genesisGenerated.linkedBlock,
      envelope: COMMITS.genesisGenerated.jws,
    }
    const state = await tileDocumentHandler.applyCommit(commitData, context)
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
    expect({ jws: serialize(rJws), linkedPayload: serialize(rPayload) }).toEqual(COMMITS.r1.commit)
  })

  it('applies signed commit correctly', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(
      context.api,
      COMMITS.genesis.data
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

  it('multiple consecutive updates', async () => {
    const deepCopy = (o) => StreamUtils.deserializeState(StreamUtils.serializeState(o))
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.api, {
      test: 'data',
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
    const genesisState = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    // make a first update
    const state$ = TestUtils.runningState(genesisState)
    let doc = new TileDocument(state$, context)
    const signedCommit1 = (await doc.makeCommit(context.api, {
      other: { obj: 'content' },
    })) as SignedCommitContainer

    await context.ipfs.dag.put(signedCommit1, FAKE_CID_2)
    const sPayload1 = dagCBOR.decode(signedCommit1.linkedBlock)
    await context.ipfs.dag.put(sPayload1, signedCommit1.jws.link)
    // apply signed
    const signedCommitData_1 = {
      cid: FAKE_CID_2,
      type: CommitType.SIGNED,
      commit: sPayload1,
      envelope: signedCommit1.jws,
    }
    const state1 = await tileDocumentHandler.applyCommit(
      signedCommitData_1,
      context,
      deepCopy(genesisState)
    )

    // make a second update on top of the first
    const state1$ = TestUtils.runningState(state1)
    doc = new TileDocument(state1$, context)
    const signedCommit2 = (await doc.makeCommit(context.api, {
      other: { obj2: 'fefe' },
    })) as SignedCommitContainer

    await context.ipfs.dag.put(signedCommit2, FAKE_CID_3)
    const sPayload2 = dagCBOR.decode(signedCommit2.linkedBlock)
    await context.ipfs.dag.put(sPayload2, signedCommit2.jws.link)

    // apply signed
    const signedCommitData_2 = {
      cid: FAKE_CID_3,
      type: CommitType.SIGNED,
      commit: sPayload2,
      envelope: signedCommit2.jws,
    }
    const state2 = await tileDocumentHandler.applyCommit(
      signedCommitData_2,
      context,
      deepCopy(state1)
    )
    delete state2.metadata.unique
    delete state2.next.metadata.unique
    expect(state2).toMatchSnapshot()
  })

  it('throws error if commit signed by wrong DID', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
      controllers: ['did:3:fake'],
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
    await expect(tileDocumentHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: not a valid verificationMethod for issuer/
    )
  })

  it('throws error if changes to more than one controller', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.api, COMMITS.genesis.data, {
      controllers: [did.id],
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
    const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)
    const doc = new TileDocument(TestUtils.runningState(state), context)
    const makeCommit = doc.makeCommit(context.api, COMMITS.r1.desiredContent, {
      controllers: [did.id, did.id],
    })
    await expect(makeCommit).rejects.toThrow(/Exactly one controller must be specified/)
  })

  it('prohibit controllers updated to invalid values', async () => {
    const deepCopy = (o) => StreamUtils.deserializeState(StreamUtils.serializeState(o))
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.api, {
      test: 'data',
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
    const genesisState = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    // try invalid controller updates
    const invalidControllerValues = [null, '']
    for (let i = 0; i < invalidControllerValues.length; i++) {
      const state$ = TestUtils.runningState(genesisState)
      const doc = new TileDocument(state$, context)
      const rawCommit = await (doc as any)._makeRawCommit({
        other: { obj2: 'fefe' },
      })

      // update unsigned metadata
      rawCommit.header.controllers = [invalidControllerValues[i]]
      const signedCommit = await (TileDocument as any)._signDagJWS(context.api, rawCommit)
      await context.ipfs.dag.put(signedCommit, FAKE_CID_2)
      const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
      await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

      // apply signed
      const signedCommitData_1 = {
        cid: FAKE_CID_2,
        type: CommitType.SIGNED,
        commit: sPayload,
        envelope: signedCommit.jws,
      }
      await expect(
        tileDocumentHandler.applyCommit(signedCommitData_1, context, deepCopy(genesisState))
      ).rejects.toThrow(/Controller cannot be updated to an undefined value./)
    }
  })

  it('fails to apply commit with invalid prev link', async () => {
    const deepCopy = (o) => StreamUtils.deserializeState(StreamUtils.serializeState(o))
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.api, {
      test: 'data',
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
    const genesisState = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    // try invalid controller updates
    const invalidControllerValues = [null, '']
    for (let i = 0; i < invalidControllerValues.length; i++) {
      const state$ = TestUtils.runningState(genesisState)
      const doc = new TileDocument(state$, context)
      const rawCommit = await (doc as any)._makeRawCommit({
        other: { obj2: 'fefe' },
      })

      // update unsigned metadata
      rawCommit.prev = FAKE_CID_3
      const signedCommit = await (TileDocument as any)._signDagJWS(context.api, rawCommit)
      await context.ipfs.dag.put(signedCommit, FAKE_CID_2)
      const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
      await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

      // apply signed
      const signedCommitData_1 = {
        cid: FAKE_CID_2,
        type: CommitType.SIGNED,
        commit: sPayload,
        envelope: signedCommit.jws,
      }
      await expect(
        tileDocumentHandler.applyCommit(signedCommitData_1, context, deepCopy(genesisState))
      ).rejects.toThrow(/Commit doesn't properly point to previous commit in log/)
    }
  })

  it('fails to apply commit with invalid id property', async () => {
    const deepCopy = (o) => StreamUtils.deserializeState(StreamUtils.serializeState(o))
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.api, {
      test: 'data',
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
    const genesisState = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    // try invalid controller updates
    const invalidControllerValues = [null, '']
    for (let i = 0; i < invalidControllerValues.length; i++) {
      const state$ = TestUtils.runningState(genesisState)
      const doc = new TileDocument(state$, context)
      const rawCommit = await (doc as any)._makeRawCommit({
        other: { obj2: 'fefe' },
      })

      // update unsigned metadata
      rawCommit.id = FAKE_CID_3
      const signedCommit = await (TileDocument as any)._signDagJWS(context.api, rawCommit)
      await context.ipfs.dag.put(signedCommit, FAKE_CID_2)
      const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
      await context.ipfs.dag.put(sPayload, signedCommit.jws.link)

      // apply signed
      const signedCommitData_1 = {
        cid: FAKE_CID_2,
        type: CommitType.SIGNED,
        commit: sPayload,
        envelope: signedCommit.jws,
      }
      await expect(
        tileDocumentHandler.applyCommit(signedCommitData_1, context, deepCopy(genesisState))
      ).rejects.toThrow(/Invalid genesis CID in commit/)
    }
  })

  it('applies anchor commit correctly', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(
      context.api,
      COMMITS.genesis.data
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
    } as CommitData
    state = await tileDocumentHandler.applyCommit(anchorCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })

  it('fails to apply commit if old key is used to make the commit and keys have been rotated', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    const tileDocumentHandler = new TileDocumentHandler()

    // make and apply genesis with old key
    const genesisCommit = (await TileDocument.makeGenesis(
      signerUsingOldKey,
      COMMITS.genesis.data
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

    const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    rotateKey(did, rotateDate.toISOString())

    // make update with old key
    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)
    const signedCommit = (await doc.makeCommit(
      signerUsingOldKey,
      COMMITS.r1.desiredContent
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
    await expect(tileDocumentHandler.applyCommit(signedCommitData, context, state)).rejects.toThrow(
      /invalid_jws: signature authored with a revoked DID version/
    )
  })

  it('fails to apply commit if new key used before rotation', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    const tileDocumentHandler = new TileDocumentHandler()

    // make genesis with new key
    const genesisCommit = (await TileDocument.makeGenesis(
      signerUsingNewKey,
      COMMITS.genesis.data
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

    await expect(tileDocumentHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: signature authored before creation of DID version/
    )
  })

  it('applies commit made using an old key if it is applied within the revocation period', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')
    rotateKey(did, rotateDate.toISOString())

    const tileDocumentHandler = new TileDocumentHandler()

    // make genesis commit using old key
    const genesisCommit = (await TileDocument.makeGenesis(
      signerUsingOldKey,
      COMMITS.genesis.data
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
    const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)
    delete state.metadata.unique

    expect(state).toMatchSnapshot()
  })
})

describe('TileHandler', () => {
  test('can not create invalid deterministic tile document', async () => {
    const fauxCeramic = {} as unknown as CeramicApi
    await expect(
      TileDocument.makeGenesis(fauxCeramic, undefined, {
        controllers: ['did:foo:blah'],
        family: 'test123',
        tags: ['foo', undefined, 'blah'],
      })
    ).rejects.toThrow(/`undefined` is not supported by the IPLD Data Model and cannot be encoded/)
  })
})
