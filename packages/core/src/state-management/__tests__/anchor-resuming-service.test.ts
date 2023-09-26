import { jest } from '@jest/globals'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { InMemoryAnchorService } from '../../anchor/memory/in-memory-anchor-service.js'
import { Observable, Subject } from 'rxjs'
import {
  AnchorEvent,
  AnchorStatus,
  GenesisCommit,
  IpfsApi,
  SyncOptions,
  TestUtils,
} from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import tmp from 'tmp-promise'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { AnchorResumingService } from '../anchor-resuming-service.js'
import all from 'it-all'
import { AnchorRequestStore } from '../../store/anchor-request-store.js'
import { CID } from 'multiformats/cid'

/**
 * Returns a list of all StreamIDs stored in the AnchorRequestStore.
 */
async function getPendingAnchorStreamIDs(
  anchorRequestStore: AnchorRequestStore
): Promise<Array<string>> {
  return (await all(anchorRequestStore.list()))
    .reduce((acc, array) => acc.concat(array), [])
    .map((result) => result.key.toString())
}

describe('resumeRunningStatesFromAnchorRequestStore(...) method', () => {
  jest.setTimeout(30 * 1000)

  let ipfs: IpfsApi
  let stateStoreDirectoryName: string

  beforeAll(async () => {
    ipfs = await createIPFS()
  })

  afterAll(async () => {
    await ipfs.stop()
  })

  beforeEach(async () => {
    stateStoreDirectoryName = await tmp.tmpName()
  })

  afterEach(async () => {
    jest.resetAllMocks()
  })

  // FIXME Infinite Polling
  test.skip.each`
    anchorStatus
    ${AnchorStatus.NOT_REQUESTED}
    ${AnchorStatus.PENDING}
  `(`Anchors streams with $anchorStatus status in the stream state store`, async (testParam) => {
    const numberOfStreams = 3

    const ceramic = await createCeramic(ipfs, {
      stateStoreDirectory: stateStoreDirectoryName,
    })

    const anchorService = ceramic.repository.anchorService as InMemoryAnchorService
    if (testParam.anchorStatus === AnchorStatus.NOT_REQUESTED) {
      const mockedRequestAnchor = jest.fn()
      mockedRequestAnchor.mockImplementation(() => {
        return new Observable<AnchorEvent>()
      })
      // @ts-ignore
      anchorService.requestAnchor = mockedRequestAnchor
    }

    // create a few streams with anchor === true to make sure that they stay in the anchor request store
    //  and in the stream state store
    const streamIds = await Promise.all(
      [...Array(numberOfStreams).keys()].map((number) => {
        return TileDocument.create(ceramic, { x: number }, null, {
          anchor: true,
        }).then((tileDocument) => {
          return tileDocument.id
        })
      })
    )

    const loaded = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
    // LevelDB Store stores keys ordered lexicographically
    expect(streamIds.map((streamId) => streamId.toString()).sort()).toEqual(loaded)

    const runnningStates$ = await Promise.all(
      streamIds.map((streamId) => {
        return ceramic.repository.load(streamId, {
          sync: SyncOptions.NEVER_SYNC,
        })
      })
    )

    runnningStates$.forEach((runningState$) => {
      expect(runningState$.state.anchorStatus).toEqual(testParam.anchorStatus)
    })

    // update one of the streams but do not anchor the update
    const tile = await TileDocument.load(ceramic, streamIds[0])
    await tile.update({ x: 100 }, null, { anchor: false })
    expect(runnningStates$[0].state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    await ceramic.close()

    // Create a new ceramic (with the same state directory) to check that resuming works,
    // even if everything is loaded from scratch
    const newCeramic = await createCeramic(ipfs, {
      stateStoreDirectory: stateStoreDirectoryName,
    })

    const newAnchoringService = newCeramic.repository.anchorService as InMemoryAnchorService

    runnningStates$.forEach((state$) => {
      // We call _process(...) here to mimic the behaviour of EthereumAnchorService which would start polling CAS for anchor statuses
      // All streams except one has only one commit. The stream with two commits has not requested an anchor for the 2nd commit. Therefore we
      // we only need to anchor the first commit of each stream.
      // @ts-ignore { cid: , streamID: } is not an instance of Candidate class (which shouldn't be exported, if necessary)
      void newAnchoringService._process({ cid: state$.state.log[0].cid, streamId: state$.id })
    })

    // Use the ceramic instance with anchorOnRequest === true to resume anchors
    const anchorResumingService = new AnchorResumingService(
      newCeramic.loggerProvider.getDiagnosticsLogger()
    )
    await anchorResumingService.resumeRunningStatesFromAnchorRequestStore(newCeramic.repository)

    const newRunnningStates$ = await Promise.all(
      streamIds.map((streamId) => {
        return newCeramic.repository.load(streamId, {
          sync: SyncOptions.NEVER_SYNC,
        })
      })
    )

    await TestUtils.waitForConditionOrTimeout(async () => {
      return newRunnningStates$.every((runningState$) => {
        return runningState$.value.anchorStatus === AnchorStatus.ANCHORED
      })
    }, 10000)

    // We check that the newRunningStates$ loaded from newCeramic are correctly updated, which means
    // that the anchor service needs to be polled for anchor statuses
    newRunnningStates$.forEach((runningState$) => {
      expect(runningState$.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    // Wait for async cleanup
    await TestUtils.waitForConditionOrTimeout(async () => {
      const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
      return remaining.length == 0
    })

    // There should be nothing left in the AnchorRequestStore at this point
    const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
    expect(remaining.length).toEqual(0)

    await newCeramic.close()
  })

  test('Cleans up entries from store for current anchored tip', async () => {
    const ceramic = await createCeramic(ipfs, {
      stateStoreDirectory: stateStoreDirectoryName,
    })

    const anchorRequestStore = ceramic.repository.anchorRequestStore
    const anchorService = ceramic.repository.anchorService as InMemoryAnchorService
    const publishAnchorSpy = jest.spyOn(anchorService, '_publishAnchorCommit')
    const pollForAnchorResponseSpy = jest.spyOn(anchorService, 'pollForAnchorResponse')
    // Prevent polling from finding the anchor commit for now.
    const anchorEvents$ = new Subject<AnchorEvent>()
    pollForAnchorResponseSpy.mockImplementation((streamId, tip) => {
      return anchorEvents$
    })
    // Collect the anchor events from the CAS so we can give them to Ceramic later
    const realAnchorEvents: Array<AnchorEvent> = []
    anchorService.events.subscribe((event) => realAnchorEvents.push(event))

    const stream = await TileDocument.create(ceramic, { foo: 'bar' })
    await anchorService.anchor()
    expect(publishAnchorSpy).toHaveBeenCalledTimes(1)

    // Make it as if the node heard about the anchor commit from pubsub before it does from polling.
    const anchorCID: CID = await publishAnchorSpy.mock.results[0].value
    await ceramic.repository.handleUpdateFromNetwork(stream.id, anchorCID)

    await stream.sync()
    expect(stream.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    // At this point the stream should still be in the anchor request store
    await expect(getPendingAnchorStreamIDs(anchorRequestStore)).resolves.toHaveLength(1)

    // Now let Ceramic hear about the real anchor events from the CAS
    realAnchorEvents.forEach((event) => anchorEvents$.next(event))

    // Wait for async cleanup
    await TestUtils.waitForConditionOrTimeout(async () => {
      const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
      return remaining.length == 0
    })

    // There should be nothing left in the AnchorRequestStore at this point
    const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
    expect(remaining.length).toEqual(0)

    await ceramic.close()
  })

  test('Cleans up entries from store for historical anchored tips', async () => {
    const ceramic = await createCeramic(ipfs, {
      stateStoreDirectory: stateStoreDirectoryName,
    })

    const stream = await TileDocument.create(ceramic, { step: 0 })
    await TestUtils.anchorUpdate(ceramic, stream)
    await stream.update({ step: 1 })
    await TestUtils.anchorUpdate(ceramic, stream)
    await stream.update({ step: 2 })
    await TestUtils.anchorUpdate(ceramic, stream)
    expect(stream.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    expect(stream.state.log).toHaveLength(6)

    // Wait for AnchorRequestStore to be cleared out
    await TestUtils.waitForConditionOrTimeout(async () => {
      const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
      return remaining.length == 0
    })

    // Now make it seem like there was a lingering entry in the AnchorRequestStore for a commit in
    // the middle of the log
    await ceramic.repository.anchorRequestStore.save(stream.id, {
      cid: stream.state.log[2].cid,
      timestamp: Date.now(),
      genesis: {} as GenesisCommit,
    })

    await expect(
      getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
    ).resolves.toHaveLength(1)

    // Resume polling for the entry we just added to the AnchorResumingService
    const anchorResumingService = new AnchorResumingService(
      ceramic.loggerProvider.getDiagnosticsLogger()
    )
    // Clear out the cache to ensure Ceramic needs to go to the StateStore to load the stream,
    // which is what triggers the resume logic for pending anchors.
    ceramic.repository.inmemory.delete(stream.id.toString())
    await anchorResumingService.resumeRunningStatesFromAnchorRequestStore(ceramic.repository)

    // The node should detect that the entry is already anchored and clean it up.
    await TestUtils.waitForConditionOrTimeout(async () => {
      const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
      return remaining.length == 0
    })

    await expect(
      getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
    ).resolves.toHaveLength(0)

    await ceramic.close()
  })
})
