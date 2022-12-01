import { jest } from '@jest/globals'
import {
  AnchorStatus,
  CommitType,
  IpfsApi,
  SignatureStatus,
  StreamUtils,
  TestUtils,
} from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import { RunningState } from '../state-management/running-state.js'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from './create-ceramic.js'
import { Ceramic } from '../ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { streamFromState } from '../state-management/stream-from-state.js'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { from, timer } from 'rxjs'
import { concatMap, map, tap } from 'rxjs/operators'
import { MAX_RESPONSE_INTERVAL } from '../pubsub/message-bus.js'
import cloneDeep from 'lodash.clonedeep'
import { StateLink } from '../state-management/state-link.js'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'

const FAKE_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const INITIAL_CONTENT = { abc: 123, def: 456 }
const STRING_MAP_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'StringMap',
  type: 'object',
  additionalProperties: {
    type: 'string',
  },
}


describe('anchor', () => {
  let realHandleTip
  let ipfs: IpfsApi
  let ceramic: Ceramic
  let controllers: string[]

  jest.setTimeout(10000)

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  beforeEach(() => {
    realHandleTip = (ceramic.repository.stateManager as any)._handleTip
  })

  afterEach(() => {
    // Restore the _handleTip function in case any of the tests modified it
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ceramic.repository.stateManager._handleTip = realHandleTip
  })

  describe('With anchorOnRequest == true', () => {
    beforeAll(async () => {
      ceramic = await createCeramic(ipfs, { anchorOnRequest: true })
      controllers = [ceramic.did.id]
    })

    afterAll(async () => {
      await ceramic.close()
    })

    test('handleTip', async () => {
      const stream1 = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      await stream1.subscribe()
      const streamState1 = await ceramic.repository.load(stream1.id, {})
      await ceramic.repository.stateManager.anchor(streamState1)

      const ceramic2 = await createCeramic(ipfs)
      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id, { syncTimeoutSeconds: 0 })
      stream2.subscribe()
      const streamState2 = await ceramic2.repository.load(stream2.id, {})

      expect(stream2.content).toEqual(stream1.content)
      expect(stream2.state).toEqual(
        expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 })
      )

      await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[1].cid)

      expect(stream2.state).toEqual(stream1.state)
      await ceramic2.close()
    })

    test('handleTip for commit already in log', async () => {
      const newContent = { foo: 'bar' }
      const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, { anchor: false })
      await stream1.update(newContent, null, { anchor: false })

      const ceramic2 = await createCeramic(ipfs)
      const retrieveCommitSpy = jest.spyOn(ceramic2.dispatcher, 'retrieveCommit')

      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id, { syncTimeoutSeconds: 0 })
      const streamState2 = await ceramic2.repository.load(stream2.id, {})

      retrieveCommitSpy.mockClear()
      await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[1].cid)

      expect(streamState2.state).toEqual(stream1.state)
      // 2 IPFS retrievals - the signed commit and its linked commit payload for the commit to be
      // applied
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Now re-apply the same commit and don't expect any additional calls to IPFS
      await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[1].cid)
      await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[0].cid)
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Add another update to stream 1
      const moreNewContent = { foo: 'baz' }
      await stream1.update(moreNewContent, null, { anchor: false })

      retrieveCommitSpy.mockClear()
      await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[2].cid)

      expect(streamState2.state).toEqual(stream1.state)
      // 2 IPFS retrievals - 1 each for linked commit/envelope for CID to be applied - since there is no lone genesis commit
      // in the stream state.
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Now re-apply the same commit and don't expect any additional calls to IPFS
      await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[2].cid)
      await (ceramic2.repository.stateManager as any)._handleTip(streamState2, stream1.state.log[1].cid)
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      await ceramic2.close()
    })

    test('commit history and atCommit', async () => {
      const stream = await TileDocument.create<any>(ceramic, INITIAL_CONTENT)
      stream.subscribe()
      const streamState = await ceramic.repository.load(stream.id, {})

      const commit0 = stream.allCommitIds[0]
      expect(stream.commitId).toEqual(commit0)
      expect(commit0.equals(CommitID.make(streamState.id, streamState.id.cid))).toBeTruthy()

      await TestUtils.anchorUpdate(ceramic, stream)
      expect(stream.allCommitIds.length).toEqual(2)
      expect(stream.anchorCommitIds.length).toEqual(1)
      const commit1 = stream.allCommitIds[1]
      expect(commit1.equals(commit0)).toBeFalsy()
      expect(commit1).toEqual(stream.commitId)
      expect(commit1).toEqual(stream.anchorCommitIds[0])

      const newContent = { abc: 321, def: 456, gh: 987 }
      const updateRec = await stream.makeCommit(ceramic, newContent)
      await ceramic.repository.applyCommit(streamState.id, updateRec, {
        anchor: true,
        publish: false,
      })
      expect(stream.allCommitIds.length).toEqual(3)
      expect(stream.anchorCommitIds.length).toEqual(1)
      const commit2 = stream.allCommitIds[2]
      expect(commit2.equals(commit1)).toBeFalsy()
      expect(commit2).toEqual(stream.commitId)

      await TestUtils.anchorUpdate(ceramic, stream)
      expect(stream.allCommitIds.length).toEqual(4)
      expect(stream.anchorCommitIds.length).toEqual(2)
      const commit3 = stream.allCommitIds[3]
      expect(commit3.equals(commit2)).toBeFalsy()
      expect(commit3).toEqual(stream.commitId)
      expect(commit3).toEqual(stream.anchorCommitIds[1])
      expect(stream.content).toEqual(newContent)
      expect(stream.state.signature).toEqual(SignatureStatus.SIGNED)
      expect(stream.state.anchorStatus).not.toEqual(AnchorStatus.NOT_REQUESTED)
      expect(stream.state.log.length).toEqual(4)

      // Apply a final commit that does not get anchored
      const finalContent = { foo: 'bar' }
      const updateRec2 = await stream.makeCommit(ceramic, finalContent)
      await ceramic.repository.applyCommit(streamState.id, updateRec2, {
        anchor: true,
        publish: false,
      })

      expect(stream.allCommitIds.length).toEqual(5)
      expect(stream.anchorCommitIds.length).toEqual(2)
      const commit4 = stream.allCommitIds[4]
      expect(commit4.equals(commit3)).toBeFalsy()
      expect(commit4).toEqual(stream.commitId)
      expect(commit4.equals(stream.anchorCommitIds[1])).toBeFalsy()
      expect(stream.state.log.length).toEqual(5)

      await TestUtils.waitForAnchor(stream, 3000)

      // Correctly check out a specific commit
      const streamStateOriginal = cloneDeep(streamState.state)
      const streamV0 = await ceramic.repository.stateManager.atCommit(streamState, commit0)
      expect(streamV0.id.equals(commit0.baseID)).toBeTruthy()
      expect(streamV0.value.log.length).toEqual(1)
      expect(streamV0.value.metadata.controllers).toEqual(controllers)
      expect(streamV0.value.content).toEqual(INITIAL_CONTENT)
      expect(streamV0.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const streamV1 = await ceramic.repository.stateManager.atCommit(streamState, commit1)
      expect(streamV1.id.equals(commit1.baseID)).toBeTruthy()
      expect(streamV1.value.log.length).toEqual(2)
      expect(streamV1.value.metadata.controllers).toEqual(controllers)
      expect(streamV1.value.content).toEqual(INITIAL_CONTENT)
      expect(streamV1.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const streamV2 = await ceramic.repository.stateManager.atCommit(streamState, commit2)
      expect(streamV2.id.equals(commit2.baseID)).toBeTruthy()
      expect(streamV2.value.log.length).toEqual(3)
      expect(streamV2.value.metadata.controllers).toEqual(controllers)
      expect(streamV2.value.next.content).toEqual(newContent)
      expect(streamV2.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      const streamV3 = await ceramic.repository.stateManager.atCommit(streamState, commit3)
      expect(streamV3.id.equals(commit3.baseID)).toBeTruthy()
      expect(streamV3.value.log.length).toEqual(4)
      expect(streamV3.value.metadata.controllers).toEqual(controllers)
      expect(streamV3.value.content).toEqual(newContent)
      expect(streamV3.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const streamV4 = await ceramic.repository.stateManager.atCommit(streamState, commit4)
      expect(streamV4.id.equals(commit4.baseID)).toBeTruthy()
      expect(streamV4.value.log.length).toEqual(5)
      expect(streamV4.value.metadata.controllers).toEqual(controllers)
      expect(streamV4.value.next.content).toEqual(finalContent)
      expect(streamV4.value.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

      // Ensure that stateManager.atCommit does not mutate the passed in state object
      expect(StreamUtils.serializeState(streamState.state)).toEqual(
        StreamUtils.serializeState(streamStateOriginal)
      )
    })

    describe('atCommit', () => {
      test('non-existing commit', async () => {
        const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const streamState = await ceramic.repository.load(stream.id, {})
        // Emulate loading a non-existing commit
        const nonExistentCommitID = CommitID.make(stream.id, FAKE_CID)
        const originalRetrieve = ceramic.dispatcher.retrieveCommit.bind(ceramic.dispatcher)
        ceramic.dispatcher.retrieveCommit = jest.fn(async (cid: CID) => {
          if (cid.equals(FAKE_CID)) {
            return null
          } else {
            return originalRetrieve(cid)
          }
        })
        await expect(
          ceramic.repository.stateManager.atCommit(streamState, nonExistentCommitID)
        ).rejects.toThrow(`No commit found for CID ${nonExistentCommitID.commit?.toString()}`)
      })

      test('return read-only snapshot', async () => {
        const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, {
          anchor: false,
          syncTimeoutSeconds: 0,
        })
        await stream1.update({ abc: 321, def: 456, gh: 987 })
        await TestUtils.anchorUpdate(ceramic, stream1)

        const ceramic2 = await createCeramic(ipfs, { anchorOnRequest: false })
        const stream2 = await TileDocument.load(ceramic, stream1.id)
        const streamState2 = await ceramic2.repository.load(stream2.id, { syncTimeoutSeconds: 0 })
        const snapshot = await ceramic2.repository.stateManager.atCommit(streamState2, stream1.commitId)

        expect(StreamUtils.statesEqual(snapshot.state, stream1.state))
        const snapshotStream = streamFromState<TileDocument>(
          ceramic2.context,
          ceramic2._streamHandlers,
          snapshot.value
        )

        // Snapshot is read-only
        await expect(snapshotStream.update({ abc: 1010 })).rejects.toThrow(
          'Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.'
        )

        // We fast-forward streamState2, because the commit is legit
        expect(streamState2.state).toEqual(stream1.state)

        await ceramic2.close()
      })

      test('return read-only snapshot: do not lose own anchor status', async () => {
        // Prepare commits to play
        const tile1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, {
          anchor: false,
          syncTimeoutSeconds: 0,
        })
        await tile1.update({ a: 1 })

        // Let's pretend we have a stream in PENDING state
        const pendingState = {
          ...tile1.state,
          anchorStatus: AnchorStatus.PENDING,
        }
        const base$ = new StateLink(pendingState)
        // We request a snapshot at the latest commit
        const snapshot = await ceramic.repository.stateManager.atCommit(base$, tile1.commitId)
        // Do not fast-forward the base state: retain PENDING anchor status
        expect(base$.state).toBe(pendingState)
        // The snapshot is reported to be anchored though
        expect(snapshot.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
      })

      test('commit ahead of current state', async () => {
        const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const streamState = await ceramic.repository.load(stream.id, {})
        // Provide a new commit that the repository doesn't currently know about
        const newContent = { abc: 321, def: 456, gh: 987 }
        const updateCommit = await stream.makeCommit(ceramic, newContent)
        const futureCommitCID = await ceramic.dispatcher.storeCommit(updateCommit)
        const futureCommitID = CommitID.make(stream.id, futureCommitCID)

        // Now load the stream at a commitID ahead of what is currently in the state in the repository.
        // The existing RunningState from the repository should also get updated
        const state$ = await ceramic.repository.load(futureCommitID.baseID, {})
        const snapshot = await ceramic.repository.stateManager.atCommit(state$, futureCommitID)
        expect(snapshot.value.next.content).toEqual(newContent)
        expect(snapshot.value.log.length).toEqual(2)
        expect(StreamUtils.serializeState(streamState.state)).toEqual(
          StreamUtils.serializeState(snapshot.value)
        )
      })
    })

    test('handles basic conflict', async () => {
      const stream1 = await TileDocument.create(ceramic, INITIAL_CONTENT)
      stream1.subscribe()
      const streamState1 = await ceramic.repository.load(stream1.id, {})
      const streamId = stream1.id
      await TestUtils.anchorUpdate(ceramic, stream1)
      const tipPreUpdate = stream1.tip

      const newContent = { abc: 321, def: 456, gh: 987 }
      let updateRec = await stream1.makeCommit(ceramic, newContent)
      await ceramic.repository.applyCommit(streamState1.id, updateRec, {
        anchor: true,
        publish: false,
      })

      await TestUtils.anchorUpdate(ceramic, stream1)
      expect(stream1.content).toEqual(newContent)
      const tipValidUpdate = stream1.tip
      // create invalid change that happened after main change

      const initialState = await ceramic.repository.stateManager
        .atCommit(streamState1, CommitID.make(streamId, streamId.cid))
        .then((stream) => stream.state)
      const state$ = new RunningState(initialState, true)
      ceramic.repository.add(state$)
      await (ceramic.repository.stateManager as any)._handleTip(state$, tipPreUpdate)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const conflictingNewContent = { asdf: 2342 }
      const stream2 = streamFromState<TileDocument>(
        ceramic.context,
        ceramic._streamHandlers,
        state$.value,
        ceramic.repository.updates$
      )
      stream2.subscribe()
      updateRec = await stream2.makeCommit(ceramic, conflictingNewContent)
      await ceramic.repository.applyCommit(state$.id, updateRec, {
        anchor: true,
        publish: false,
      })

      await TestUtils.anchorUpdate(ceramic, stream2)
      const tipInvalidUpdate = state$.tip
      expect(stream2.content).toEqual(conflictingNewContent)
      // loading tip from valid log to stream with invalid
      // log results in valid state
      await (ceramic.repository.stateManager as any)._handleTip(state$, tipValidUpdate)
      expect(stream2.content).toEqual(newContent)

      // loading tip from invalid log to stream with valid
      // log results in valid state
      await (ceramic.repository.stateManager as any)._handleTip(streamState1, tipInvalidUpdate)
      expect(stream1.content).toEqual(newContent)

      // Loading valid commit works
      const streamState1Original = cloneDeep(streamState1.state)
      const streamAtValidCommit = await ceramic.repository.stateManager.atCommit(
        streamState1,
        CommitID.make(streamId, tipValidUpdate)
      )
      expect(streamAtValidCommit.value.content).toEqual(newContent)

      // Loading invalid commit fails
      await expect(
        ceramic.repository.stateManager.atCommit(
          streamState1,
          CommitID.make(streamId, tipInvalidUpdate)
        )
      ).rejects.toThrow(/rejected by conflict resolution/)

      // Ensure that stateManager.atCommit does not mutate the passed in state object
      expect(JSON.stringify(streamState1.state)).toEqual(JSON.stringify(streamState1Original))
    }, 10000)

    test('enforces schema in update that assigns schema', async () => {
      const schemaDoc = await TileDocument.create(ceramic, STRING_MAP_SCHEMA)
      await TestUtils.anchorUpdate(ceramic, schemaDoc)

      const stream = await TileDocument.create(ceramic, { stuff: 1 })
      const streamState = await ceramic.repository.load(stream.id, {})
      await TestUtils.anchorUpdate(ceramic, stream)
      const updateRec = await stream.makeCommit(ceramic, null, { schema: schemaDoc.commitId })
      await expect(
        ceramic.repository.stateManager.applyCommit(streamState.id, updateRec, {
          anchor: false,
          throwOnInvalidCommit: true,
        })
      ).rejects.toThrow('Validation Error: data/stuff must be string')
    })

    test('enforce previously assigned schema during future update', async () => {
      const schemaDoc = await TileDocument.create(ceramic, STRING_MAP_SCHEMA)
      await TestUtils.anchorUpdate(ceramic, schemaDoc)

      const conformingContent = { stuff: 'foo' }
      const nonConformingContent = { stuff: 1 }
      const stream = await TileDocument.create<any>(ceramic, conformingContent, {
        schema: schemaDoc.commitId,
      })
      const streamState = await ceramic.repository.load(stream.id, {})
      await TestUtils.anchorUpdate(ceramic, stream)

      const updateRec = await stream.makeCommit(ceramic, nonConformingContent)
      await expect(
        ceramic.repository.stateManager.applyCommit(streamState.id, updateRec, {
          anchor: false,
          publish: false,
          throwOnInvalidCommit: true,
        })
      ).rejects.toThrow('Validation Error: data/stuff must be string')
    })

    test('should announce change to network', async () => {
      const publishTip = jest.spyOn(ceramic.dispatcher, 'publishTip')
      const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, { anchor: false })
      stream1.subscribe()
      const streamState1 = await ceramic.repository.load(stream1.id, {})
      expect(publishTip).toHaveBeenCalledTimes(1)
      expect(publishTip).toHaveBeenCalledWith(stream1.id, stream1.tip, undefined)
      await publishTip.mockClear()
      const updateRec = await stream1.makeCommit(ceramic, { foo: 34 })
      await ceramic.repository.applyCommit(streamState1.id, updateRec, {
        anchor: false,
        publish: true,
      })
      expect(publishTip).toHaveBeenCalledWith(stream1.id, stream1.tip, undefined)
    })

    describe('sync', () => {
      let originalCeramic: Ceramic

      beforeEach(() => {
        originalCeramic = ceramic
      })

      afterEach(() => {
        ceramic = originalCeramic
      })

      const FAKE_STREAM_ID = StreamID.fromString(
        'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
      )
      function digest(input: string) {
        return uint8arrays.toString(sha256.hash(uint8arrays.fromString(input)), 'base16')
      }
      function hash(data: string): CID {
        return CID.create(1, 0x12, decodeMultiHash(Buffer.from('1220' + digest(data), 'hex')))
      }

      function responseTips(amount: number) {
        const times = Array.from({ length: amount }).map((_, index) => index)
        return times.map((n) => hash(n.toString()))
      }

      test('handle first received', async () => {
        const stateManager = ceramic.repository.stateManager
        const response = responseTips(1)
        ceramic.dispatcher.messageBus.queryNetwork = () => from(response)
        const fakeHandleTip = jest.fn(() => Promise.resolve())
        ;(stateManager as any)._handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await stateManager.sync(state$, 1000)
        expect(fakeHandleTip).toHaveBeenCalledWith(state$, response[0])
      })
      test('handle all received', async () => {
        const stateManager = ceramic.repository.stateManager
        const amount = 10
        const response = responseTips(amount)
        ceramic.dispatcher.messageBus.queryNetwork = () => from(response)
        const fakeHandleTip = jest.fn(() => Promise.resolve())
        ;(stateManager as any)._handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await stateManager.sync(state$, 1000)
        response.forEach((r) => {
          expect(fakeHandleTip).toHaveBeenCalledWith(state$, r)
        })
      })
      test('not handle delayed', async () => {
        const stateManager = ceramic.repository.stateManager
        const amount = 10
        const response = responseTips(amount)
        ceramic.dispatcher.messageBus.queryNetwork = () =>
          from(response).pipe(
            concatMap(async (value, index) => {
              await new Promise((resolve) => setTimeout(resolve, index * MAX_RESPONSE_INTERVAL * 0.3))
              return value
            })
          )
        const fakeHandleTip = jest.fn(() => Promise.resolve())
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        stateManager._handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await stateManager.sync(state$, 1000)
        expect(fakeHandleTip).toBeCalledTimes(5)
        response.slice(0, 5).forEach((r) => {
          expect(fakeHandleTip).toHaveBeenCalledWith(state$, r)
        })
        response.slice(6, 10).forEach((r) => {
          expect(fakeHandleTip).not.toHaveBeenCalledWith(state$, r)
        })
      })
      test('stop after timeout', async () => {
        const stateManager = ceramic.repository.stateManager
        ceramic.dispatcher.messageBus.queryNetwork = () =>
          timer(0, MAX_RESPONSE_INTERVAL * 0.5).pipe(map((n) => hash(n.toString())))
        const fakeHandleTip = jest.fn(() => Promise.resolve())
        ;(stateManager as any)._handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await stateManager.sync(state$, MAX_RESPONSE_INTERVAL * 10)
        expect(fakeHandleTip).toBeCalledTimes(20)
      })
    })

  })

  describe('With anchorOnRequest == false', () => {
    let inMemoryAnchorService: InMemoryAnchorService

    beforeAll(async () => {
      ceramic = await createCeramic(ipfs, { anchorOnRequest: false })
      controllers = [ceramic.did.id]
      inMemoryAnchorService = ceramic.repository.stateManager.anchorService as InMemoryAnchorService
    })

    afterAll(async () => {
      await ceramic.close()
    })

    test('anchor call', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      await ceramic.repository.stateManager.anchor(stream$)
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await inMemoryAnchorService.anchor()

      await TestUtils.delay(3000)  // Needs a bit of time to delete the request from the store. TODO(CDB-2090): use less brittle approach to waiting for this condition

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    test('No double anchor', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      await ceramic.repository.stateManager.anchor(stream$)
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await inMemoryAnchorService.anchor()

      await TestUtils.delay(3000)  // Needs a bit of time to delete the request from the store. TODO(CDB-2090): use less brittle approach to waiting for this condition

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(stream$.value.log.length).toEqual(2)

      // Now re-request an anchor when the stream is already anchored. Should be a no-op
      await ceramic.repository.stateManager.anchor(stream$)
      expect(stream$.value.log.length).toEqual(2)
    })

    test(`_handleTip is retried until it returns`, async () => {
      const stateManager = ceramic.repository.stateManager
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      const fakeHandleTip = jest.fn()
      const bound = fakeHandleTip.bind(stateManager)
      ;(stateManager as any)._handleTip = bound

      // Mock a throw as the first call
      fakeHandleTip.mockRejectedValueOnce(new Error('Handle tip failed'))

      // Mock the result of the original implementation as the second call - this one should return
      // and stop the retrying mechanism
      fakeHandleTip.mockImplementationOnce(realHandleTip)

      await ceramic.repository.stateManager.anchor(stream$)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await inMemoryAnchorService.anchor()

      await TestUtils.delay(3000)  // Needs a bit of time to delete the request from the store. TODO(CDB-2090): use less brittle approach to waiting for this condition

      // Check that fakeHandleTip was called only three times
      expect(fakeHandleTip).toHaveBeenCalledTimes(2)
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    test(`_handleTip is retried up to three times within _handleAnchorCommit, if it doesn't return`, async () => {
      const stateManager = ceramic.repository.stateManager
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      const fakeHandleTip = jest.fn()
      const bound = fakeHandleTip.bind(stateManager)
      ;(stateManager as any)._handleTip = bound

      // Mock fakeHandleTip to always throw
      fakeHandleTip.mockRejectedValue(new Error('Handle tip failed'))

      await ceramic.repository.stateManager.anchor(stream$)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await inMemoryAnchorService.anchor()

      await TestUtils.delay(3000)  // Needs a bit of time to delete the request from the store. TODO(CDB-2090): use less brittle approach to waiting for this condition

      // Check that fakeHandleTip was called only three times
      expect(fakeHandleTip).toHaveBeenCalledTimes(3)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.FAILED)
    })

    test('anchor request is stored when created and deleted when anchored', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      // @ts-ignore anchorRequestStore is private
      const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore

      expect(await anchorRequestStore.load(stream.id)).toBeNull()
      await ceramic.repository.stateManager.anchor(stream$)
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)
      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()

      await inMemoryAnchorService.anchor()

      await TestUtils.delay(3000)  // Needs a bit of time to delete the request from the store. TODO(CDB-2090): use less brittle approach to waiting for this condition

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      await TestUtils.delay(3000) // Needs a bit of time to delete the request from the store. TODO(CDB-2090): use less brittle approach to waiting for this condition
      expect(await anchorRequestStore.load(stream.id)).toBeNull()
    })

    test('anchor request is stored when created and deleted when failed', async () => {
      const stream = await TileDocument.create(ceramic, { x: 1 }, null, {
        anchor: true,
      })
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // @ts-ignore anchorRequestStore is private
      const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore

      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()

      await inMemoryAnchorService.failPendingAnchors()
      await stream.sync()
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.FAILED)
      await TestUtils.delay(3000) // Needs a bit of time to delete the request from the store. TODO(CDB-2090): use less brittle approach to waiting for this condition
      expect(await anchorRequestStore.load(stream.id)).toBeNull()
    })

    test('anchor request is stored when created and not deleted when processing', async () => {
      const stream = await TileDocument.create(ceramic, { x: 1 }, null, {
        anchor: true,
      })
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // @ts-ignore anchorRequestStore is private
      const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore

      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()

      await inMemoryAnchorService.startProcessingPendingAnchors()
      await stream.sync()
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PROCESSING)
      await TestUtils.delay(2000) // Needs a bit of time delete the request from the store (but it won't delte it in this case)
      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()
    })
  })
})
