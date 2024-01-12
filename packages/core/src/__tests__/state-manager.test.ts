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
import { AnchorStatus, IpfsApi, SignatureStatus } from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '@ceramicnetwork/core'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { createCeramic } from './create-ceramic.js'
import { Ceramic } from '../ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

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
      await CoreUtils.anchorUpdate(ceramic, schemaDoc)

      const stream = await TileDocument.create(ceramic, { stuff: 1 })
      const streamState = await ceramic.repository.load(stream.id, {})
      await CoreUtils.anchorUpdate(ceramic, stream)
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
      await CoreUtils.anchorUpdate(ceramic, schemaDoc)

      const conformingContent = { stuff: 'foo' }
      const nonConformingContent = { stuff: 1 }
      const stream = await TileDocument.create<any>(ceramic, conformingContent, {
        schema: schemaDoc.commitId,
      })
      const streamState = await ceramic.repository.load(stream.id, {})
      await CoreUtils.anchorUpdate(ceramic, stream)

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
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await CoreUtils.anchorUpdate(ceramic, stream)

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)

      // dag.import is called 2 times:
      // 1) when the genesis commit is created on Ceramic side,
      // 2) when Ceramic applies an anchor commit received from CAS.
      expect(dagImportSpy).toHaveBeenCalledTimes(2)
      dagImportSpy.mockClear()
    })

    test('No double anchor', async () => {
      const stream = await TileDocument.create(ceramic, INITIAL_CONTENT, null, { anchor: false })
      const stream$ = await ceramic.repository.load(stream.id, {})

      await ceramic.repository.anchor(stream$, {})
      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await CoreUtils.anchorUpdate(ceramic, stream)

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

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await CoreUtils.anchorUpdate(ceramic, stream)

      // Check that fakeHandleTip was called only two times
      expect(handleTipSpy).toHaveBeenCalledTimes(2)
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

      expect(stream$.value.anchorStatus).toEqual(AnchorStatus.PENDING)

      await CoreUtils.anchorUpdate(ceramic, stream)

      // Check that fakeHandleTip was called only three times
      expect(fakeHandleTip).toHaveBeenCalledTimes(3)

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

      await CoreUtils.anchorUpdate(ceramic, stream)

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
  })
})
