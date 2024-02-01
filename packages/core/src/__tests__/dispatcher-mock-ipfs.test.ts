import { expect, jest, it, test, describe, beforeEach, afterEach } from '@jest/globals'
import { Dispatcher } from '../dispatcher.js'
import { CID } from 'multiformats/cid'
import { StreamID } from '@ceramicnetwork/streamid'
import { EventType, StreamState, IpfsApi } from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { serialize, MsgType } from '../pubsub/pubsub-message.js'
import { Repository } from '../state-management/repository.js'
import { RunningState } from '../state-management/running-state.js'
import { CARFactory } from 'cartonne'
import * as dagJoseCodec from 'dag-jose'
import * as dagCborCodec from '@ipld/dag-cbor'
import { createDispatcher } from './create-dispatcher.js'

const TOPIC = '/ceramic'
const FAKE_CID = CID.parse('bafyreihbje3f5oj6vlszlqmnrtrsmuukrjurpsv6uus4siwgikldp6wnty')
const FAKE_CID2 = CID.parse('bafyreidv7jh7yoa4kktoxeit4q3eppywiarlivhg5xmjhb6heul7242bwm')
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)
const FAKE_MODEL: StreamID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexpxyz'
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
    resolve: jest.fn(async (cid: CID, opts: any) => {
      return { cid: cid }
    }),
    import: jest.fn(() => {
      return []
    }),
  },
  block: {
    stat: jest.fn(async () => ({ size: 10 })),
    get: jest.fn(),
  },
  id: async () => ({ id: 'ipfsid' }),
  codecs: {
    listCodecs: () => [dagJoseCodec, dagCborCodec],
    getCodec: (codename: string | number) =>
      [dagJoseCodec, dagCborCodec].find(
        (codec) => codec.code === codename || codec.name === codename
      ),
  },
  version: () => Promise.resolve({ version: '0.0.0-fake' }),
}

const carFactory = new CARFactory()

