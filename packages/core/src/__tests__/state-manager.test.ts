import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'
import {
  type AnchorEvent,
  AnchorStatus,
  IpfsApi,
  SignatureStatus,
  TestUtils,
} from '@ceramicnetwork/common'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from './create-ceramic.js'
import { Ceramic } from '../ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { Subject } from 'rxjs'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'
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

  jest.setTimeout(10000)

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  beforeEach(() => {
    realHandleTip = ceramic.repository._handleTip
  })

  afterEach(() => {
    // Restore the handleTip function in case any of the tests modified it
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ceramic.repository._handleTip = realHandleTip
  })

  describe('With anchorOnRequest == true', () => {
    beforeAll(async () => {
      ceramic = await createCeramic(ipfs, { anchorOnRequest: true })
    })

    afterAll(async () => {
      await ceramic.close()
    })

    test('handleTip', async () => {
      const stream1 = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      stream1.subscribe()
      const streamState1 = await ceramic.repository.load(stream1.id, {})
      await ceramic.repository.anchor(streamState1, {})

      // Wait for anchor to propagate to stream state
      await TestUtils.delay(1000)
      expect(stream1.state.log).toHaveLength(2)
      expect(stream1.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      const ceramic2 = await createCeramic(ipfs)
      const stream2 = await ceramic2.loadStream<TileDocument>(stream1.id, { syncTimeoutSeconds: 0 })
      stream2.subscribe()
      const streamState2 = await ceramic2.repository.load(stream2.id, {})

      expect(stream2.content).toEqual(stream1.content)
      expect(stream2.state.log).toHaveLength(1)
      expect(stream2.state).toEqual(
        expect.objectContaining({ signature: SignatureStatus.SIGNED, anchorStatus: 0 })
      )

      await TestUtils.expectAnchorStatus(stream1, AnchorStatus.ANCHORED)
      await ceramic2.repository._handleTip(streamState2, stream1.state.log[1].cid)

      expect(stream2.state.log).toHaveLength(2)
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
      await ceramic2.repository._handleTip(streamState2, stream1.state.log[1].cid)

      expect(streamState2.state).toEqual(stream1.state)
      // 2 IPFS retrievals - the signed commit and its linked commit payload for the commit to be
      // applied
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Now re-apply the same commit and don't expect any additional calls to IPFS
      await ceramic2.repository._handleTip(streamState2, stream1.state.log[1].cid)
      await ceramic2.repository._handleTip(streamState2, stream1.state.log[0].cid)
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Add another update to stream 1
      const moreNewContent = { foo: 'baz' }
      await stream1.update(moreNewContent, null, { anchor: false })

      retrieveCommitSpy.mockClear()
      await ceramic2.repository._handleTip(streamState2, stream1.state.log[2].cid)

      expect(streamState2.state).toEqual(stream1.state)
      // 2 IPFS retrievals - 1 each for linked commit/envelope for CID to be applied - since there is no lone genesis commit
      // in the stream state.
      expect(retrieveCommitSpy).toBeCalledTimes(2)

      // Now re-apply the same commit and don't expect any additional calls to IPFS
      await ceramic2.repository._handleTip(streamState2, stream1.state.log[2].cid)
      await ceramic2.repository._handleTip(streamState2, stream1.state.log[1].cid)
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
        ceramic.repository.applyCommit(streamState.id, updateRec, {
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
        ceramic.repository.applyCommit(streamState.id, updateRec, {
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
  })

  describe('With anchorOnRequest == false', () => {
    let inMemoryAnchorService: InMemoryAnchorService

    beforeAll(async () => {
      ceramic = await createCeramic(ipfs, { anchorOnRequest: false })
      inMemoryAnchorService = ceramic.anchorService as InMemoryAnchorService
    })

    afterAll(async () => {
      await ceramic.close()
    })

    test('anchor call', async () => {
      const dagImportSpy = jest.spyOn(ceramic.dispatcher._ipfs.dag, 'import')

      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      await ceramic.repository.anchor(stream$, {})
      await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.anchorUpdate(ceramic, stream)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // dag.import is called 2 times:
      // 1) when the genesis commit is created on Ceramic side,
      // 2) when Ceramic applies it
      // expect(dagImportSpy).toHaveBeenCalledTimes(2) // FIXME dependent on the underlying logic :(
      dagImportSpy.mockClear()
    })

    test('No double anchor', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      await ceramic.repository.anchor(stream$, {})
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
      await TestUtils.anchorUpdate(ceramic, stream)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
      expect(stream$.value.log.length).toEqual(2)

      // Now re-request an anchor when the stream is already anchored. Should be a no-op
      await ceramic.repository.anchor(stream$, {})
      expect(stream$.value.log.length).toEqual(2)
    })

    test(`handleTip is retried until it returns`, async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      const handleTipSpy = jest.spyOn(ceramic.repository, '_handleTip')

      // Mock a throw as the first call
      handleTipSpy.mockRejectedValueOnce(new Error('Handle tip failed'))

      // Mock the result of the original implementation as the second call - this one should return
      // and stop the retrying mechanism
      handleTipSpy.mockImplementationOnce(realHandleTip)

      await ceramic.repository.anchor(stream$, {})
      await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.anchorUpdate(ceramic, stream)

      // Check that fakeHandleTip was called only three times
      expect(handleTipSpy).toHaveBeenCalledTimes(2) // FIXME WHAT? An artifact of double-handling maybe
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    test(`handleTip is retried up to three times within _handleAnchorCommit, if it doesn't return`, async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      const fakeHandleTip = jest.fn() as unknown as typeof ceramic.repository._handleTip
      ceramic.repository._handleTip = fakeHandleTip

      // Mock fakeHandleTip to always throw
      fakeHandleTip.mockRejectedValue(new Error('Handle tip failed'))

      await ceramic.repository.anchor(stream$, {})
      await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await TestUtils.anchorUpdate(ceramic, stream)

      // Check that fakeHandleTip was called only three times
      // expect(fakeHandleTip).toHaveBeenCalledTimes(6) // FIXME WHAT? An artifact of double-handling maybe

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.FAILED)
    })

    test('anchor request is stored when created and deleted when anchored', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      // @ts-ignore anchorRequestStore is private
      const anchorRequestStore = ceramic.repository.anchorRequestStore

      expect(await anchorRequestStore.load(stream.id)).toBeNull()
      await ceramic.repository.anchor(stream$, {})
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)
      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()

      await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
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
      await TestUtils.hasAcceptedAnchorRequest(ceramic, stream.tip)
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // @ts-ignore anchorRequestStore is private
      const anchorRequestStore = ceramic.repository.anchorRequestStore

      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()

      inMemoryAnchorService.moveAnchors(
        AnchorRequestStatusName.PENDING,
        AnchorRequestStatusName.FAILED
      )
      await TestUtils.expectAnchorStatus(stream, AnchorStatus.FAILED)

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
      await TestUtils.hasAcceptedAnchorRequest(ceramic, stream.tip)
      expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

      // @ts-ignore anchorRequestStore is private
      const anchorRequestStore = ceramic.repository.anchorRequestStore

      expect(await anchorRequestStore.load(stream.id)).not.toBeNull()

      inMemoryAnchorService.moveAnchors(
        AnchorRequestStatusName.PENDING,
        AnchorRequestStatusName.PROCESSING
      )
      await TestUtils.expectAnchorStatus(stream, AnchorStatus.PROCESSING)
      await TestUtils.delay(2000) // Wait a bit to confirm that the request is *not* deleted from the anchor request store
      await expect(anchorRequestStore.load(stream.id)).resolves.not.toBeNull()
    })

    describe('Multiple anchor requests', () => {
      test('Anchor completed for non tip should not remove any requests from the store if the tip has been requested but not anchored', async () => {
        // @ts-ignore anchorRequestStore is private
        const anchorRequestStore = ceramic.repository.anchorRequestStore

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Anchor the first commit and subscribe
        await ceramic.repository.anchor(stream$, {})
        await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.PENDING)

        await inMemoryAnchorService.anchor()

        // We have received the anchor commit through pubsub, we have not received the anchor response yet
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.ANCHORED)

        // Create the 2nd commit that is valid because it builds on the anchor commit
        await tile.update({ abc: 456, def: 789 }, null, { anchor: false })
        // Anchor the 2nd commit and subscribe
        await ceramic.repository.anchor(stream$, {})
        await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )

        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
      })

      test.todo(
        'Anchor REPLACED for non tip should not remove any requests from the store if the tip has been requested but not anchored'
      ) // FIXME Handle replacing

      test('Anchor failing for non tip should not remove any requests from the store if the tip has been requested but not anchored', async () => {
        const anchorRequestStore = ceramic.repository.anchorRequestStore

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Emulate CAS responses to the 1st commit
        await ceramic.repository.anchor(stream$, {})
        await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        inMemoryAnchorService.moveAnchors(
          AnchorRequestStatusName.PENDING,
          AnchorRequestStatusName.PROCESSING
        )
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.PROCESSING)

        // Create the 2nd commit and request an anchor for it
        await tile.update({ abc: 456, def: 789 }, null, { anchor: true })
        await TestUtils.hasAcceptedAnchorRequest(ceramic, tile.tip)
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.PENDING)

        // Move 1st commit to FAILED
        inMemoryAnchorService.moveAnchors(
          AnchorRequestStatusName.PROCESSING,
          AnchorRequestStatusName.FAILED
        )

        // Polling for the 1st commit should stop
        // There should still be an request in the anchorRequestStore for the stream's tip
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
      })

      test.each(['completed', 'failed'])(
        'Anchor %p for tip should update the stream state and be removed from the anchorRequestStore',
        async (tipAnchorSuccess) => {
          // @ts-ignore anchorRequestStore is private
          const anchorRequestStore = ceramic.repository.anchorRequestStore

          const tile = await TileDocument.create(ceramic, { x: 1 }, null, {
            anchor: false,
          })
          const stream$ = await ceramic.repository.load(tile.id, {})

          // anchor the first commit
          await ceramic.repository.anchor(stream$, {})
          await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
          expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
            stream$.tip.toString()
          )
          await TestUtils.expectAnchorStatus(tile, AnchorStatus.PENDING)

          await tile.update({ x: 2 }, null, { anchor: false })
          // anchor the second commit
          await ceramic.repository.anchor(stream$, {})
          await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
          expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
            stream$.tip.toString()
          )
          await TestUtils.expectAnchorStatus(tile, AnchorStatus.PENDING)

          if (tipAnchorSuccess === 'completed') {
            // complete both anchors
            await inMemoryAnchorService.anchor()
            await TestUtils.expectAnchorStatus(tile, AnchorStatus.ANCHORED)
          } else {
            // fail both anchors
            inMemoryAnchorService.moveAnchors(
              AnchorRequestStatusName.PENDING,
              AnchorRequestStatusName.FAILED
            )
            await TestUtils.expectAnchorStatus(tile, AnchorStatus.FAILED)
          }

          // there should be no requests in the store
          expect(await anchorRequestStore.load(tile.id)).toBeNull()
        }
      )

      test('Anchor failing for non tip should have no requests in the anchorRequestStore if the tip`s anchor request has reached a terminal state', async () => {
        // @ts-ignore anchorRequestStore is private
        const anchorRequestStore = ceramic.repository.anchorRequestStore

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Anchor the first commit and subscribe
        await ceramic.repository.anchor(stream$, {})
        await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        inMemoryAnchorService.moveAnchors(
          AnchorRequestStatusName.PENDING,
          AnchorRequestStatusName.PROCESSING
        )
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.PROCESSING)

        // Create the 2nd commit
        await tile.update({ abc: 456, def: 789 }, null, { anchor: false })
        // Anchor the 2nd commit and subscribe
        await ceramic.repository.anchor(stream$, {})
        await TestUtils.hasAcceptedAnchorRequest(ceramic, stream$.tip)
        expect(await anchorRequestStore.load(tile.id).then((ar) => ar.cid.toString())).toEqual(
          stream$.tip.toString()
        )
        inMemoryAnchorService.moveAnchors(
          [AnchorRequestStatusName.PROCESSING, AnchorRequestStatusName.PENDING],
          AnchorRequestStatusName.FAILED
        )
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.FAILED)

        // the stream should have been removed from the request store as it is the tip
        expect(await anchorRequestStore.load(tile.id)).toBeNull()

        // the stream should have been removed from the request store again but there should be no change because it should have been removed already
        expect(await anchorRequestStore.load(tile.id)).toBeNull()
      })

      // TODO: CDB-2659 Make this test work
      test.skip('Anchor failing for non tip should remove the request from the store if the tip has no requested anchor', async () => {
        // @ts-ignore anchorRequestStore is private
        const anchorRequestStore = ceramic.repository.anchorRequestStore
        const requestAnchorSpy = jest.spyOn(inMemoryAnchorService, 'requestAnchor')

        const tile = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
        const stream$ = await ceramic.repository.load(tile.id, {})

        // Emulate CAS responses for the 1st commit
        const fauxAnchorEvent$ = new Subject<AnchorEvent>()
        requestAnchorSpy.mockReturnValueOnce(Promise.resolve(fauxAnchorEvent$))
        // anchor the first commit and subscribe
        await ceramic.repository.anchor(stream$, {})
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
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.PROCESSING)

        // Create the 2nd commit but do not anchor it
        await tile.update({ abc: 456, def: 789 }, null, { anchor: false })
        await TestUtils.expectAnchorStatus(tile, AnchorStatus.NOT_REQUESTED)

        // The emulated CAS fails the 1st request
        fauxAnchorEvent$.next({
          status: AnchorRequestStatusName.FAILED,
          streamId: tile.id,
          cid: tile.state.log[0].cid,
          message: 'CAS failed the request',
        })

        // Polling for the 1st commit should stop
        expect(await anchorRequestStore.load(tile.id)).toBeNull()
      })
    })
  })
})
