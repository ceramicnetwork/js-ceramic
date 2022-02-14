import { jest } from '@jest/globals'
import { Dispatcher } from '../dispatcher'
import CID from 'cids'
import { LoggerProvider, IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { Repository, RepositoryDependencies } from '../state-management/repository'
import tmp from 'tmp-promise'
import { LevelStateStore } from '../store/level-state-store'
import { PinStore } from '../store/pin-store'
import { createIPFS } from '@ceramicnetwork/ipfs-daemon'
import { TaskQueue } from '../pubsub/task-queue'

const TOPIC = '/ceramic'
const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

describe('Dispatcher with real ipfs over http', () => {
  jest.setTimeout(1000 * 30)

  let dispatcher: Dispatcher
  let ipfsClient: IpfsApi
  let shutdownController: AbortController

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
    shutdownController = new AbortController()

    dispatcher = new Dispatcher(
      ipfsClient,
      TOPIC,
      repository,
      loggerProvider.getDiagnosticsLogger(),
      loggerProvider.makeServiceLogger('pubsub'),
      shutdownController.signal,
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

    const data = await dispatcher.retrieveCommit(cid)
    expect(data.foo).toEqual('bar')
  })

  it('retries on timeout', async () => {
    const ipfsGetSpy = jest.spyOn(ipfsClient.dag, 'get')

    // try to load a CID that ipfs doesn't know about.  It will timeout
    await expect(dispatcher.retrieveCommit(FAKE_CID)).rejects.toThrow(/context deadline exceeded/)

    // Make sure we tried 3 times to get the cid from ipfs, not just once
    expect(ipfsGetSpy).toBeCalledTimes(3)
  })

  it('interrupts on shutdown', async () => {
    // This test has a shorter test timeout than the 'retries on timeout' test above
    // (5 seconds instead of 30).  That means that if the retrieveCommit call actually goes through
    // 3 retries that each take 3 seconds to time out, the test will take over 9 seconds and will
    // fail due to test timeout.  If the test succeeds, that means that signaling the
    // shutdownController successfully interrupted waiting on IPFS.

    const getPromise = dispatcher.retrieveCommit(FAKE_CID)
    shutdownController.abort()
    await expect(getPromise).rejects.toThrow(/The user aborted a request/)
  }, 5000)
})
