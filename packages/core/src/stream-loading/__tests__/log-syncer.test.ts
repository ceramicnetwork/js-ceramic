import { jest } from '@jest/globals'
import { Dispatcher } from '../../dispatcher.js'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { createDispatcher } from '../../__tests__/create-dispatcher.js'
import { IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { Ceramic } from '../../ceramic.js'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { CID } from 'multiformats/cid'
import { LogSyncer } from '../log-syncer.js'
import { StreamID } from '@ceramicnetwork/streamid'

const TOPIC = '/ceramic/test12345'

describe('LogSyncer test', () => {
  jest.setTimeout(1000 * 30)

  let dispatcher: Dispatcher
  let ipfsClient: IpfsApi
  let logSyncer: LogSyncer

  let ceramicIpfs: IpfsApi
  let ceramic: Ceramic

  let commits: Array<CID>
  let streamID: StreamID
  let tipForDifferentStream: CID

  beforeAll(async () => {
    ipfsClient = await createIPFS()
    dispatcher = await createDispatcher(ipfsClient, TOPIC)
    // speed up how quickly the dispatcher gives up on loading a non-existent commit from ipfs.
    dispatcher._ipfsTimeout = 1000
    logSyncer = new LogSyncer(dispatcher)

    ceramicIpfs = await createIPFS()
    ceramic = await createCeramic(ceramicIpfs)

    await swarmConnect(ipfsClient, ceramicIpfs)

    const stream = await TileDocument.create(ceramic, { step: 0 }, null, { anchor: false })
    await stream.update({ step: 1 })
    await TestUtils.hasAcceptedAnchorRequest(ceramic, stream.tip)
    await TestUtils.anchorUpdate(ceramic, stream)
    await stream.update({ step: 2 })
    await TestUtils.hasAcceptedAnchorRequest(ceramic, stream.tip)
    await TestUtils.anchorUpdate(ceramic, stream)

    commits = stream.state.log.map((logEntry) => logEntry.cid)
    expect(commits.length).toEqual(5)
    streamID = stream.id

    const otherStream = await TileDocument.create(ceramic, { step: 0 }, null, { anchor: false })
    await otherStream.update({ step: 1 }, null, { anchor: false })
    tipForDifferentStream = otherStream.tip
  })

  afterAll(async () => {
    await dispatcher.close()
    await ceramic.close()

    // Wait for pubsub unsubscribe to be processed
    // TODO(1963): Remove this once dispatcher.close() won't resolve until the pubsub unsubscribe
    // has been processed
    await TestUtils.delay(5000)

    await ipfsClient.stop()
    await ceramicIpfs.stop()
  })

  test('sync genesis', async () => {
    const log = await logSyncer.syncFullLog(streamID, null)
    expect(log.commits.length).toEqual(1)
    expect(log.commits[0].cid).toEqual(commits[0])
  })

  test('sync full log', async () => {
    const log0 = await logSyncer.syncFullLog(streamID, commits[0])
    expect(log0.commits.length).toEqual(1)
    expect(log0.commits[0].cid).toEqual(commits[0])

    const log1 = await logSyncer.syncFullLog(streamID, commits[1])
    expect(log1.commits.length).toEqual(2)
    expect(log1.commits[0].cid).toEqual(commits[0])
    expect(log1.commits[1].cid).toEqual(commits[1])

    const log2 = await logSyncer.syncFullLog(streamID, commits[2])
    expect(log2.commits.length).toEqual(3)
    expect(log2.commits[0].cid).toEqual(commits[0])
    expect(log2.commits[1].cid).toEqual(commits[1])
    expect(log2.commits[2].cid).toEqual(commits[2])

    const log3 = await logSyncer.syncFullLog(streamID, commits[3])
    expect(log3.commits.length).toEqual(4)
    expect(log3.commits[0].cid).toEqual(commits[0])
    expect(log3.commits[1].cid).toEqual(commits[1])
    expect(log3.commits[2].cid).toEqual(commits[2])
    expect(log3.commits[3].cid).toEqual(commits[3])

    const log4 = await logSyncer.syncFullLog(streamID, commits[4])
    expect(log4.commits.length).toEqual(5)
    expect(log4.commits[0].cid).toEqual(commits[0])
    expect(log4.commits[1].cid).toEqual(commits[1])
    expect(log4.commits[2].cid).toEqual(commits[2])
    expect(log4.commits[3].cid).toEqual(commits[3])
    expect(log4.commits[4].cid).toEqual(commits[4])
  })

  test('sync full log - tip for different stream', async () => {
    const log = await logSyncer.syncFullLog(streamID, tipForDifferentStream)

    // should just get the genesis commit.
    expect(log.commits.length).toEqual(1)
    expect(log.commits[0].cid).toEqual(commits[0])
  })

  test('sync full log - invalid tip', async () => {
    const invalidCommitCID = await dispatcher.storeRecord({ hello: 'world' })

    const log = await logSyncer.syncFullLog(streamID, invalidCommitCID)

    // should just get the genesis commit.
    expect(log.commits.length).toEqual(1)
    expect(log.commits[0].cid).toEqual(commits[0])
  })

  test('sync full log - unloadable tip', async () => {
    const unloadableTip = TestUtils.randomCID()
    // TODO(CDB-2732): This shouldn't throw but should instead just return the genesis commit
    await expect(logSyncer.syncFullLog(streamID, unloadableTip)).rejects.toThrow(
      /deadline exceeded/
    )
  })

  test('sync until match', async () => {
    // sync all commits after the genesis
    const log0 = await logSyncer.syncLogUntilMatch(streamID, commits[4], commits.slice(0, 1))
    expect(log0.commits.length).toEqual(4)
    expect(log0.commits[0].cid).toEqual(commits[1])
    expect(log0.commits[1].cid).toEqual(commits[2])
    expect(log0.commits[2].cid).toEqual(commits[3])
    expect(log0.commits[3].cid).toEqual(commits[4])

    // sync all commits after the 2nd commit
    const log1 = await logSyncer.syncLogUntilMatch(streamID, commits[4], commits.slice(0, 2))
    expect(log1.commits.length).toEqual(3)
    expect(log1.commits[0].cid).toEqual(commits[2])
    expect(log1.commits[1].cid).toEqual(commits[3])
    expect(log1.commits[2].cid).toEqual(commits[4])

    // sync only the newest commit
    const log2 = await logSyncer.syncLogUntilMatch(streamID, commits[4], commits.slice(0, 4))
    expect(log2.commits.length).toEqual(1)
    expect(log2.commits[0].cid).toEqual(commits[4])

    // sync 1 commit after the genesis
    const log3 = await logSyncer.syncLogUntilMatch(streamID, commits[1], commits.slice(0, 1))
    expect(log3.commits.length).toEqual(1)
    expect(log3.commits[0].cid).toEqual(commits[1])

    // sync 2 commits after the genesis
    const log4 = await logSyncer.syncLogUntilMatch(streamID, commits[2], commits.slice(0, 1))
    expect(log4.commits.length).toEqual(2)
    expect(log4.commits[0].cid).toEqual(commits[1])
    expect(log4.commits[1].cid).toEqual(commits[2])

    // sync 2 commits after the 2nd commit
    const log5 = await logSyncer.syncLogUntilMatch(streamID, commits[3], commits.slice(0, 2))
    expect(log5.commits.length).toEqual(2)
    expect(log5.commits[0].cid).toEqual(commits[2])
    expect(log5.commits[1].cid).toEqual(commits[3])
  })

  test('sync until match - divergent history', async () => {
    const alternateHistoryCommits = [
      commits[0],
      commits[1],
      TestUtils.randomCID(),
      TestUtils.randomCID(),
    ]

    // sync all commits after the divergence point
    const log0 = await logSyncer.syncLogUntilMatch(streamID, commits[4], alternateHistoryCommits)
    expect(log0.commits.length).toEqual(3)
    expect(log0.commits[0].cid).toEqual(commits[2])
    expect(log0.commits[1].cid).toEqual(commits[3])
    expect(log0.commits[2].cid).toEqual(commits[4])
  })

  test('sync until match - tip for wrong stream', async () => {
    // sync all commits after the divergence point
    const log = await logSyncer.syncLogUntilMatch(streamID, tipForDifferentStream, commits)

    // No new commits to apply
    expect(log.commits.length).toEqual(0)
  })

  test('sync until match - invalid tip', async () => {
    const invalidCommitCID = await dispatcher.storeRecord({ hello: 'world' })

    const log = await logSyncer.syncLogUntilMatch(streamID, invalidCommitCID, commits)

    // No new commits to apply
    expect(log.commits.length).toEqual(0)
  })

  test('sync until match - unloadable tip', async () => {
    const unloadableTip = TestUtils.randomCID()
    // TODO(CDB-2732): This shouldn't throw but should instead just return an empty list
    await expect(logSyncer.syncLogUntilMatch(streamID, unloadableTip, commits)).rejects.toThrow(
      /deadline exceeded/
    )
  })
})
