import { Dispatcher } from '../dispatcher'
import CID from 'cids'
import StreamID from '@ceramicnetwork/streamid'
import { CommitType, StreamState, LoggerProvider, IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { serialize, MsgType } from '../pubsub/pubsub-message'
import { Repository, RepositoryDependencies } from '../state-management/repository'
import { delay } from './delay'
import tmp from 'tmp-promise'
import { LevelStateStore } from '../store/level-state-store'
import { PinStore } from '../store/pin-store'
import { RunningState } from '../state-management/running-state'
import { StateManager } from '../state-management/state-manager'
import cloneDeep from 'lodash.clonedeep'
import { createIPFS } from './ipfs-util'
import IpfsHttpClient from 'ipfs-http-client'
import HttpApi from 'ipfs-http-server'
import getPort from 'get-port'

const TOPIC = '/ceramic'
const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_CID2 = new CID('bafybeig6xv5nwphfmvcnektpnojts44jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)

const mock_ipfs = {
  pubsub: {
    ls: jest.fn(async () => Promise.resolve([])),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(async () => Promise.resolve()),
    publish: jest.fn(),
  },
  dag: {
    put: jest.fn(),
    get: jest.fn(),
  },
  block: {
    stat: jest.fn(() => ({ size: 10 })),
  },
  id: async () => ({ id: 'ipfsid' }),
}

describe('Dispatcher with mock ipfs', () => {
  let dispatcher: Dispatcher
  let repository: Repository
  const loggerProvider = new LoggerProvider()
  const ipfs = mock_ipfs

  beforeEach(async () => {
    ipfs.dag.put.mockClear()
    ipfs.dag.get.mockClear()
    ipfs.pubsub.subscribe.mockClear()
    ipfs.pubsub.unsubscribe.mockClear()
    ipfs.pubsub.publish.mockClear()

    const levelPath = await tmp.tmpName()
    console.log(`starting level state store at path ${levelPath.toString()}`)
    const stateStore = new LevelStateStore(levelPath)
    stateStore.open('test')
    repository = new Repository(100, 100, loggerProvider.getDiagnosticsLogger())
    const pinStore = {
      stateStore,
    } as unknown as PinStore
    repository.setDeps({ pinStore } as unknown as RepositoryDependencies)
    dispatcher = new Dispatcher(
      ipfs,
      TOPIC,
      repository,
      loggerProvider.getDiagnosticsLogger(),
      loggerProvider.makeServiceLogger('pubsub')
    )
  })

  afterEach(async () => {
    await dispatcher.close()
  })

  it('is constructed correctly', async () => {
    expect((dispatcher as any).repository).toBeInstanceOf(Repository)
    await delay(100) // Wait for plumbing
    expect(ipfs.pubsub.subscribe).toHaveBeenCalledWith(TOPIC, expect.anything(), {
      onError: expect.anything(),
    })
  })

  it('closes correctly', async () => {
    await dispatcher.close()
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledTimes(1)
    expect(ipfs.pubsub.unsubscribe).toHaveBeenCalledWith(TOPIC, expect.anything())
  })

  it('store commit correctly', async () => {
    ipfs.dag.put.mockReturnValueOnce(FAKE_CID)
    expect(await dispatcher.storeCommit('data')).toEqual(FAKE_CID)

    expect(ipfs.dag.put.mock.calls.length).toEqual(1)
    expect(ipfs.dag.put.mock.calls[0][0]).toEqual('data')
  })

  it('retrieves commit correctly', async () => {
    ipfs.dag.get.mockReturnValueOnce({ value: 'data' })
    expect(await dispatcher.retrieveCommit(FAKE_CID)).toEqual('data')

    expect(ipfs.dag.get.mock.calls.length).toEqual(1)
    expect(ipfs.dag.get.mock.calls[0][0]).toEqual(FAKE_CID)
  })

  it('retries on timeout', async () => {
    ipfs.dag.get.mockRejectedValueOnce({ code: 'ERR_TIMEOUT' })
    ipfs.dag.get.mockReturnValueOnce({ value: 'data' })
    expect(await dispatcher.retrieveCommit(FAKE_CID)).toEqual('data')

    expect(ipfs.dag.get.mock.calls.length).toEqual(2)
    expect(ipfs.dag.get.mock.calls[0][0]).toEqual(FAKE_CID)
    expect(ipfs.dag.get.mock.calls[1][0]).toEqual(FAKE_CID)
  })

  it('caches and retrieves commit correctly', async () => {
    const ipfsSpy = ipfs.dag.get
    ipfsSpy.mockReturnValueOnce({ value: 'data' })
    expect(await dispatcher.retrieveCommit(FAKE_CID)).toEqual('data')
    // Commit not found in cache so IPFS lookup performed and cache updated
    expect(ipfsSpy).toBeCalledTimes(1)
    expect(await dispatcher.retrieveCommit(FAKE_CID)).toEqual('data')
    // Commit found in cache so IPFS lookup skipped (IPFS lookup count unchanged)
    expect(ipfsSpy).toBeCalledTimes(1)
    expect(await dispatcher.retrieveCommit(cloneDeep(FAKE_CID))).toEqual('data')
    // Commit found in cache with different instance of same CID (IPFS lookup count unchanged)
    expect(ipfsSpy).toBeCalledTimes(1)
    expect(ipfsSpy.mock.calls[0][0]).toEqual(FAKE_CID)
  })

  it('caches and retrieves with path correctly', async () => {
    const ipfsSpy = ipfs.dag.get
    ipfsSpy.mockImplementation(function (cid, opts) {
      if (opts.path == '/foo') {
        return { value: 'foo' }
      } else if (opts.path == '/bar') {
        return { value: 'bar' }
      } else {
        return null
      }
    })

    expect(await dispatcher.retrieveFromIPFS(FAKE_CID, '/foo')).toEqual('foo')
    // CID+path not found in cache so IPFS lookup performed and cache updated
    expect(ipfsSpy).toBeCalledTimes(1)
    expect(await dispatcher.retrieveFromIPFS(FAKE_CID, '/foo')).toEqual('foo')
    // CID+path found in cache so IPFS lookup skipped (IPFS lookup count unchanged)
    expect(ipfsSpy).toBeCalledTimes(1)

    expect(await dispatcher.retrieveFromIPFS(FAKE_CID, '/bar')).toEqual('bar')
    // Same CID with different path needs to skip cache and go to IPFS
    expect(ipfsSpy).toBeCalledTimes(2)

    expect(ipfsSpy.mock.calls[0][0]).toEqual(FAKE_CID)
    expect(ipfsSpy.mock.calls[0][1].path).toEqual('/foo')
    expect(ipfsSpy.mock.calls[1][0]).toEqual(FAKE_CID)
    expect(ipfsSpy.mock.calls[1][1].path).toEqual('/bar')
  })

  it('publishes tip correctly', async () => {
    const tip = new CID('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
    // Test if subscription ends. It always will, but better be on the safe side.
    await new Promise<void>((resolve) => {
      const subscription = dispatcher.publishTip(FAKE_STREAM_ID, tip)
      subscription.add(() => {
        // Could be delay, but this is faster
        resolve()
      })
    })
    expect(ipfs.pubsub.publish).toHaveBeenCalledWith(
      TOPIC,
      serialize({ typ: MsgType.UPDATE, stream: FAKE_STREAM_ID, tip: tip })
    )
  })

  it('errors on invalid message type', async () => {
    const message = {
      typ: -1,
      id: '/ceramic/bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova',
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await expect(dispatcher.handleMessage(message)).rejects.toThrow(/Unsupported message type/)
  })

  it('handle message correctly', async () => {
    dispatcher.repository.stateManager = {} as unknown as StateManager

    async function register(state: StreamState) {
      const runningState = new RunningState(state, false)
      repository.add(runningState)
      dispatcher.messageBus.queryNetwork(runningState.id).subscribe()
      return runningState
    }

    const initialState = {
      type: 0,
      log: [
        {
          cid: FAKE_STREAM_ID.cid,
          type: CommitType.GENESIS,
        },
      ],
    } as unknown as StreamState
    const state$ = await register(initialState)

    // Store the query ID sent when the stream is registered so we can use it as the response ID later
    const publishArgs = ipfs.pubsub.publish.mock.calls[0]
    expect(publishArgs[0]).toEqual(TOPIC)
    const queryMessageSent = JSON.parse(new TextDecoder().decode(publishArgs[1]))
    const queryID = queryMessageSent.id

    // Handle UPDATE message
    dispatcher.repository.stateManager.update = jest.fn()
    await dispatcher.handleMessage({ typ: MsgType.UPDATE, stream: FAKE_STREAM_ID, tip: FAKE_CID })
    expect(dispatcher.repository.stateManager.update).toBeCalledWith(state$.id, FAKE_CID)

    const continuationState = {
      ...initialState,
      log: initialState.log.concat({
        cid: FAKE_CID,
        type: CommitType.SIGNED,
      }),
    } as unknown as StreamState
    const stream2 = await register(continuationState)
    await dispatcher.handleMessage({ typ: MsgType.QUERY, stream: FAKE_STREAM_ID, id: '1' })
    expect(ipfs.pubsub.publish).lastCalledWith(
      TOPIC,
      serialize({
        typ: MsgType.RESPONSE,
        id: '1',
        tips: new Map().set(FAKE_STREAM_ID.toString(), FAKE_CID),
      })
    )

    // Handle RESPONSE message
    const tips = new Map().set(FAKE_STREAM_ID.toString(), FAKE_CID2)
    await dispatcher.handleMessage({ typ: MsgType.RESPONSE, id: queryID, tips: tips })
    expect(dispatcher.repository.stateManager.update).toBeCalledWith(stream2.id, FAKE_CID2)
  })
})
