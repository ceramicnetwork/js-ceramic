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

describe('Dispatcher with real ipfs over http', () => {
  jest.setTimeout(1000 * 60 * 2) // 2 minutes. Need at least 1 min 30 for 3 30 second timeouts with retries

  let dispatcher: Dispatcher
  let ipfsNode: IpfsApi
  let ipfsApi: HttpApi
  let ipfsClient: IpfsApi

  beforeEach(async () => {
    const ipfsPort = await getPort()
    const ipfsUrl = `http://127.0.0.1:${ipfsPort}`
    const ipfsApiAddress = `/ip4/127.0.0.1/tcp/${ipfsPort}`
    const overrideConfig = { config: { Addresses: { API: [ipfsApiAddress] } } }
    console.log(`creatings ipfs with api port ${ipfsPort}`)
    ipfsNode = await createIPFS(overrideConfig)
    ipfsApi = new HttpApi(ipfsNode)
    await ipfsApi.start()

    //await TestUtils.delay(1000 * 5) // sleep 5 seconds for ipfs to stabilize

    ipfsClient = await IpfsHttpClient.create({ url: ipfsUrl })

    const loggerProvider = new LoggerProvider()
    const levelPath = await tmp.tmpName()
    console.log(`starting level state store at path ${levelPath.toString()}`)
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
      loggerProvider.makeServiceLogger('pubsub')
    )
  })

  afterEach(async () => {
    await dispatcher.close()
    await ipfsApi.stop()
    await ipfsNode.stop()
    //await TestUtils.delay(2000) // sleep 2 seconds for ipfs to finish shutting down
  })

  it('foo', async () => {
    expect(true).toEqual(1 == 1)
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
