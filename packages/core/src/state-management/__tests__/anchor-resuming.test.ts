import { expect, jest } from '@jest/globals'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { AnchorStatus, GenesisCommit, IpfsApi, SyncOptions } from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '@ceramicnetwork/core'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import tmp from 'tmp-promise'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import all from 'it-all'
import { AnchorRequestStore } from '../../store/anchor-request-store.js'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

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

jest.setTimeout(10000)

let ipfs: IpfsApi
let stateStoreDirectoryName: string

// Should  pass on v4 if updated from TileDocument
const testIfV3 = process.env.CERAMIC_ENABLE_V4_MODE ? test.skip : test

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

testIfV3('resume anchors from AnchorRequestStore', async () => {
  const numberOfStreams = 3

  const ceramic = await createCeramic(ipfs, {
    stateStoreDirectory: stateStoreDirectoryName,
    enableAnchorPollingLoop: false,
  })

  const streamIds = await Promise.all(
    Array.from({ length: numberOfStreams }).map(async (_, index) => {
      const tile = await TileDocument.create(ceramic, { x: index }, null, {
        anchor: true,
      })
      return tile.id
    })
  )

  const loaded = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
  // LevelDB Store stores keys ordered lexicographically
  expect(streamIds.map((streamId) => streamId.toString()).sort()).toEqual(loaded)

  const runningStates$ = await Promise.all(
    streamIds.map((streamId) => {
      return ceramic.repository.load(streamId, {
        sync: SyncOptions.NEVER_SYNC,
      })
    })
  )

  for (const state$ of runningStates$) {
    expect(state$.state.anchorStatus).toEqual(AnchorStatus.PENDING)
  }

  // update one of the streams but do not anchor the update
  const tile = await TileDocument.load(ceramic, streamIds[0])
  await tile.update({ x: 100 }, null, { anchor: false })
  expect(runningStates$[0].state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

  await ceramic.close()

  // Create a new ceramic (with the same state directory) to check that resuming works,
  // even if everything is loaded from scratch
  const newCeramic = await createCeramic(ipfs, {
    stateStoreDirectory: stateStoreDirectoryName,
    anchorOnRequest: true,
  })

  const newRunningStates$ = await Promise.all(
    streamIds.map((streamId) => {
      return newCeramic.repository.load(streamId, {
        sync: SyncOptions.NEVER_SYNC,
      })
    })
  )

  await TestUtils.waitForConditionOrTimeout(async () => {
    return newRunningStates$.every((runningState$) => {
      return runningState$.value.anchorStatus === AnchorStatus.ANCHORED
    })
  }, 10000)

  newRunningStates$.forEach((state$) =>
    expect(state$.value.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  )

  // Wait for async cleanup
  await TestUtils.waitForConditionOrTimeout(async () => {
    const remaining = await getPendingAnchorStreamIDs(newCeramic.repository.anchorRequestStore)
    return remaining.length == 0
  })

  // There should be nothing left in the AnchorRequestStore at this point
  await expect(
    getPendingAnchorStreamIDs(newCeramic.repository.anchorRequestStore)
  ).resolves.toHaveLength(0)

  await newCeramic.close()
})

testIfV3('Cleans up entries from store for already anchored tips', async () => {
  const ceramic = await createCeramic(ipfs, {
    stateStoreDirectory: stateStoreDirectoryName,
  })

  const stream = await TileDocument.create(ceramic, { step: 0 })
  await CoreUtils.anchorUpdate(ceramic, stream)
  await stream.update({ step: 1 })
  await CoreUtils.anchorUpdate(ceramic, stream)
  await stream.update({ step: 2 })
  await CoreUtils.anchorUpdate(ceramic, stream)
  expect(stream.state.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  expect(stream.state.log).toHaveLength(6)

  // Wait for AnchorRequestStore to be cleared out
  await TestUtils.waitForConditionOrTimeout(async () => {
    const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
    return remaining.length == 0
  })
  await expect(
    getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
  ).resolves.toHaveLength(0)

  const removeFromStoreSpy = jest.spyOn(ceramic.repository.anchorRequestStore, 'remove')
  // Make removing from the store a no-op temporarily
  removeFromStoreSpy.mockImplementation(() => Promise.resolve())

  // Now make it seem like the node got the anchor commit via pubsub before getting it via polling
  // and so the request is still in the AnchorRequestStore despite already being the currently
  // anchored tip.
  await ceramic.repository.anchorRequestStore.save(stream.id, {
    cid: stream.state.log[4].cid,
    timestamp: Date.now(),
    genesis: {} as GenesisCommit,
  })
  await expect(
    getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
  ).resolves.toHaveLength(1)

  // Now allow removes from the store to go through again.
  removeFromStoreSpy.mockRestore()

  // The node should detect that the entry is already anchored and clean it up.
  await TestUtils.waitForConditionOrTimeout(async () => {
    const remaining = await getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
    return remaining.length == 0
  })

  await expect(
    getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
  ).resolves.toHaveLength(0)

  // Now repeat the same test but this time make it so the AnchorRequestStore has a request for
  // a CID in the middle of the stream log
  removeFromStoreSpy.mockImplementation(() => Promise.resolve())
  await ceramic.repository.anchorRequestStore.save(stream.id, {
    cid: stream.state.log[2].cid,
    timestamp: Date.now(),
    genesis: {} as GenesisCommit,
  })
  await expect(
    getPendingAnchorStreamIDs(ceramic.repository.anchorRequestStore)
  ).resolves.toHaveLength(1)

  // Allow removes from the store to go through again.
  removeFromStoreSpy.mockRestore()

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
