import { IndexApi, IpfsApi, LoggerProvider, Networks } from '@ceramicnetwork/common'
import tmp from 'tmp-promise'
import { Dispatcher } from '../dispatcher.js'
import { StreamStateStore } from '../store/stream-state-store.js'
import { Repository, RepositoryDependencies } from '../state-management/repository.js'
import { PinStore } from '../store/pin-store.js'
import { ShutdownSignal } from '../shutdown-signal.js'
import { TaskQueue } from '../ancillary/task-queue.js'
import { IReconApi } from '../recon.js'
import { LevelKVFactory } from '../store/level-kv-factory.js'
import { AnchorRequestStore } from '../store/anchor-request-store.js'

export async function createDispatcher(ipfs: IpfsApi, pubsubTopic: string): Promise<Dispatcher> {
  const loggerProvider = new LoggerProvider()
  const logger = loggerProvider.getDiagnosticsLogger()
  const levelPath = await tmp.tmpName()
  const factory = new LevelKVFactory(levelPath, 'test', logger)
  const stateStore = new StreamStateStore()
  await stateStore.open(factory)
  const fauxReconApi = {
    init: () => Promise.resolve(),
    pipe: () => fauxReconApi,
    subscribe: () => fauxReconApi,
  } as unknown as IReconApi
  const repository = new Repository(100, 100, fauxReconApi, logger)
  const pinStore = {
    stateStore,
    open: () => Promise.resolve(),
  } as unknown as PinStore
  const anchorRequestStore = {
    open: () => Promise.resolve(),
  } as unknown as AnchorRequestStore
  const index = {
    init: () => Promise.resolve(),
  } as unknown as IndexApi
  repository.setDeps({
    pinStore,
    kvFactory: factory,
    anchorRequestStore,
    indexing: index,
  } as unknown as RepositoryDependencies)
  await repository.init()
  const shutdownSignal = new ShutdownSignal()

  return new Dispatcher(
    ipfs,
    { pubsubTopic, id: 0, name: Networks.INMEMORY },
    repository,
    logger,
    loggerProvider.makeServiceLogger('pubsub'),
    shutdownSignal,
    true,
    10,
    fauxReconApi,
    new TaskQueue()
  )
}
