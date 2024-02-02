import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import * as dagCBOR from '@ipld/dag-cbor'
import { TileDocumentHandler } from '../tile-document-handler.js'
import cloneDeep from 'lodash.clonedeep'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import {
  CeramicSigner,
  CommitData,
  EventType,
  GenesisCommit,
  IpfsApi,
  SignedCommitContainer,
  StreamReaderWriter,
  StreamUtils,
} from '@ceramicnetwork/common'
import {
  COMMITS,
  DID_ID,
  DidTestUtils,
  FAKE_CID_1,
  FAKE_CID_2,
  FAKE_CID_3,
  FAKE_CID_4,
  JWS_VERSION_1,
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
// These tests are never expected to be run in v' mode because Tile Documents are not supported
describeIfV3('TileDocumentHandler', () => {
  let tileDocumentHandler: TileDocumentHandler
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
    tileDocumentHandler = new TileDocumentHandler()

    defaultSigner = await DidTestUtils.rotatingSigner(
      {}
      //   {
      //   id: 'did:3:k2t6wyfsu4pg0t2n4j8ms3s33xsgqjhtto04mvq8w5a2v5xo48idyz38l7ydki',
      //   jws: {
      //     payload: 'bbbb',
      //     signatures: [
      //       {
      //         protected:
      //           'eyJraWQiOiJkaWQ6MzprMnQ2d3lmc3U0cGcwdDJuNGo4bXMzczMzeHNncWpodHRvMDRtdnE4dzVhMnY1eG80OGlkeXozOGw3eWRraT92ZXJzaW9uPTAjc2lnbmluZyIsImFsZyI6IkVTMjU2SyJ9',
      //         signature: 'cccc',
      //       },
      //     ],
      //   }
      // }
    )
    context = DidTestUtils.api(defaultSigner)

    signerUsingNewKey = CeramicSigner.fromDID(
      await DidTestUtils.generateDID({ jws: JWS_VERSION_1 })
    )

    signerUsingOldKey = CeramicSigner.fromDID(await DidTestUtils.generateDID({}))
  })

  it('is constructed correctly', async () => {
    expect(tileDocumentHandler.name).toEqual('tile')
  })

  it('makes genesis commits correctly', async () => {
    const commit = await TileDocument.makeGenesis(context, COMMITS.genesis.data)
    expect(commit).toBeDefined()

    const { jws, linkedBlock } = commit as SignedCommitContainer
    expect(jws).toBeDefined()
    expect(linkedBlock).toBeDefined()

    const payload = dagCBOR.decode(linkedBlock)

    const serialized = {
      jws: DidTestUtils.serialize(jws),
      linkedBlock: DidTestUtils.serialize(payload),
    }

    // Add the 'unique' header field to the data used to generate the expected genesis commit
    const genesis = cloneDeep(COMMITS.genesis)
    genesis.header['unique'] = serialized.linkedBlock.header.unique

    const expected = await defaultSigner.signer.createDagJWS(genesis)
    expect(expected).toBeDefined()

    const { jws: eJws, linkedBlock: eLinkedBlock } = expected
    const ePayload = dagCBOR.decode(eLinkedBlock)
    const signed = {
      jws: DidTestUtils.serialize(eJws),
      linkedBlock: DidTestUtils.serialize(ePayload),
    }

    expect(serialized).toEqual(signed)
  })

  it('throws error for deterministic genesis commit with data', async () => {
    await expect(
      TileDocument.makeGenesis(context.signer, COMMITS.genesis.data, { deterministic: true })
    ).rejects.toThrow(/Initial content must be null/)
  })

  it('Takes controller from authenticated DID if controller not specified', async () => {
    const commit = (await TileDocument.makeGenesis(context.signer, null)) as GenesisCommit
    expect(commit.header.controllers[0]).toEqual(DID_ID)
  })

  it('Does not sign commit if no content', async () => {
    const signedCommitWithContent = await TileDocument.makeGenesis(
      context.signer,
      COMMITS.genesis.data
    )
    const { jws, linkedBlock } = signedCommitWithContent as SignedCommitContainer
    expect(jws).toBeDefined()
    expect(linkedBlock).toBeDefined()

    const payload = dagCBOR.decode<any>(linkedBlock)
    expect(payload.data).toEqual(COMMITS.genesis.data)
    expect(payload.header.controllers[0]).toEqual(DID_ID)

    const commitWithoutContent = (await TileDocument.makeGenesis(
      context.signer,
      null
    )) as GenesisCommit
    expect(commitWithoutContent.data).toBeUndefined
    expect(commitWithoutContent.header.controllers[0]).toEqual(DID_ID)
  })

  it('throws if more than one controller', async () => {
    const commit1Promised = TileDocument.makeGenesis(context.signer, COMMITS.genesis.data, {
      controllers: [DID_ID, 'did:key:zQ3shwsCgFanBax6UiaLu1oGvM7vhuqoW88VBUiUTCeHbTeTV'],
      deterministic: true,
    })
    await expect(commit1Promised).rejects.toThrow(/Exactly one controller must be specified/)
  })

  it('creates genesis commits uniquely by default', async () => {
    const commit1 = await TileDocument.makeGenesis(context.signer, COMMITS.genesis.data)
    const commit2 = await TileDocument.makeGenesis(context.signer, COMMITS.genesis.data)

    expect(commit1).not.toEqual(commit2)
  })

  it('creates genesis commits deterministically if deterministic:true is specified', async () => {
    const metadata = { deterministic: true, controllers: ['a'], family: 'family', tags: ['x', 'y'] }
    const commit1 = await TileDocument.makeGenesis(context.signer, null, metadata)
    const commit2 = await TileDocument.makeGenesis(context.signer, null, metadata)

    expect(commit1).toEqual(commit2)
  })

  it('creates genesis commits without DID if content is undefined', async () => {
    await expect(
      TileDocument.makeGenesis(CeramicSigner.invalid(), { foo: 'asdf' }, { controllers: [DID_ID] })
    ).rejects.toThrow('No DID')
    const commit1 = await TileDocument.makeGenesis({} as CeramicSigner, null, {
      controllers: [DID_ID],
    })

    expect(commit1).toBeDefined()
  })

  it('applies genesis commit correctly', async () => {
    const tileHandler = new TileDocumentHandler()

    const commit = (await TileDocument.makeGenesis(
      context.signer,
      COMMITS.genesis.data
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
    const streamState = await tileHandler.applyCommit(commitData, context)
    delete streamState.metadata.unique
    expect(streamState).toMatchSnapshot()
  })

  it('makes signed commit correctly', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    await ipfs.dag.put(COMMITS.genesisGenerated.jws, FAKE_CID_1)

    await ipfs.dag.put(COMMITS.genesisGenerated.linkedBlock, COMMITS.genesisGenerated.jws.link)

    const commitData = {
      cid: FAKE_CID_1,
      type: EventType.INIT,
      commit: COMMITS.genesisGenerated.linkedBlock,
      envelope: COMMITS.genesisGenerated.jws,
    }
    const state = await tileDocumentHandler.applyCommit(commitData, context)
    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)

    await expect(
      doc.makeCommit(CeramicSigner.invalid(), COMMITS.r1.desiredContent)
    ).rejects.toThrow(/No DID/)

    const commit = (await doc.makeCommit(
      context.signer,
      COMMITS.r1.desiredContent
    )) as SignedCommitContainer
    const { jws: rJws, linkedBlock: rLinkedBlock } = commit
    //since we're mocking library calls, we're missing this. Adding it to make test match
    rJws.link = 'bafyreia6chsgnfihmdrl2d36llrfevc6xgmgzryi3ittdg3j5ohdifb7he'
    const rPayload = dagCBOR.decode(rLinkedBlock)
    expect({
      jws: DidTestUtils.serialize(rJws),
      linkedPayload: DidTestUtils.serialize(rPayload),
    }).toEqual(COMMITS.r1.commit)
  })

  it('applies signed commit correctly', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(
      context,
      COMMITS.genesis.data
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

  it('multiple consecutive updates', async () => {
    const deepCopy = (o) => StreamUtils.deserializeState(StreamUtils.serializeState(o))
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.signer, {
      test: 'data',
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
    const genesisState = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    // make a first update
    const state$ = TestUtils.runningState(genesisState)
    let doc = new TileDocument(state$, context)
    const signedCommit1 = (await doc.makeCommit(context.signer, {
      other: { obj: 'content' },
    })) as SignedCommitContainer

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
    const state1 = await tileDocumentHandler.applyCommit(
      signedCommitData_1,
      context,
      deepCopy(genesisState)
    )

    // make a second update on top of the first
    const state1$ = TestUtils.runningState(state1)
    doc = new TileDocument(state1$, context)
    const signedCommit2 = (await doc.makeCommit(context.signer, {
      other: { obj2: 'fefe' },
    })) as SignedCommitContainer

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
    const state2 = await tileDocumentHandler.applyCommit(
      signedCommitData_2,
      context,
      deepCopy(state1)
    )
    delete state2.metadata.unique
    delete state2.next.metadata.unique
    expect(state2).toMatchSnapshot()
  })

  it.skip('throws error if commit signed by DID that is not controller', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.signer, COMMITS.genesis.data, {
      controllers: ['did:3:fake'],
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
    await expect(tileDocumentHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: not a valid verificationMethod for issuer/
    )
  })

  it('throws error if changes to more than one controller', async () => {
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.signer, COMMITS.genesis.data, {
      controllers: [DID_ID],
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
    const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)
    const doc = new TileDocument(TestUtils.runningState(state), context)
    const makeCommit = doc.makeCommit(context.signer, COMMITS.r1.desiredContent, {
      controllers: [DID_ID, DID_ID],
    })
    await expect(makeCommit).rejects.toThrow(/Exactly one controller must be specified/)
  })

  it('prohibit controllers updated to invalid values', async () => {
    const deepCopy = (o) => StreamUtils.deserializeState(StreamUtils.serializeState(o))
    const tileDocumentHandler = new TileDocumentHandler()

    const genesisCommit = (await TileDocument.makeGenesis(context.signer, {
      test: 'data',
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
      const signedCommit = await context.signer.createDagJWS(rawCommit)
      await ipfs.dag.put(signedCommit, FAKE_CID_2)
      const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
      await ipfs.dag.put(sPayload, signedCommit.jws.link)

      // apply signed
      const signedCommitData_1 = {
        cid: FAKE_CID_2,
        type: EventType.DATA,
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

    const genesisCommit = (await TileDocument.makeGenesis(context.signer, {
      test: 'data',
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
      const signedCommit = await context.signer.createDagJWS(rawCommit)
      await ipfs.dag.put(signedCommit, FAKE_CID_2)
      const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
      await ipfs.dag.put(sPayload, signedCommit.jws.link)

      // apply signed
      const signedCommitData_1 = {
        cid: FAKE_CID_2,
        type: EventType.DATA,
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

    const genesisCommit = (await TileDocument.makeGenesis(context.signer, {
      test: 'data',
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
      const signedCommit = await context.signer.createDagJWS(rawCommit)
      await ipfs.dag.put(signedCommit, FAKE_CID_2)
      const sPayload = dagCBOR.decode(signedCommit.linkedBlock)
      await ipfs.dag.put(sPayload, signedCommit.jws.link)

      // apply signed
      const signedCommitData_1 = {
        cid: FAKE_CID_2,
        type: EventType.DATA,
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
      context.signer,
      COMMITS.genesis.data
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

  it('fails to apply commit if old key is used to make the commit and keys have been rotated', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')

    const tileDocumentHandler = new TileDocumentHandler()

    // make and apply genesis with old key
    const genesisCommit = (await TileDocument.makeGenesis(
      signerUsingOldKey,
      COMMITS.genesis.data
    )) as SignedCommitContainer
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

    const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)

    DidTestUtils.withRotationDate(defaultSigner, rotateDate.toISOString())

    // make update with old key
    const state$ = TestUtils.runningState(state)
    const doc = new TileDocument(state$, context)
    const signedCommit = (await doc.makeCommit(
      signerUsingOldKey,
      COMMITS.r1.desiredContent
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

    DidTestUtils.withRotationDate(defaultSigner, rotateDate.toISOString())

    await expect(tileDocumentHandler.applyCommit(genesisCommitData, context)).rejects.toThrow(
      /invalid_jws: signature authored before creation of DID version/
    )
  })

  it('applies commit made using an old key if it is applied within the revocation period', async () => {
    const rotateDate = new Date('2022-03-11T21:28:07.383Z')
    DidTestUtils.withRotationDate(defaultSigner, rotateDate.toISOString())

    const tileDocumentHandler = new TileDocumentHandler()

    // make genesis commit using old key
    const genesisCommit = (await TileDocument.makeGenesis(
      signerUsingOldKey,
      COMMITS.genesis.data
    )) as SignedCommitContainer
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
    const state = await tileDocumentHandler.applyCommit(genesisCommitData, context)
    delete state.metadata.unique

    expect(state).toMatchSnapshot()
  })
})

describe('TileHandler', () => {
  test('can not create invalid deterministic tile document', async () => {
    const fauxCeramic = DidTestUtils.api(CeramicSigner.fromDID(await DidTestUtils.generateDID({})))
    await expect(
      TileDocument.makeGenesis(fauxCeramic, undefined, {
        controllers: ['did:foo:blah'],
        family: 'test123',
        tags: ['foo', undefined, 'blah'],
      })
    ).rejects.toThrow(/`undefined` is not supported by the IPLD Data Model and cannot be encoded/)
  })
})