describe('Dispatcher with mock ipfs', () => {
  let dispatcher: Dispatcher
  let repository: Repository
  const ipfs = mock_ipfs

  beforeEach(async () => {
    ipfs.dag.put.mockClear()
    ipfs.dag.get.mockClear()
    ipfs.pubsub.subscribe.mockClear()
    ipfs.pubsub.unsubscribe.mockClear()
    ipfs.pubsub.publish.mockClear()

    dispatcher = await createDispatcher(ipfs as unknown as IpfsApi, TOPIC)
    repository = dispatcher.repository
  })

  afterEach(async () => {
    await dispatcher.close()
    jest.clearAllMocks()
  })

  it('is constructed correctly', async () => {
    expect((dispatcher as any).repository).toBeInstanceOf(Repository)
    await TestUtils.delay(100) // Wait for plumbing
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
    const carFile = carFactory.build()
    const expectedCID = carFile.put('data', { isRoot: true })
    expect(await dispatcher.storeCommit('data')).toEqual(expectedCID)

    expect(ipfs.dag.import.mock.calls.length).toEqual(1)
    expect(ipfs.dag.import.mock.calls[0][0]).toEqual(carFile)
  })

  it('retrieves commit correctly', async () => {
    const carFile = carFactory.build()
    const cid = carFile.put('data')
    ipfs.block.get.mockReturnValueOnce(Promise.resolve(carFile.blocks.get(cid).payload))
    expect(await dispatcher.retrieveCommit(FAKE_CID, FAKE_STREAM_ID)).toEqual('data')

    expect(ipfs.block.get.mock.calls.length).toEqual(1)
    expect(ipfs.block.get.mock.calls[0][0]).toEqual(FAKE_CID)
  })

  it('retries on timeout', async () => {
    const carFile = carFactory.build()
    const cid = carFile.put('data')
    ipfs.block.get.mockRejectedValueOnce({ code: 'ERR_TIMEOUT' })
    ipfs.block.get.mockReturnValueOnce(Promise.resolve(carFile.blocks.get(cid).payload))
    expect(await dispatcher.retrieveCommit(FAKE_CID, FAKE_STREAM_ID)).toEqual('data')

    expect(ipfs.block.get.mock.calls.length).toEqual(2)
    expect(ipfs.block.get.mock.calls[0][0]).toEqual(FAKE_CID)
    expect(ipfs.block.get.mock.calls[1][0]).toEqual(FAKE_CID)
  })

  it('caches and retrieves commit correctly', async () => {
    const ipfsSpy = ipfs.block.get
    const carFile = carFactory.build()
    const cid = carFile.put('data')
    ipfsSpy.mockReturnValueOnce(Promise.resolve(carFile.blocks.get(cid).payload))
    expect(await dispatcher.retrieveCommit(FAKE_CID, FAKE_STREAM_ID)).toEqual('data')
    // Commit not found in cache so IPFS lookup performed and cache updated
    expect(ipfsSpy).toBeCalledTimes(1)
    expect(await dispatcher.retrieveCommit(FAKE_CID, FAKE_STREAM_ID)).toEqual('data')
    // Commit found in cache so IPFS lookup skipped (IPFS lookup count unchanged)
    const clonedCID = CID.parse(FAKE_CID.toString())
    expect(clonedCID !== FAKE_CID).toEqual(true)
    expect(ipfsSpy).toBeCalledTimes(1)
    expect(await dispatcher.retrieveCommit(clonedCID, FAKE_STREAM_ID)).toEqual('data')
    // Commit found in cache with different instance of same CID (IPFS lookup count unchanged)
    expect(ipfsSpy).toBeCalledTimes(1)
    expect(ipfsSpy.mock.calls[0][0]).toEqual(FAKE_CID)
  })

  it('caches and retrieves with path correctly', async () => {
    const carFile = carFactory.build()
    const fooCid = carFile.put('foo')
    const barCid = carFile.put('bar')

    ipfs.dag.resolve.mockImplementation(async (cid: CID, opts: any) => {
      if (opts.path == '/foo') {
        return { cid: fooCid }
      } else if (opts.path == '/bar') {
        return { cid: barCid }
      } else {
        return null
      }
    })

    const blockGetSpy = ipfs.block.get
    blockGetSpy.mockImplementation(async (cid: CID) => carFile.blocks.get(cid).payload)

    expect(await dispatcher.retrieveFromIPFS(FAKE_CID, '/foo')).toEqual('foo')
    // CID+path not found in cache so IPFS lookup performed and cache updated
    expect(blockGetSpy).toBeCalledTimes(1)
    expect(ipfs.dag.resolve).toBeCalledWith(FAKE_CID, expect.objectContaining({ path: '/foo' }))
    expect(await dispatcher.retrieveFromIPFS(FAKE_CID, '/foo')).toEqual('foo')
    // CID+path found in cache so IPFS lookup skipped (IPFS lookup count unchanged)
    expect(blockGetSpy).toBeCalledTimes(1)

    expect(await dispatcher.retrieveFromIPFS(FAKE_CID, '/bar')).toEqual('bar')
    // Same CID with different path needs to skip cache and go to IPFS
    expect(blockGetSpy).toBeCalledTimes(2)
    expect(ipfs.dag.resolve).toBeCalledWith(FAKE_CID, expect.objectContaining({ path: '/bar' }))

    expect(blockGetSpy.mock.calls[0][0]).toEqual(fooCid)
    expect(blockGetSpy.mock.calls[1][0]).toEqual(barCid)
  })

  it('publishes tip correctly', async () => {
    const tip = CID.parse('QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D')
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

  it('handle message correctly without model', async () => {
    async function register(state: StreamState) {
      const runningState = new RunningState(state, false)
      repository._registerRunningState(runningState)
      dispatcher.messageBus.queryNetwork(runningState.id).subscribe()
      return runningState
    }

    const initialState = {
      type: 0,
      log: [
        {
          cid: FAKE_STREAM_ID.cid,
          type: eventType.INIT,
        },
      ],
    } as unknown as StreamState
    const state$ = await register(initialState)

    // Store the query ID sent when the stream is registered so we can use it as the response ID later
    const publishArgs = ipfs.pubsub.publish.mock.calls[0]
    expect(publishArgs[0]).toEqual(TOPIC)
    const queryMessageSent = JSON.parse(
      new TextDecoder().decode(publishArgs[1] as unknown as Uint8Array)
    )
    const queryID = queryMessageSent.id

    // Handle UPDATE message without model
    dispatcher.repository.handleUpdateFromNetwork = jest.fn()
    await dispatcher.handleMessage({
      typ: MsgType.UPDATE,
      stream: FAKE_STREAM_ID,
      tip: FAKE_CID,
      model: null,
    })
    expect(dispatcher.repository.handleUpdateFromNetwork).toBeCalledWith(state$.id, FAKE_CID, null)

    const continuationState = {
      ...initialState,
      log: initialState.log.concat({
        cid: FAKE_CID,
        type: EventType.DATA,
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
    expect(dispatcher.repository.handleUpdateFromNetwork).toBeCalledWith(
      stream2.id,
      FAKE_CID2,
      undefined
    )
  })

  it('handle message correctly with model', async () => {
    async function register(state: StreamState) {
      const runningState = new RunningState(state, false)
      repository._registerRunningState(runningState)
      dispatcher.messageBus.queryNetwork(runningState.id).subscribe()
      return runningState
    }

    const initialState = {
      type: 0,
      log: [
        {
          cid: FAKE_STREAM_ID.cid,
          type: eventType.INIT,
        },
      ],
    } as unknown as StreamState
    const state$ = await register(initialState)

    // Handle UPDATE message with model
    dispatcher.repository.handleUpdateFromNetwork = jest.fn()
    await dispatcher.handleMessage({
      typ: MsgType.UPDATE,
      stream: FAKE_STREAM_ID,
      tip: FAKE_CID,
      model: FAKE_MODEL,
    })
    expect(dispatcher.repository.handleUpdateFromNetwork).toBeCalledWith(
      state$.id,
      FAKE_CID,
      FAKE_MODEL
    )
  })

  test('init', async () => {
    const subscribeSpy = jest.spyOn(dispatcher.messageBus, 'subscribe')
    await dispatcher.init()
    expect(subscribeSpy).toBeCalled()
  })
})
