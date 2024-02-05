import { beforeAll, jest } from '@jest/globals'
import { Dispatcher } from '../../dispatcher.js'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { createDispatcher } from '../../__tests__/create-dispatcher.js'
import {
  AnchorStatus,
  AppliableStreamLog,
  CommitData,
  EventType,
  IpfsApi,
  LogEntry,
  LoggerProvider,
} from '@ceramicnetwork/common'
import { Utils as CoreUtils } from '../../utils.js'
import { Ceramic } from '../../ceramic.js'
import { createCeramic } from '../../__tests__/create-ceramic.js'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { LogSyncer } from '../log-syncer.js'
import { StateManipulator } from '../state-manipulator.js'
import { HandlersMap } from '../../handlers-map.js'
import cloneDeep from 'lodash.clonedeep'
import { CID } from 'multiformats/cid'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'

const TOPIC = '/ceramic/test12345'
const CONTENT0 = { step: 0 }
const CONTENT1 = { step: 1 }
const CONTENT2 = { step: 2 }

function makeAppliable(log: Array<CommitData>): AppliableStreamLog {
  return { commits: log, timestampStatus: 'validated' }
}

// Should pass in v4 when test updated from tile document
const describeIfV3 = process.env.CERAMIC_RECON_MODE ? describe.skip : describe

