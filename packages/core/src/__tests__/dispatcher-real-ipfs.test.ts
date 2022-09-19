import { jest } from '@jest/globals'
import { Dispatcher } from '../dispatcher.js'
import { CID } from 'multiformats/cid'
import { LoggerProvider, IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { Repository, RepositoryDependencies } from '../state-management/repository.js'
import tmp from 'tmp-promise'
import { LevelStateStore } from '../store/level-state-store.js'
import { PinStore } from '../store/pin-store.js'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TaskQueue } from '../pubsub/task-queue.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { ShutdownSignal } from '../shutdown-signal.js'

const TOPIC = '/ceramic'
const FAKE_CID = CID.parse('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)

describe('Dispatcher with real ipfs over http', () => {
  jest.setTimeout(1000 * 30)

  let dispatcher: Dispatcher
  let ipfsClient: IpfsApi
  let shutdownSignal: ShutdownSignal

  beforeAll(async () => {
    ipfsClient = await createIPFS()

    const loggerProvider = new LoggerProvider()
    const levelPath = await tmp.tmpName()
    const stateStore = new LevelStateStore(levelPath)
    stateStore.open('test')
    const repository = new Repository(100, 100, loggerProvider.getDiagnosticsLogger())
    const pinStore = {
      stateStore,
    } as unknown as PinStore
    repository.setDeps({ pinStore } as unknown as RepositoryDependencies)
    shutdownSignal = new ShutdownSignal()

    dispatcher = new Dispatcher(
      ipfsClient,
      TOPIC,
      repository,
      loggerProvider.getDiagnosticsLogger(),
      loggerProvider.makeServiceLogger('pubsub'),
      shutdownSignal,
      10,
      new TaskQueue(),
      3000 // time out ipfs.dag.get after 3 seconds
    )
  })

  afterAll(async () => {
    await dispatcher.close()
    // Wait for pubsub unsubscribe to be processed
    // TODO(1963): Remove this once dispatcher.close() won't resolve until the pubsub unsubscribe
    // has been processed
    await TestUtils.delay(5000)

    await ipfsClient.stop()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('basic ipfs http client functionality', async () => {
    const cid = await dispatcher.storeCommit({ foo: 'bar' })

    const data = await dispatcher.retrieveCommit(cid, FAKE_STREAM_ID)
    expect(data.foo).toEqual('bar')
  })

  it('retries on timeout', async () => {
    const ipfsGetSpy = jest.spyOn(ipfsClient.dag, 'get')

    // try to load a CID that ipfs doesn't know about.  It will timeout.
    // Timeout error message is different depending on if we are talking to a go-ipfs or js-ipfs instance
    await expect(dispatcher.retrieveCommit(FAKE_CID, FAKE_STREAM_ID)).rejects.toThrow(
      /(context deadline exceeded|request timed out)/
    )

    // Make sure we tried 3 times to get the cid from ipfs, not just once
    expect(ipfsGetSpy).toBeCalledTimes(3)
  })

  it('interrupts on shutdown', async () => {
    // This test has a shorter test timeout than the 'retries on timeout' test above
    // (5 seconds instead of 30).  That means that if the retrieveCommit call actually goes through
    // 3 retries that each take 3 seconds to time out, the test will take over 9 seconds and will
    // fail due to test timeout.  If the test succeeds, that means that signaling the
    // shutdownController successfully interrupted waiting on IPFS.

    const getPromise = dispatcher.retrieveCommit(FAKE_CID, FAKE_STREAM_ID)
    // Apparently, js-ipfs does not react on already triggered AbortSignal.
    // So we have to add a timeout to make sure an ipfs function is called before the signal is triggered.
    const isJsIpfsNode = Boolean((ipfsClient as any).preload) // Exists on js-ipfs node, and is not present on ipfs-http-client.
    if (isJsIpfsNode) {
      await TestUtils.delay(1000)
    }
    shutdownSignal.abort()
    await expect(getPromise).rejects.toThrow(/aborted/)
  }, 50000)
})
