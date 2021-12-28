import { Dispatcher } from '../dispatcher'
import CID from 'cids'
import { LoggerProvider, IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { Repository, RepositoryDependencies } from '../state-management/repository'
import tmp from 'tmp-promise'
import { LevelStateStore } from '../store/level-state-store'
import { PinStore } from '../store/pin-store'
import { createIPFS } from './ipfs-util'
import IpfsHttpClient from 'ipfs-http-client'
import HttpApi from 'ipfs-http-server'
import getPort from 'get-port'

const TOPIC = '/ceramic'
const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

describe('Dispatcher with real ipfs over http', () => {
  jest.setTimeout(1000 * 60 * 2) // 2 minutes. Need at least 1 min 30 for 3 30 second timeouts with retries

  let dispatcher: Dispatcher
  let ipfsNode: IpfsApi
  let ipfsApi: HttpApi
  let ipfsClient: IpfsApi

  beforeAll(async () => {
    const ipfsPort = await getPort()
    const ipfsUrl = `http://127.0.0.1:${ipfsPort}`
    const ipfsApiAddress = `/ip4/127.0.0.1/tcp/${ipfsPort}`
    const overrideConfig = { config: { Addresses: { API: [ipfsApiAddress] } } }
    console.log(`creatings ipfs with api port ${ipfsPort}`)
    ipfsNode = await createIPFS(overrideConfig)
    ipfsApi = new HttpApi(ipfsNode)
    await ipfsApi.start()

    ipfsClient = await IpfsHttpClient.create({ url: ipfsUrl })

    const loggerProvider = new LoggerProvider()
    const levelPath = await tmp.tmpName()
    const stateStore = new LevelStateStore(levelPath)
    stateStore.open('test')
    const repository = new Repository(100, 100, loggerProvider.getDiagnosticsLogger())
    const pinStore = {
      stateStore,
    } as unknown as PinStore
    repository.setDeps({ pinStore } as unknown as RepositoryDependencies)
    dispatcher = new Dispatcher(
      ipfsClient,
      TOPIC,
      repository,
      loggerProvider.getDiagnosticsLogger(),
      loggerProvider.makeServiceLogger('pubsub'),
      10
    )
  })

  afterAll(async () => {
    await dispatcher.close()
    // Wait for pubsub unsubscribe to be processed
    // TODO(1963): Remove this once dispatcher.close() won't resolve until the pubsub unsubscribe
    // has been processed
    await TestUtils.delay(5000)

    await ipfsApi.stop()
    await ipfsNode.stop()
  })

  it('basic ipfs http client functionality', async () => {
    const cid = await dispatcher.storeCommit({ foo: 'bar' })

    const data = await dispatcher.retrieveCommit(cid)
    expect(data.foo).toEqual('bar')
  })

  it('retries on timeout', async () => {
    const ipfsGetSpy = jest.spyOn(ipfsClient.dag, 'get')

    // try to load a CID that ipfs doesn't know about.  It will timeout
    await expect(dispatcher.retrieveCommit(FAKE_CID)).rejects.toThrow(/Request timed out/)

    // Make sure we tried 3 times to get the cid from ipfs, not just once
    expect(ipfsGetSpy).toBeCalledTimes(3)

    ipfsGetSpy.mockRestore()
  })
})