describeIfV3('StateManipulator test', () => {
  jest.setTimeout(1000 * 30)

  let dispatcher: Dispatcher
  let dispatcherIpfs: IpfsApi
  let logSyncer: LogSyncer
  let stateManipulator: StateManipulator

  let doc: TileDocument
  let commits: Array<CommitData>

  let ceramicIpfs: IpfsApi
  let ceramic: Ceramic

  beforeAll(async () => {
    ceramicIpfs = await createIPFS()
    ceramic = await createCeramic(ceramicIpfs)

    dispatcherIpfs = await createIPFS()
    dispatcher = await createDispatcher(dispatcherIpfs, TOPIC)
    // speed up how quickly the dispatcher gives up on loading a non-existent commit from ipfs.
    dispatcher._ipfsTimeout = 1000

    const logger = new LoggerProvider().getDiagnosticsLogger()
    logSyncer = new LogSyncer(dispatcher)
    const handlers = new HandlersMap(logger)
    stateManipulator = new StateManipulator(logger, handlers, logSyncer, ceramic)

    await swarmConnect(dispatcherIpfs, ceramicIpfs)

    // Create a standard stream and log to use throughout tests.
    doc = await TileDocument.create(ceramic, CONTENT0)
    await CoreUtils.anchorUpdate(ceramic, doc)
    await doc.update(CONTENT1)
    await doc.update(CONTENT2)
    await CoreUtils.anchorUpdate(ceramic, doc)

    commits = (await logSyncer.syncFullLog(doc.id, doc.tip)).commits
  })

  afterAll(async () => {
    await dispatcher.close()
    await ceramic.close()

    // Wait for pubsub unsubscribe to be processed
    // TODO(1963): Remove this once dispatcher.close() won't resolve until the pubsub unsubscribe
    // has been processed
    await TestUtils.delay(5000)

    await dispatcherIpfs.stop()
    await ceramicIpfs.stop()
  })

  test('applyFullLog - normal case', async () => {
    const state0 = await stateManipulator.applyFullLog(
      doc.id.type,
      makeAppliable(commits.slice(0, 1)),
      { throwOnInvalidCommit: true }
    )
    expect(state0.log.length).toEqual(1)
    expect(state0.content).toEqual(CONTENT0)
    expect(state0.next).toBeUndefined()
    expect(state0.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    const state1 = await stateManipulator.applyFullLog(
      doc.id.type,
      makeAppliable(commits.slice(0, 2)),
      { throwOnInvalidCommit: true }
    )
    expect(state1.log.length).toEqual(2)
    expect(state1.content).toEqual(CONTENT0)
    expect(state1.next).toBeUndefined()
    expect(state1.anchorStatus).toEqual(AnchorStatus.ANCHORED)

    const state2 = await stateManipulator.applyFullLog(
      doc.id.type,
      makeAppliable(commits.slice(0, 3)),
      { throwOnInvalidCommit: true }
    )
    expect(state2.log.length).toEqual(3)
    expect(state2.content).toEqual(CONTENT0)
    expect(state2.next.content).toEqual(CONTENT1)
    expect(state2.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    const state3 = await stateManipulator.applyFullLog(
      doc.id.type,
      makeAppliable(commits.slice(0, 4)),
      { throwOnInvalidCommit: true }
    )
    expect(state3.log.length).toEqual(4)
    expect(state3.content).toEqual(CONTENT0)
    expect(state3.next.content).toEqual(CONTENT2)
    expect(state3.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    const state4 = await stateManipulator.applyFullLog(
      doc.id.type,
      makeAppliable(commits.slice(0, 5)),
      { throwOnInvalidCommit: true }
    )
    expect(state4.log.length).toEqual(5)
    expect(state4.content).toEqual(CONTENT2)
    expect(state4.next).toBeUndefined()
    expect(state4.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  })

  test('applyFullLog - invalid commit', async () => {
    const invalidCommit = cloneDeep(commits[3])
    invalidCommit.commit.prev = TestUtils.randomCID() // not a valid link to the stream log
    const logWithInvalidCommit = commits.slice(0, 3).concat([invalidCommit, commits[4]])

    // Will throw if 'throwOnInvalidCommit' is true
    await expect(
      stateManipulator.applyFullLog(doc.id.type, makeAppliable(logWithInvalidCommit), {
        throwOnInvalidCommit: true,
      })
    ).rejects.toThrow(/Commit doesn't properly point to previous commit in log/)

    // Will return what state it was able to successfully build if 'throwOnInvalidCommit' is false
    const state = await stateManipulator.applyFullLog(
      doc.id.type,
      makeAppliable(logWithInvalidCommit),
      {
        throwOnInvalidCommit: false,
      }
    )
    expect(state.log.length).toEqual(3)
    expect(state.content).toEqual(CONTENT0)
    expect(state.next.content).toEqual(CONTENT1)
    expect(state.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)
  })

  test('applyLogToState - clean apply to end of log', async () => {
    // Make genesis state
    const state0 = await stateManipulator.applyFullLog(
      doc.id.type,
      makeAppliable(commits.slice(0, 1)),
      { throwOnInvalidCommit: true }
    )

    // apply second and third commit
    const state2 = await stateManipulator.applyLogToState(
      state0,
      makeAppliable(commits.slice(1, 3)),
      { throwOnInvalidCommit: true, throwOnConflict: true, throwIfStale: true }
    )
    expect(state2.log.length).toEqual(3)
    expect(state2.content).toEqual(CONTENT0)
    expect(state2.next.content).toEqual(CONTENT1)
    expect(state2.anchorStatus).toEqual(AnchorStatus.NOT_REQUESTED)

    // apply rest of log
    const state4 = await stateManipulator.applyLogToState(state2, makeAppliable(commits.slice(3)), {
      throwOnInvalidCommit: true,
      throwOnConflict: true,
      throwIfStale: true,
    })
    expect(state4.log.length).toEqual(5)
    expect(state4.content).toEqual(CONTENT2)
    expect(state4.next).toBeUndefined()
    expect(state4.anchorStatus).toEqual(AnchorStatus.ANCHORED)
  })

  describe('conflict resolution', () => {
    let conflictingCommits: Array<CommitData>

    beforeAll(async () => {
      conflictingCommits = cloneDeep(commits.slice(3))
      conflictingCommits[0].commit.header.randomField = 'this changes the hash of the commit!'
      conflictingCommits[0].cid = await dispatcher.storeCommit(conflictingCommits[0].commit, 0)
      conflictingCommits[1].commit.prev = conflictingCommits[0].cid
      conflictingCommits[1].cid = await dispatcher.storeCommit(conflictingCommits[1].commit, 1)

      expect(conflictingCommits[0].cid.toString()).not.toEqual(commits[3].cid.toString())
      expect(conflictingCommits[1].cid.toString()).not.toEqual(commits[4].cid.toString())
    })

    afterEach(() => {
      // Reset any changes to timestamps made by the test
      const clearTimestamps = function (log: Array<CommitData>) {
        for (const commit of log) {
          commit.timestamp = undefined
        }
      }
      clearTimestamps(commits)
      clearTimestamps(conflictingCommits)
    })

    test('Conflicting history is valid', async () => {
      // this test is mostly a sanity check of the fixture setup, to ensure that the alternate log
      // history (which will be used more in subsequent tests) is appliable.
      const state = await stateManipulator.applyFullLog(
        doc.id.type,
        makeAppliable(commits.slice(0, 3).concat(conflictingCommits)),
        {
          throwOnInvalidCommit: true,
        }
      )

      expect(state.log.length).toEqual(5)
      expect(state.content).toEqual(CONTENT2)
      expect(state.log[0].cid.toString()).toEqual(commits[0].cid.toString())
      expect(state.log[1].cid.toString()).toEqual(commits[1].cid.toString())
      expect(state.log[2].cid.toString()).toEqual(commits[2].cid.toString())
      expect(state.log[3].cid.toString()).not.toEqual(commits[3].cid.toString())
      expect(state.log[4].cid.toString()).not.toEqual(commits[4].cid.toString())
      expect(state.log[3].cid.toString()).toEqual(conflictingCommits[0].cid.toString())
      expect(state.log[4].cid.toString()).toEqual(conflictingCommits[1].cid.toString())
    })

    test('throw if stale', async () => {
      const currentState = await stateManipulator.applyFullLog(
        doc.id.type,
        makeAppliable(commits),
        {
          throwOnInvalidCommit: true,
        }
      )

      // If the new long doesn't cleanly build on the old and 'throwIfStale' is true, we'll always
      // throw before even considering conflict resolution rules.
      await expect(
        stateManipulator.applyLogToState(currentState, makeAppliable(conflictingCommits), {
          throwOnInvalidCommit: true,
          throwIfStale: true,
          throwOnConflict: false,
        })
      ).rejects.toThrow(/rejected because it builds on stale state/)
    })

    test('current state wins conflict resolution', async () => {
      // Make current state be anchored earlier so it wins conflict resolution
      const now = new Date().getTime()
      const genesisTime = now - 10000
      const earlierAnchorTime = now - 5000
      const laterAnchorTime = now - 3000

      commits[0].timestamp = genesisTime
      commits[1].timestamp = genesisTime
      commits[2].timestamp = earlierAnchorTime
      commits[3].timestamp = earlierAnchorTime
      commits[4].timestamp = earlierAnchorTime

      conflictingCommits[0].timestamp = laterAnchorTime
      conflictingCommits[1].timestamp = laterAnchorTime

      const currentState = await stateManipulator.applyFullLog(
        doc.id.type,
        makeAppliable(commits),
        {
          throwOnInvalidCommit: true,
        }
      )

      const stateAfterApply = await stateManipulator.applyLogToState(
        currentState,
        makeAppliable(conflictingCommits),
        { throwOnInvalidCommit: true, throwIfStale: false, throwOnConflict: false }
      )
      // State should be unchanged since existing state was anchored first
      expect(stateAfterApply).toEqual(currentState)
    })

    test('new history wins conflict resolution', async () => {
      // Make remote log be anchored earlier so it wins conflict resolution
      const now = new Date().getTime()
      const genesisTime = now - 10000
      const earlierAnchorTime = now - 5000
      const laterAnchorTime = now - 3000

      commits[0].timestamp = genesisTime
      commits[1].timestamp = genesisTime
      commits[2].timestamp = laterAnchorTime
      commits[3].timestamp = laterAnchorTime
      commits[4].timestamp = laterAnchorTime

      conflictingCommits[0].timestamp = earlierAnchorTime
      conflictingCommits[1].timestamp = earlierAnchorTime

      const currentState = await stateManipulator.applyFullLog(
        doc.id.type,
        makeAppliable(commits),
        {
          throwOnInvalidCommit: true,
        }
      )

      const stateAfterApply = await stateManipulator.applyLogToState(
        currentState,
        makeAppliable(conflictingCommits),
        { throwOnInvalidCommit: true, throwIfStale: false, throwOnConflict: true }
      )

      // State should be updated since the new log was anchored first
      //expect(stateAfterApply).not.toEqual(currentState)
      expect(stateAfterApply.log[3].cid.toString()).toEqual(conflictingCommits[0].cid.toString())
      expect(stateAfterApply.log[4].cid.toString()).toEqual(conflictingCommits[1].cid.toString())
    })

    test('throwOnConflict', async () => {
      // If new history does not win conflict resolution, throw
      const now = new Date().getTime()
      const genesisTime = now - 10000
      const earlierAnchorTime = now - 5000
      const laterAnchorTime = now - 3000

      commits[0].timestamp = genesisTime
      commits[1].timestamp = genesisTime
      commits[2].timestamp = earlierAnchorTime
      commits[3].timestamp = earlierAnchorTime
      commits[4].timestamp = earlierAnchorTime

      conflictingCommits[0].timestamp = laterAnchorTime
      conflictingCommits[1].timestamp = laterAnchorTime

      const currentState = await stateManipulator.applyFullLog(
        doc.id.type,
        makeAppliable(commits),
        {
          throwOnInvalidCommit: true,
        }
      )

      await expect(
        stateManipulator.applyLogToState(currentState, makeAppliable(conflictingCommits), {
          throwOnInvalidCommit: true,
          throwIfStale: false,
          throwOnConflict: true,
        })
      ).rejects.toThrow(/rejected by conflict resolution/)
    })

    describe('pickLogToAccept', () => {
      // Targeted tests of the core conflict resolution logic.

      let cids: Array<CID>

      beforeAll(() => {
        cids = [
          TestUtils.randomCID(),
          TestUtils.randomCID(),
          TestUtils.randomCID(),
          TestUtils.randomCID(),
          TestUtils.randomCID(),
          TestUtils.randomCID(),
          TestUtils.randomCID(),
        ]
        cids.sort(function (cid1, cid2) {
          if (cid1.bytes < cid2.bytes) {
            return -1
          } else if (cid1.bytes > cid2.bytes) {
            return 1
          } else {
            return 0
          }
        })
      })

      test('Neither log is anchored, same log lengths', async () => {
        const log1: Array<LogEntry> = [
          { cid: cids[1], type: EventType.DATA },
          { cid: cids[2], type: EventType.DATA },
        ]
        const log2: Array<LogEntry> = [
          { cid: cids[4], type: EventType.DATA },
          { cid: cids[0], type: EventType.DATA },
        ]

        // When neither log is anchored and log lengths are the same we should pick the log whose last entry has the
        // smaller CID.
        expect(stateManipulator._pickLogToAccept(log1, log2)).toEqual(log2)
        expect(stateManipulator._pickLogToAccept(log2, log1)).toEqual(log2)
      })

      test('Neither log is anchored, different log lengths', async () => {
        const log1: Array<LogEntry> = [
          { cid: cids[1], type: EventType.DATA },
          { cid: cids[2], type: EventType.DATA },
          { cid: cids[3], type: EventType.DATA },
        ]
        const log2: Array<LogEntry> = [
          { cid: cids[4], type: EventType.DATA },
          { cid: cids[0], type: EventType.DATA },
        ]

        // When neither log is anchored and log lengths are different we should pick the log with
        // greater length
        expect(stateManipulator._pickLogToAccept(log1, log2)).toEqual(log1)
        expect(stateManipulator._pickLogToAccept(log2, log1)).toEqual(log1)
      })

      test('One log anchored before the other', async () => {
        const log1: Array<LogEntry> = [{ cid: cids[1], type: EventType.DATA }]
        const log2: Array<LogEntry> = [{ cid: cids[2], type: EventType.TIME }]

        // When only one of the logs has been anchored, we pick the anchored one
        expect(stateManipulator._pickLogToAccept(log1, log2)).toEqual(log2)
        expect(stateManipulator._pickLogToAccept(log2, log1)).toEqual(log2)
      })

      test('Both logs anchored in different blocks', async () => {
        const now = new Date().getTime()
        const earlierTime = now - 10000
        const laterTime = now - 5000
        const log1: Array<LogEntry> = [
          { cid: cids[0], type: EventType.DATA, timestamp: laterTime },
          { cid: cids[1], type: EventType.TIME, timestamp: laterTime },
        ]
        const log2: Array<LogEntry> = [
          { cid: cids[2], type: EventType.DATA, timestamp: earlierTime },
          { cid: cids[3], type: EventType.TIME, timestamp: earlierTime },
        ]

        // When both logs are anchored, take the one anchored in the earlier block.
        expect(stateManipulator._pickLogToAccept(log1, log2)).toEqual(log2)
        expect(stateManipulator._pickLogToAccept(log2, log1)).toEqual(log2)
      })

      test('Both logs anchored in same block blocks - different log lengths', async () => {
        const timestamp = new Date().getTime()
        const log1: Array<LogEntry> = [
          { cid: cids[1], type: EventType.DATA, timestamp },
          { cid: cids[2], type: EventType.DATA, timestamp },
          { cid: cids[3], type: EventType.TIME, timestamp },
        ]
        const log2: Array<LogEntry> = [
          { cid: cids[4], type: EventType.DATA, timestamp },
          { cid: cids[0], type: EventType.TIME, timestamp },
        ]

        // When anchored in the same block, and with different log lengths, we should choose the one
        // with longer log length
        expect(stateManipulator._pickLogToAccept(log1, log2)).toEqual(log1)
        expect(stateManipulator._pickLogToAccept(log2, log1)).toEqual(log1)
      })

      test('Both logs anchored in same block blocks - different log lengths - multiple anchors', async () => {
        const now = new Date().getTime()
        const earlierTime = now - 10000
        const laterTime = now - 5000
        const log1: Array<LogEntry> = [
          { cid: cids[1], type: EventType.DATA, timestamp: earlierTime },
          { cid: cids[2], type: EventType.DATA, timestamp: earlierTime },
          { cid: cids[3], type: EventType.TIME, timestamp: earlierTime },
        ]
        const log2: Array<LogEntry> = [
          { cid: cids[4], type: EventType.DATA, timestamp: earlierTime },
          { cid: cids[0], type: EventType.TIME, timestamp: earlierTime },
          { cid: cids[5], type: EventType.DATA, timestamp: laterTime },
          { cid: cids[6], type: EventType.TIME, timestamp: laterTime },
        ]

        // When first anchor is in the same block, break tie only with log length until first anchor,
        // log length after the first anchor is irrelevant.
        expect(stateManipulator._pickLogToAccept(log1, log2)).toEqual(log1)
        expect(stateManipulator._pickLogToAccept(log2, log1)).toEqual(log1)
      })

      test('Both logs anchored in the same block with the same log lengths', async () => {
        const timestamp = new Date().getTime()
        const log1: Array<LogEntry> = [
          { cid: cids[1], type: EventType.DATA, timestamp },
          { cid: cids[2], type: EventType.TIME, timestamp },
        ]
        const log2: Array<LogEntry> = [
          { cid: cids[4], type: EventType.DATA, timestamp },
          { cid: cids[0], type: EventType.TIME, timestamp },
        ]

        // When anchored in the same block, and with same log lengths, we should use
        // the fallback mechanism of picking the log whose last entry has the smaller CID
        expect(stateManipulator._pickLogToAccept(log1, log2)).toEqual(log2)
        expect(stateManipulator._pickLogToAccept(log2, log1)).toEqual(log2)
      })
    })
  })
})
