import {
  expect,
  jest,
  beforeEach,
  describe,
  test,
  beforeAll,
  afterEach,
  afterAll,
} from '@jest/globals'
import {
  AnchorStatus,
  CommitType,
  IpfsApi,
  SignatureStatus,
  Stream,
  TestUtils,
  AnchorCommit,
  type AnchorEvent,
} from '@ceramicnetwork/common'
import { CID } from 'multiformats/cid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import { RunningState } from '../state-management/running-state.js'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from './create-ceramic.js'
import { Ceramic } from '../ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import * as uint8arrays from 'uint8arrays'
import * as sha256 from '@stablelib/sha256'
import { StreamID } from '@ceramicnetwork/streamid'
import { from, Subject, timer, firstValueFrom } from 'rxjs'
import { concatMap, map } from 'rxjs/operators'
import { MAX_RESPONSE_INTERVAL } from '../pubsub/message-bus.js'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'
import { whenSubscriptionDone } from './when-subscription-done.util.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'

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
    realHandleTip = ceramic.repository._internals.handleTip
  })

  afterEach(() => {
    // Restore the handleTip function in case any of the tests modified it
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ceramic.repository._internals.handleTip = realHandleTip
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
      stream1.subscribe()
      const streamState1 = await ceramic.repository.load(stream1.id, {})
      await ceramic.repository.stateManager.anchor(streamState1, {})

      const ceramic2 = await createCeramic(ipfs)
      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id, { syncTimeoutSeconds: 0 })
      stream2.subscribe()
      const streamState2 = await ceramic2.repository.load(stream2.id, {})

      expect(stream2.content).toEqual(stream1.content)
      expect(stream2.state).toEqual(
        expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 })
      )

      await ceramic2.repository._internals.handleTip(streamState2, stream1.state.log[1].cid)

      expect(stream2.state).toEqual(stream1.state)
      await ceramic2.close()
    })

    test('handleTip for commit already in log', async () => {
      const newContent = { foo: 'bar' }
      const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, {
        anchor: false,
      })
      await stream1.update(newContent, null, { anchor: false })

      const ceramic2 = await createCeramic(ipfs)
      const retrieveCommitSpy = jest.spyOn(ceramic2.dispatcher, 'retrieveCommit')

      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id, { syncTimeoutSeconds: 0 })
      const streamState2 = await ceramic2.repository.load(stream2.id, {})

      retrieveCommitSpy.mockClear()
      await ceramic2.repository._internals.handleTip(streamState2, stream1.state.log[1].cid)

      expect(streamState2.state).toEqual(stream1.state)
      // 2 IPFS retrievals - the signed commit and its linked commit payload for the commit to be
      // applied
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Now re-apply the same commit and don't expect any additional calls to IPFS
      await ceramic2.repository._internals.handleTip(streamState2, stream1.state.log[1].cid)
      await ceramic2.repository._internals.handleTip(streamState2, stream1.state.log[0].cid)
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Add another update to stream 1
      const moreNewContent = { foo: 'baz' }
      await stream1.update(moreNewContent, null, { anchor: false })

      retrieveCommitSpy.mockClear()
      await ceramic2.repository._internals.handleTip(streamState2, stream1.state.log[2].cid)

      expect(streamState2.state).toEqual(stream1.state)
      // 2 IPFS retrievals - 1 each for linked commit/envelope for CID to be applied - since there is no lone genesis commit
      // in the stream state.
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Now re-apply the same commit and don't expect any additional calls to IPFS
      await ceramic2.repository._internals.handleTip(streamState2, stream1.state.log[2].cid)
      await ceramic2.repository._internals.handleTip(streamState2, stream1.state.log[1].cid)
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      await ceramic2.close()
    })

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
      const stream1 = await TileDocument.create<any>(ceramic, INITIAL_CONTENT, null, {
        anchor: false,
      })
      stream1.subscribe()
      const streamState1 = await ceramic.repository.load(stream1.id, {})
      expect(publishTip).toHaveBeenCalledTimes(1)
      expect(publishTip).toHaveBeenCalledWith(stream1.id, stream1.tip, undefined)
      publishTip.mockClear()
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
        const internals = ceramic.repository._internals
        const response = responseTips(1)
        ceramic.dispatcher.messageBus.queryNetwork = () => from(response)
        const fakeHandleTip = jest.fn(() =>
          Promise.resolve()
        ) as unknown as typeof internals.handleTip
        internals.handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await internals.sync(state$, 1000)
        expect(fakeHandleTip).toHaveBeenCalledWith(state$, response[0])
      })
      test('handle all received', async () => {
        const internals = ceramic.repository._internals
        const amount = 10
        const response = responseTips(amount)
        ceramic.dispatcher.messageBus.queryNetwork = () => from(response)
        const fakeHandleTip = jest.fn(() =>
          Promise.resolve()
        ) as unknown as typeof internals.handleTip
        internals.handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await internals.sync(state$, 1000)
        response.forEach((r) => {
          expect(fakeHandleTip).toHaveBeenCalledWith(state$, r)
        })
      })
      test('not handle delayed', async () => {
        const internals = ceramic.repository._internals
        const amount = 10
        const response = responseTips(amount)
        ceramic.dispatcher.messageBus.queryNetwork = () =>
          from(response).pipe(
            concatMap(async (value, index) => {
              await new Promise((resolve) =>
                setTimeout(resolve, index * MAX_RESPONSE_INTERVAL * 0.3)
              )
              return value
            })
          )
        const fakeHandleTip = jest.fn(() =>
          Promise.resolve()
        ) as unknown as typeof internals.handleTip
        internals.handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await internals.sync(state$, 1000)
        expect(fakeHandleTip).toBeCalledTimes(5)
        response.slice(0, 5).forEach((r) => {
          expect(fakeHandleTip).toHaveBeenCalledWith(state$, r)
        })
        response.slice(6, 10).forEach((r) => {
          expect(fakeHandleTip).not.toHaveBeenCalledWith(state$, r)
        })
      })
      test('stop after timeout', async () => {
        const internals = ceramic.repository._internals
        ceramic.dispatcher.messageBus.queryNetwork = () =>
          timer(0, MAX_RESPONSE_INTERVAL * 0.5).pipe(map((n) => hash(n.toString())))
        const fakeHandleTip = jest.fn(() =>
          Promise.resolve()
        ) as unknown as typeof internals.handleTip
        internals.handleTip = fakeHandleTip
        const state$ = {
          id: FAKE_STREAM_ID,
          value: {
            log: [{ type: CommitType.GENESIS, cid: FAKE_STREAM_ID }],
          },
        } as unknown as RunningState
        await internals.sync(state$, MAX_RESPONSE_INTERVAL * 10)
        expect(fakeHandleTip).toBeCalledTimes(20)
      })
    })
  })

  describe('With anchorOnRequest == false', () => {
    let inMemoryAnchorService: InMemoryAnchorService

    function expectAnchorStatus(stream: Stream, status: AnchorStatus) {
      return TestUtils.waitForState(
        stream,
        1000,
        (s) => s.anchorStatus === status,
        (s) => {
          throw new Error(`Expected anchor status ${status} but found ${s.anchorStatus}`)
        }
      )
    }

    beforeAll(async () => {
      ceramic = await createCeramic(ipfs, { anchorOnRequest: false })
      controllers = [ceramic.did.id]
      inMemoryAnchorService = ceramic.repository.stateManager.anchorService as InMemoryAnchorService
    })

    afterAll(async () => {
      await ceramic.close()
    })

    test('stop on REPLACED', async () => {
      const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(tile.id, {})
      const requestAnchorSpy = jest.spyOn(
        ceramic.repository.stateManager.anchorService,
        'requestAnchor'
      )
      // Emulate CAS responses to the 1st commit
      const fauxAnchorEvent$ = new Subject<AnchorEvent>()
      requestAnchorSpy.mockReturnValueOnce(Promise.resolve(fauxAnchorEvent$))
      // Subscription for the 1st commit
      const stillProcessingFirst = await ceramic.repository.stateManager.anchor(stream$, {})
      // The emulated CAS accepts the request
      fauxAnchorEvent$.next({
        status: AnchorRequestStatusName.PENDING,
        streamId: tile.id,
        cid: tile.state.log[0].cid,
        message: 'CAS accepted the request',
      })
      await expectAnchorStatus(tile, AnchorStatus.PENDING)

      // Now do the 2nd commit, anchor it
      await tile.update({ abc: 456, def: 789 }, null, { anchor: false })
      const stillProcessingSecond = await ceramic.repository.stateManager.anchor(stream$, {})
      await expectAnchorStatus(tile, AnchorStatus.PENDING)

      // The emulated CAS informs Ceramic, that the 1st tip got REPLACED
      fauxAnchorEvent$.next({
        status: AnchorRequestStatusName.REPLACED,
        streamId: tile.id,
        cid: tile.state.log[0].cid,
        message: 'Replaced',
      })

      // Polling for the 1st commit should stop
      await expect(whenSubscriptionDone(stillProcessingFirst)).resolves.not.toThrow()
      expect(stillProcessingFirst.closed).toBeTruthy()

      // Polling for 2nd commit should continue
      expect(stillProcessingSecond.closed).toBeFalsy()

      // Now teardown
      await inMemoryAnchorService.anchor()
      fauxAnchorEvent$.complete()
      await whenSubscriptionDone(stillProcessingSecond)
    })

    test('anchor call', async () => {
      const dagImportSpy = jest.spyOn(ceramic.dispatcher._ipfs.dag, 'import')

      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      await ceramic.repository.stateManager.anchor(stream$, {})
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.anchorUpdate(ceramic, stream)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // dag.import is called 4 times.  Once when the genesis commit is created, twice with the
      // AnchorCommit itself (once when the InMemoryAnchorService publishes the AnchorCommit and
      // once when Ceramic applies it), and once with the CAR file with the merkle witness
      // received from the CAS.
      expect(dagImportSpy).toHaveBeenCalledTimes(4)
      dagImportSpy.mockClear()
    })

    test('No double anchor', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      await ceramic.repository.stateManager.anchor(stream$, {})
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.anchorUpdate(ceramic, stream)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(stream$.value.log.length).toEqual(2)

      // Now re-request an anchor when the stream is already anchored. Should be a no-op
      await ceramic.repository.stateManager.anchor(stream$, {})
      expect(stream$.value.log.length).toEqual(2)
    })

    test(`handleTip is retried until it returns`, async () => {
      const internals = ceramic.repository._internals
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      const handleTipSpy = jest.spyOn(internals, 'handleTip')

      // Mock a throw as the first call
      handleTipSpy.mockRejectedValueOnce(new Error('Handle tip failed'))

      // Mock the result of the original implementation as the second call - this one should return
      // and stop the retrying mechanism
      handleTipSpy.mockImplementationOnce(realHandleTip)

      await ceramic.repository.stateManager.anchor(stream$, {})

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.anchorUpdate(ceramic, stream)

      // Check that fakeHandleTip was called only three times
      expect(handleTipSpy).toHaveBeenCalledTimes(2)
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    test(`handleTip is retried up to three times within _handleAnchorCommit, if it doesn't return`, async () => {
      const internals = ceramic.repository._internals
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      const fakeHandleTip = jest.fn() as unknown as typeof internals.handleTip
      internals.handleTip = fakeHandleTip

      // Mock fakeHandleTip to always throw
      fakeHandleTip.mockRejectedValue(new Error('Handle tip failed'))

      await ceramic.repository.stateManager.anchor(stream$, {})

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.anchorUpdate(ceramic, stream)

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
      await ceramic.repository.stateManager.anchor(stream$, {})
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)
      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()

      await TestUtils.anchorUpdate(ceramic, stream)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // Anchor request should be asynchronously deleted from the anchor request store
      await TestUtils.waitForConditionOrTimeout(async function () {
        const anchorRequest = await anchorRequestStore.load(stream.id)
        return anchorRequest === null
      })

      await expect(anchorRequestStore.load(stream.id)).resolves.toBeNull()
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

      // Anchor request should be asynchronously deleted from the anchor request store
      await TestUtils.waitForConditionOrTimeout(async function () {
        const anchorRequest = await anchorRequestStore.load(stream.id)
        return anchorRequest === null
      })
      await expect(anchorRequestStore.load(stream.id)).resolves.toBeNull()
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
      await TestUtils.delay(2000) // Wait a bit to confirm that the request is *not* deleted from the anchor request store
      await expect(anchorRequestStore.load(stream.id)).resolves.not.toBeNull()
    })

    describe('Multiple anchor requests', () => {
      test('Anchor completed for non tip should not remove any requests from the store if the tip has been requested but not anchored', async () => {
        // @ts-ignore anchorRequestStore is private
        const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore

        const originalPollForAnchorResponse: InMemoryAnchorService['pollForAnchorResponse'] =
          inMemoryAnchorService.pollForAnchorResponse.bind(inMemoryAnchorService)
        const pollForAnchorResponseSpy = jest.spyOn(
          ceramic.repository.stateManager.anchorService,
          'pollForAnchorResponse'
        )

        // This replicates receiving the anchor commit via pubsub first
        const originalPublishAnchorCommit =
          inMemoryAnchorService._publishAnchorCommit.bind(inMemoryAnchorService)
        const publishAnchorCommitSpy = jest.spyOn(inMemoryAnchorService, '_publishAnchorCommit')
        publishAnchorCommitSpy.mockImplementationOnce(
          async (streamId: StreamID, commit: AnchorCommit) => {
            const anchorCommit = await originalPublishAnchorCommit(streamId, commit)
            await ceramic.repository.stateManager.handleUpdate(streamId, anchorCommit)
            return anchorCommit
          }
        )

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Emulate CAS responses to the 1st commit
        const firstAnchorEvent$ = new Subject<AnchorEvent>()
        pollForAnchorResponseSpy.mockImplementationOnce((streamId, commit) => {
          originalPollForAnchorResponse(streamId, commit)
          return firstAnchorEvent$
        })

        // Anchor the first commit and subscribe
        const firstAnchorResponseSub = await ceramic.repository.stateManager.anchor(stream$, {})
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        // The emulated CAS accepts the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.PENDING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS accepted the request',
        })
        // The emulated CAS is processing the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.PROCESSING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS is processing the request',
        })
        await expectAnchorStatus(tile, AnchorStatus.PROCESSING)

        await inMemoryAnchorService.anchor()

        // We have received the anchor commit through pubsub, we have not received the anchor response yet
        await expectAnchorStatus(tile, AnchorStatus.ANCHORED)

        // Create the 2nd commit that is valid because it builds on the anchor commit
        await tile.update({ abc: 456, def: 789 }, null, { anchor: false })
        // Emulate CAS responses to the 2nd commit
        const secondAnchorEvent$ = new Subject<AnchorEvent>()
        pollForAnchorResponseSpy.mockReturnValueOnce(secondAnchorEvent$)
        // Anchor the 2nd commit and subscribe
        await ceramic.repository.stateManager.anchor(stream$, {})
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )

        // The emulated CAS receives the COMPLETED anchor status for the 1st request
        const completedASRForFirstCommit = await firstValueFrom(
          originalPollForAnchorResponse(stream$.id, tile.state.log[0].cid)
        )
        firstAnchorEvent$.next(completedASRForFirstCommit)

        // The emulated CAS accepts the 2nd request
        secondAnchorEvent$.next({
          status: AnchorRequestStatusName.PENDING,
          streamId: tile.id,
          cid: tile.state.log[1].cid,
          message: 'CAS accepted the request',
        })

        // Polling for the 1st commit should stop
        await expect(whenSubscriptionDone(firstAnchorResponseSub)).resolves.not.toThrow()
        expect(firstAnchorResponseSub.closed).toBeTruthy()

        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
      })

      test('Anchor failing for non tip should not remove any requests from the store if the tip has been requested but not anchored', async () => {
        // @ts-ignore anchorRequestStore is private
        const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore
        const requestAnchorSpy = jest.spyOn(
          ceramic.repository.stateManager.anchorService,
          'requestAnchor'
        )

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Emulate CAS responses to the 1st commit
        const firstAnchorEvent$ = new Subject<AnchorEvent>()
        requestAnchorSpy.mockReturnValueOnce(Promise.resolve(firstAnchorEvent$))
        // Anchor the 1st commit and subscribe
        const firstAnchorResponseSub = await ceramic.repository.stateManager.anchor(stream$, {})
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        // The emulated CAS accepts the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.PENDING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS accepted the request',
        })
        // The emulated CAS processing the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.PROCESSING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS is processing the request',
        })
        await expectAnchorStatus(tile, AnchorStatus.PROCESSING)

        // Create the 2nd commit and request an anchor for it
        await tile.update({ abc: 456, def: 789 }, null, { anchor: true })
        await expectAnchorStatus(tile, AnchorStatus.PENDING)

        // The emulated CAS FAILED the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.FAILED,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS failed the request',
        })

        // Polling for the 1st commit should stop
        await expect(whenSubscriptionDone(firstAnchorResponseSub)).resolves.not.toThrow()
        expect(firstAnchorResponseSub.closed).toBeTruthy()
        // There should still be an request in the anchorRequestStore for the stream's tip
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
      })

      test.each(['completed', 'failed'])(
        'Anchor %p for tip should update the stream state and be removed from the anchorRequestStore',
        async (tipAnchorSuccess) => {
          // @ts-ignore anchorRequestStore is private
          const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore

          const tile = await TileDocument.create(ceramic, { x: 1 }, null, {
            anchor: false,
          })
          const stream$ = await ceramic.repository.load(tile.id, {})

          // anchor the first commit
          const firstAnchorResponseSub = await ceramic.repository.stateManager.anchor(stream$, {})
          expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
            stream$.tip.toString()
          )
          await expectAnchorStatus(tile, AnchorStatus.PENDING)

          await tile.update({ x: 2 }, null, { anchor: false })
          // anchor the second commit
          const secondAnchorRequestSub = await ceramic.repository.stateManager.anchor(stream$, {})
          expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
            stream$.tip.toString()
          )
          await expectAnchorStatus(tile, AnchorStatus.PENDING)

          if (tipAnchorSuccess === 'completed') {
            // complete both anchors
            await inMemoryAnchorService.anchor()
            await expectAnchorStatus(tile, AnchorStatus.ANCHORED)
          } else {
            // fail both anchors
            await inMemoryAnchorService.failPendingAnchors()
            await expectAnchorStatus(tile, AnchorStatus.FAILED)
          }

          // Polling for the 1st commit should stop
          await expect(whenSubscriptionDone(firstAnchorResponseSub)).resolves.not.toThrow()
          expect(firstAnchorResponseSub.closed).toBeTruthy()

          // Polling for the 2nd commit should stop
          await expect(whenSubscriptionDone(secondAnchorRequestSub)).resolves.not.toThrow()
          expect(secondAnchorRequestSub.closed).toBeTruthy()

          // there should be no requests in the store
          expect(await anchorRequestStore.load(tile.id)).toBeNull()
        }
      )

      test('Anchor failing for non tip should have no requests in the anchorRequestStore if the tip`s anchor request has reached a terminal state', async () => {
        // @ts-ignore anchorRequestStore is private
        const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore
        const requestAnchorSpy = jest.spyOn(
          ceramic.repository.stateManager.anchorService,
          'requestAnchor'
        )

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Emulate CAS responses to the 1st commit
        const firstAnchorEvent$ = new Subject<AnchorEvent>()
        requestAnchorSpy.mockReturnValueOnce(Promise.resolve(firstAnchorEvent$))
        // Anchor the first commit and subscribe
        const firstAnchorResponseSub = await ceramic.repository.stateManager.anchor(stream$, {})
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        // The emulated CAS accepts the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.PENDING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS accepted the request',
        })
        // The emulated CAS is processing the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.PROCESSING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS is processing the request',
        })
        await expectAnchorStatus(tile, AnchorStatus.PROCESSING)

        // Create the 2nd commit
        await tile.update({ abc: 456, def: 789 }, null, { anchor: false })
        // Emulate CAS responses to the 2nd commit
        const secondAnchorEvent$ = new Subject<AnchorEvent>()
        requestAnchorSpy.mockReturnValueOnce(Promise.resolve(secondAnchorEvent$))
        // Anchor the 2nd commit and subscribe
        const secondAnchorRequestSub = await ceramic.repository.stateManager.anchor(stream$, {})
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        // The emulated CAS accepts the 2nd request
        secondAnchorEvent$.next({
          status: AnchorRequestStatusName.PENDING,
          streamId: tile.id,
          cid: tile.state.log[1].cid,
          message: 'CAS accepted the request',
        })
        // The emulated CAS FAILED the 2nd request
        secondAnchorEvent$.next({
          status: AnchorRequestStatusName.FAILED,
          streamId: tile.id,
          cid: tile.state.log[1].cid,
          message: 'CAS failed the request',
        })
        await expectAnchorStatus(tile, AnchorStatus.FAILED)

        // Polling for the 2nd commit should stop
        await expect(whenSubscriptionDone(secondAnchorRequestSub)).resolves.not.toThrow()
        expect(secondAnchorRequestSub.closed).toBeTruthy()
        // the stream should have been removed from the request store as it is the tip
        expect(await anchorRequestStore.load(tile.id)).toBeNull()

        // The emulated CAS FAILED the 1st request
        firstAnchorEvent$.next({
          status: AnchorRequestStatusName.FAILED,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS failed the request',
        })
        // Polling for the 1st commit should stop
        await expect(whenSubscriptionDone(firstAnchorResponseSub)).resolves.not.toThrow()
        expect(firstAnchorResponseSub.closed).toBeTruthy()
        // the stream should have been removed from the request store again but there should be no change because it should have been removed already
        expect(await anchorRequestStore.load(tile.id)).toBeNull()
      })

      // TODO: CDB-2659 Make this test work
      test.skip('Anchor failing for non tip should remove the request from the store if the tip has no requested anchor', async () => {
        // @ts-ignore anchorRequestStore is private
        const anchorRequestStore = ceramic.repository.stateManager.anchorRequestStore
        const requestAnchorSpy = jest.spyOn(
          ceramic.repository.stateManager.anchorService,
          'requestAnchor'
        )

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Emulate CAS responses for the 1st commit
        const fauxAnchorEvent$ = new Subject<AnchorEvent>()
        requestAnchorSpy.mockReturnValueOnce(Promise.resolve(fauxAnchorEvent$))
        // anchor the first commit and subscribe
        const firstAnchorResponseSub = await ceramic.repository.stateManager.anchor(stream$, {})
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        // The emulated CAS accepts the 1st request
        fauxAnchorEvent$.next({
          status: AnchorRequestStatusName.PENDING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS accepted the request',
        })
        // The emulated CAS is processing the 1st request
        fauxAnchorEvent$.next({
          status: AnchorRequestStatusName.PROCESSING,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS is processing the request',
        })
        await expectAnchorStatus(tile, AnchorStatus.PROCESSING)

        // Create the 2nd commit but do not anchor it
        await tile.update({ abc: 456, def: 789 }, null, { anchor: false })
        await expectAnchorStatus(tile, AnchorStatus.NOT_REQUESTED)

        // The emulated CAS fails the 1st request
        fauxAnchorEvent$.next({
          status: AnchorRequestStatusName.FAILED,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS failed the request',
        })

        // Polling for the 1st commit should stop
        await expect(whenSubscriptionDone(firstAnchorResponseSub)).resolves.not.toThrow()
        expect(firstAnchorResponseSub.closed).toBeTruthy()
        expect(await anchorRequestStore.load(tile.id)).toBeNull()
      })
    })
  })
})
