import { jest } from '@jest/globals'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { InMemoryAnchorService } from '../../anchor/memory/in-memory-anchor-service.js'
import { Observable } from 'rxjs'
import {
  AnchorServiceResponse,
  AnchorStatus,
  IpfsApi,
  SyncOptions,
  TestUtils,
} from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import tmp from 'tmp-promise'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { AnchorResumingService } from '../anchor-resuming-service.js'

describe('resumeRunningStatesFromAnchorRequestStore(...) method', () => {
  jest.setTimeout(10000)

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

  test('Requests anchors for streams with stored anchor requests', async () => {
    const ceramic = await createCeramic(ipfs, {
      anchorOnRequest: false,
      stateStoreDirectory: stateStoreDirectoryName,
    })

    const anchorService = ceramic.repository.stateManager.anchorService as InMemoryAnchorService
    const realRequestAnchor = anchorService.requestAnchor
    const mockedRequestAnchor = jest.fn()
    mockedRequestAnchor.mockImplementation(() => {
      return new Observable<AnchorServiceResponse>()
    })
    // @ts-ignore
    anchorService.requestAnchor = mockedRequestAnchor

    const stream = await TileDocument.create(ceramic, { x: 1 }, null, {
      anchor: true,
    })

    // Verify that the anchor was not requested (because we used the mocked anchorRequest(...) which does nothing)
    expect(mockedRequestAnchor).toHaveBeenCalledTimes(1)
    expect(stream.state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    // Verify that the anchor request was stored
    const storedAnchorRequests = await ceramic.repository.anchorRequestStore.list()
    expect(storedAnchorRequests.length).toEqual(1)
    expect(storedAnchorRequests[0].key).toEqual(stream.id)

    // Set requestAnchor back to the proper implementation and resume anchors
    anchorService.requestAnchor = realRequestAnchor
    const anchorResumingService = new AnchorResumingService(
      ceramic.loggerProvider.getDiagnosticsLogger()
    )
    await anchorResumingService.resumeRunningStatesFromAnchorRequestStore(ceramic.repository)

    // Give the anchor service some time to work, sync the stream and check that the anchor had been requested
    await TestUtils.delay(3000) // TODO(CDB-2090): use less brittle approach to waiting for this condition
    await stream.sync()
    expect(stream.state.anchorStatus).toEqual(AnchorStatus.PENDING)

    await ceramic.close()
  })

  test('Anchors streams from anchor request store', async () => {
    const numberOfStreams = 3

    const ceramic = await createCeramic(ipfs, {
      stateStoreDirectory: stateStoreDirectoryName,
    })

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

    const loaded = (await ceramic.repository.anchorRequestStore.list()).map((result) =>
      result.key.toString()
    )
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
      expect(runningState$.state.anchorStatus).toEqual(AnchorStatus.PENDING)
    })

    await ceramic.close()

    // Create a new ceramic (with the same state directory) to check that resuming works,
    // even if everything is loaded from scratch
    const newCeramic = await createCeramic(ipfs, {
      stateStoreDirectory: stateStoreDirectoryName,
    })

    const newAnchoringService = newCeramic.repository.stateManager
      .anchorService as InMemoryAnchorService

    runnningStates$.forEach((state$) => {
      // We call _process(...) here to mimic the behaviour of the real CAS which would send us ANCHORED status, if polled
      // @ts-ignore { cid: , streamID: } is not an instance of Candidate class (which shouldn't be exported, if necessary)
      newAnchoringService._process({ cid: state$.tip, streamId: state$.id })
    })

    // Use the ceramic instance with anchorOnRequest === true to resume anchors
    const anchorResumingService = new AnchorResumingService(
      newCeramic.loggerProvider.getDiagnosticsLogger()
    )
    await anchorResumingService.resumeRunningStatesFromAnchorRequestStore(newCeramic.repository)

    // Wait for anchor requests to be processed
    await TestUtils.delay(6000) // TODO(CDB-2090): use less brittle approach to waiting for this condition

    const newRunnningStates$ = await Promise.all(
      streamIds.map((streamId) => {
        return newCeramic.repository.load(streamId, {
          sync: SyncOptions.NEVER_SYNC,
        })
      })
    )

    // We check that the newRunningStates$ loaded from newCeramic are correctly updated, which means
    // that the anchor service needs to be polled for anchor statuses
    newRunnningStates$.forEach((runningState$) => {
      expect(runningState$.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
    })

    await newCeramic.close()
  })
})
