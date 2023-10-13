import { expect, jest } from '@jest/globals'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { AnchorStatus, IpfsApi, SyncOptions, TestUtils } from '@ceramicnetwork/common'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import tmp from 'tmp-promise'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import all from 'it-all'

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

test('resume anchors from AnchorRequestStore', async () => {
  const numberOfStreams = 3

  const ceramic = await createCeramic(ipfs, {
    stateStoreDirectory: stateStoreDirectoryName,
    enableLoop: false,
  })

  const streamIds = await Promise.all(
    Array.from({ length: numberOfStreams }).map(async (_, index) => {
      const tile = await TileDocument.create(ceramic, { x: index }, null, {
        anchor: true,
      })
      return tile.id
    })
  )

  const loaded = (await all(ceramic.repository.anchorRequestStore.list()))
    .reduce((acc, array) => acc.concat(array), [])
    .map((result) => result.key.toString())
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

  await newCeramic.close()
})
