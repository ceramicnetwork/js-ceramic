import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import * as dagCBOR from '@ipld/dag-cbor'
import { DID } from 'dids'
import { Resolver } from 'did-resolver'
import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { TileDocumentHandler } from '../tile-document-handler'
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
} from '@ceramicnetwork/common'

jest.mock('did-jwt', () => ({
  // TODO - We should test for when this function throws as well
  verifyJWS: (): void => {
    return
  },
}))

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

const COMMITS = {
  genesis: {
    header: {
      controllers: ['did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'],
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
        controllers: ['did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'],
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

describe('TileDocumentHandler', () => {
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
              'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
            signature: 'cccc',
          },
        ],
      }
    })
    did._id = 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki'
    const api = {
      getSupportedChains: jest.fn(async () => {
        return ['fakechain:123']
      }),
      did,
    }

    context = {
      did,
      ipfs: ipfs,
      anchorService: null,
      resolver,
      api: api as unknown as CeramicApi,
    }
  })

  beforeEach(() => {
    tileDocumentHandler = new TileDocumentHandler()
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

  it('Does not sign commit if no content', async () => {
    const commit = await TileDocument.makeGenesis(context.api, null)
    expect(commit.header.controllers[0]).toEqual(did.id)
  })

  it('Takes controller from authenticated DID if controller not specified', async () => {
    const signedCommitWithContent = await TileDocument.makeGenesis(
      context.api,
      COMMITS.genesis.data
    )
    const { jws, linkedBlock } = signedCommitWithContent as SignedCommitContainer
    expect(jws).toBeDefined()
    expect(linkedBlock).toBeDefined()

    const payload = dagCBOR.decode(linkedBlock)
    expect(payload.data).toEqual(COMMITS.genesis.data)
    expect(payload.header.controllers[0]).toEqual(did.id)

    const commitWithoutContent = await TileDocument.makeGenesis(context.api, null)
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
    const doc = new TileDocument(state, context)
    const makeCommit = doc.makeCommit(context.api, COMMITS.r1.desiredContent, {
      controllers: [did.id, did.id],
    })
    await expect(makeCommit).rejects.toThrow(/Exactly one controller must be specified/)
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
    }
    state = await tileDocumentHandler.applyCommit(anchorCommitData, context, state)
    delete state.metadata.unique
    expect(state).toMatchSnapshot()
  })
})
