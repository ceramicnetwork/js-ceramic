import { Dispatcher } from './dispatcher.js'
import { StreamID, CommitID, StreamRef } from '@ceramicnetwork/streamid'
import { IpfsTopology } from '@ceramicnetwork/ipfs-topology'
import {
  CreateOpts,
  Stream,
  StreamHandler,
  Context,
  DiagnosticsLogger,
  StreamUtils,
  LoadOpts,
  AnchorService,
  CeramicApi,
  CeramicCommit,
  IpfsApi,
  MultiQuery,
  PinningBackendStatic,
  LoggerProvider,
  Networks,
  UpdateOpts,
  SyncOptions,
  AnchorValidator,
  AnchorStatus,
  StreamState,
  AdminApi,
  NodeStatusResponse,
  AnchorOpts,
} from '@ceramicnetwork/common'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'

import { DID } from 'dids'
import { PinStoreFactory } from './store/pin-store-factory.js'
import { PathTrie, TrieNode, promiseTimeout } from './utils.js'

import { DIDAnchorServiceAuth } from './anchor/auth/did-anchor-service-auth.js'
import {
  AuthenticatedEthereumAnchorService,
  EthereumAnchorService,
} from './anchor/ethereum/ethereum-anchor-service.js'
import { InMemoryAnchorService } from './anchor/memory/in-memory-anchor-service.js'

import { LocalPinApi } from './local-pin-api.js'
import { LocalAdminApi } from './local-admin-api.js'
import { Repository } from './state-management/repository.js'
import { HandlersMap } from './handlers-map.js'
import { streamFromState } from './state-management/stream-from-state.js'
import { ConflictResolution } from './conflict-resolution.js'
import { EthereumAnchorValidator } from './anchor/ethereum/ethereum-anchor-validator.js'
import * as fs from 'fs'
import os from 'os'
import * as path from 'path'
import { type IndexingConfig, LocalIndexApi, SyncApi } from '@ceramicnetwork/indexing'
import { ShutdownSignal } from './shutdown-signal.js'
import { LevelDbStore } from './store/level-db-store.js'
import { AnchorRequestStore } from './store/anchor-request-store.js'
import { AnchorResumingService } from './state-management/anchor-resuming-service.js'
import { ProvidersCache } from './providers-cache.js'
import crypto from 'crypto'
import { AnchorTimestampExtractor } from './stream-loading/anchor-timestamp-extractor.js'
import { TipFetcher } from './stream-loading/tip-fetcher.js'
import { LogSyncer } from './stream-loading/log-syncer.js'
import { StateManipulator } from './stream-loading/state-manipulator.js'
import { StreamLoader } from './stream-loading/stream-loader.js'
import {
  networkOptionsByName,
  type CeramicNetworkOptions,
} from './initialization/network-options.js'
import {
  usableAnchorChains,
  DEFAULT_ANCHOR_SERVICE_URLS,
  makeAnchorServiceUrl,
} from './initialization/anchoring.js'
import { StreamUpdater } from './stream-loading/stream-updater.js'

const DEFAULT_CACHE_LIMIT = 500 // number of streams stored in the cache
const DEFAULT_QPS_LIMIT = 10 // Max number of pubsub query messages that can be published per second without rate limiting
const TESTING = process.env.NODE_ENV == 'test'

const DEFAULT_LOCAL_ETHEREUM_RPC = 'http://localhost:7545' // default Ganache port

/**
 * For user-initiated writes that come in via the 'core' or http clients directly (as opposed to
 * writes initiated internally, such as from pubsub), we add additional default options.
 * User-initiated writes throw errors in more cases that are likely to indicate application bugs
 * or user errors, while internal writes generally swallow those errors.
 */
const DEFAULT_CLIENT_INITIATED_WRITE_OPTS = {
  throwOnInvalidCommit: true,
  throwOnConflict: true,
  throwIfStale: true,
}

const DEFAULT_APPLY_COMMIT_OPTS = {
  anchor: true,
  publish: true,
  sync: SyncOptions.PREFER_CACHE,
  ...DEFAULT_CLIENT_INITIATED_WRITE_OPTS,
}
const DEFAULT_CREATE_FROM_GENESIS_OPTS = {
  anchor: true,
  publish: true,
  sync: SyncOptions.PREFER_CACHE,
  ...DEFAULT_CLIENT_INITIATED_WRITE_OPTS,
}
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }

export const DEFAULT_STATE_STORE_DIRECTORY = path.join(os.homedir(), '.ceramic', 'statestore')
const ERROR_LOADING_STREAM = 'error_loading_stream'

/**
 * Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string
  anchorServiceUrl?: string
  anchorServiceAuthMethod?: string
  stateStoreDirectory?: string

  ipfsPinningEndpoints?: string[]
  pinningBackends?: PinningBackendStatic[]

  loggerProvider?: LoggerProvider
  gateway?: boolean

  indexing?: IndexingConfig

  networkName?: string
  pubsubTopic?: string

  streamCacheLimit?: number
  concurrentRequestsLimit?: number

  useCentralizedPeerDiscovery?: boolean
  syncOverride?: SyncOptions

  disablePeerDataSync?: boolean

  [index: string]: any // allow arbitrary properties
}

/**
 * Modules that Ceramic uses internally.
 * Most users will not provide this directly but will let it be derived automatically from the
 * `CeramicConfig` via `Ceramic.create()`.
 */
export interface CeramicModules {
  anchorService: AnchorService | null
  anchorValidator: AnchorValidator
  dispatcher: Dispatcher
  ipfs: IpfsApi
  ipfsTopology: IpfsTopology
  loggerProvider: LoggerProvider
  pinStoreFactory: PinStoreFactory
  repository: Repository
  shutdownSignal: ShutdownSignal
  providersCache: ProvidersCache
}

/**
 * Parameters that control internal Ceramic behavior.
 * Most users will not provide this directly but will let it be derived automatically from the
 * `CeramicConfig` via `Ceramic.create()`.
 */
export interface CeramicParameters {
  gateway: boolean
  stateStoreDirectory?: string
  indexingConfig: IndexingConfig
  sync?: boolean
  networkOptions: CeramicNetworkOptions
  loadOptsOverride: LoadOpts
}

const normalizeStreamID = (streamId: StreamID | string): StreamID => {
  const streamRef = StreamRef.from(streamId)
  if (StreamID.isInstance(streamRef)) {
    return streamRef
  } else {
    throw new Error(`Not StreamID: ${streamRef}`)
  }
}

const tryStreamId = (id: string): StreamID | null => {
  try {
    return StreamID.fromString(id)
  } catch (e) {
    return null
  }
}

/**
 * ### Ceramic core implementation.<br/>
 *
 * To install this library:<br/>
 * `$ npm install --save @ceramicnetwork/core`
 */
export class Ceramic implements CeramicApi {
  public readonly context: Context
  public readonly dispatcher: Dispatcher
  public readonly loggerProvider: LoggerProvider
  public readonly admin: AdminApi
  readonly repository: Repository
  private readonly anchorResumingService: AnchorResumingService
  private readonly providersCache: ProvidersCache
  private readonly syncApi: SyncApi

  readonly _streamHandlers: HandlersMap
  private readonly _anchorValidator: AnchorValidator
  private readonly _gateway: boolean
  private readonly _ipfsTopology: IpfsTopology
  private readonly _logger: DiagnosticsLogger
  private readonly _networkOptions: CeramicNetworkOptions
  private _supportedChains: Array<string>
  private readonly _loadOptsOverride: LoadOpts
  private readonly _shutdownSignal: ShutdownSignal
  private readonly _levelStore: LevelDbStore
  private readonly _runId: string
  private readonly _startTime: Date

  constructor(modules: CeramicModules, params: CeramicParameters) {
    this._ipfsTopology = modules.ipfsTopology
    this.loggerProvider = modules.loggerProvider
    this._logger = modules.loggerProvider.getDiagnosticsLogger()
    this.anchorResumingService = new AnchorResumingService(this._logger)
    this.repository = modules.repository
    this._shutdownSignal = modules.shutdownSignal
    this.dispatcher = modules.dispatcher
    this._anchorValidator = modules.anchorValidator
    this.providersCache = modules.providersCache

    this._gateway = params.gateway
    this._networkOptions = params.networkOptions
    this._loadOptsOverride = params.loadOptsOverride
    this._runId = crypto.randomUUID()
    this._startTime = new Date()

    this._levelStore = new LevelDbStore(
      params.stateStoreDirectory ?? DEFAULT_STATE_STORE_DIRECTORY,
      this._networkOptions.name
    )

    this.context = {
      api: this,
      anchorService: modules.anchorService,
      ipfs: modules.ipfs,
      loggerProvider: modules.loggerProvider,
    }
    if (!this._gateway) {
      this.context.anchorService.ceramic = this
    }

    this._streamHandlers = new HandlersMap(this._logger)

    // This initialization block below has to be redone.
    // Things below should be passed here as `modules` variable.
    // TODO(CDB-2749): Hide 'anchorTimestampExtractor', 'tipFetcher', 'logSyncer', and
    //  'stateManipulator' as implementation details of StreamLoader and StreamUpdater.
    const anchorTimestampExtractor = new AnchorTimestampExtractor(
      this._logger,
      this.dispatcher,
      modules.anchorValidator
    )
    const conflictResolution = new ConflictResolution(
      this._logger,
      anchorTimestampExtractor,
      this.dispatcher,
      this.context,
      this._streamHandlers
    )
    const tipFetcher = new TipFetcher(this.dispatcher.messageBus)
    const logSyncer = new LogSyncer(this.dispatcher)
    const stateManipulator = new StateManipulator(
      this._logger,
      this._streamHandlers,
      this.context,
      logSyncer
    )
    const streamLoader = new StreamLoader(
      this._logger,
      tipFetcher,
      logSyncer,
      anchorTimestampExtractor,
      stateManipulator
    )
    const streamUpdater = new StreamUpdater(
      this._logger,
      this.dispatcher,
      logSyncer,
      anchorTimestampExtractor,
      stateManipulator
    )
    const pinStore = modules.pinStoreFactory.createPinStore()
    const localIndex = new LocalIndexApi(
      params.indexingConfig,
      this, // Circular dependency while core provided indexing
      this._logger,
      params.networkOptions.name
    )
    this.repository.setDeps({
      dispatcher: this.dispatcher,
      pinStore: pinStore,
      keyValueStore: this._levelStore,
      anchorRequestStore: new AnchorRequestStore(),
      context: this.context,
      handlers: this._streamHandlers,
      anchorService: modules.anchorService,
      conflictResolution: conflictResolution,
      indexing: localIndex,
      streamLoader,
      streamUpdater,
    })
    this.syncApi = new SyncApi(
      {
        db: params.indexingConfig.db,
        on: params.sync,
      },
      this.dispatcher,
      this.repository.handleUpdate.bind(this.repository),
      this.repository.index,
      this._logger
    )
    const pinApi = new LocalPinApi(this.repository, this._logger)
    this.repository.index.setSyncQueryApi(this.syncApi)
    this.admin = new LocalAdminApi(localIndex, this.syncApi, this.nodeStatus.bind(this), pinApi)
  }

  get index(): LocalIndexApi {
    return this.repository.index
  }

  get pubsubTopic(): string {
    return this._networkOptions.pubsubTopic
  }

  /**
   * Get IPFS instance
   */
  get ipfs(): IpfsApi {
    return this.context.ipfs
  }

  /**
   * Get DID
   */
  get did(): DID | undefined {
    return this.context.did
  }

  /**
   * Sets the DID instance that will be used to author commits to streams. The DID instance
   * also includes the DID Resolver that will be used to verify commits from others.
   * @param did
   */
  set did(did: DID) {
    this.context.did = did
  }

  /**
   * Parses the given `CeramicConfig` and generates the appropriate `CeramicParameters` and
   * `CeramicModules` from it. This usually should not be called directly - most users will prefer
   * to call `Ceramic.create()` instead which calls this internally.
   */
  static _processConfig(ipfs: IpfsApi, config: CeramicConfig): [CeramicModules, CeramicParameters] {
    // Initialize ceramic loggers
    const loggerProvider = config.loggerProvider ?? new LoggerProvider()
    const logger = loggerProvider.getDiagnosticsLogger()
    const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
    const networkOptions = networkOptionsByName(config.networkName, config.pubsubTopic)

    let anchorService = null
    let anchorServiceAuth = null
    if (!config.gateway) {
      const anchorServiceUrl = makeAnchorServiceUrl(config.anchorServiceUrl, networkOptions.name)

      if (config.anchorServiceAuthMethod) {
        try {
          anchorServiceAuth = new DIDAnchorServiceAuth(anchorServiceUrl, logger)
        } catch (error) {
          throw new Error(`DID auth method for anchor service failed to instantiate`)
        }
      } else {
        if (networkOptions.name == Networks.MAINNET || networkOptions.name == Networks.ELP) {
          logger.warn(
            `DEPRECATION WARNING: The default IP address authentication will soon be deprecated. Update your daemon config to use DID based authentication.`
          )
        }
      }

      if (networkOptions.name != Networks.INMEMORY) {
        anchorService = anchorServiceAuth
          ? new AuthenticatedEthereumAnchorService(anchorServiceAuth, anchorServiceUrl, logger)
          : new EthereumAnchorService(anchorServiceUrl, logger)
      } else {
        anchorService = new InMemoryAnchorService(config as any)
      }
    }

    let ethereumRpcUrl = config.ethereumRpcUrl
    if (!ethereumRpcUrl && networkOptions.name == Networks.LOCAL) {
      ethereumRpcUrl = DEFAULT_LOCAL_ETHEREUM_RPC
    }
    const providersCache = new ProvidersCache(ethereumRpcUrl)

    let anchorValidator
    if (networkOptions.name == Networks.INMEMORY) {
      // Just use the InMemoryAnchorService as the AnchorValidator
      anchorValidator = anchorService
    } else {
      if (
        !ethereumRpcUrl &&
        (networkOptions.name == Networks.MAINNET || networkOptions.name == Networks.ELP)
      ) {
        logger.warn(
          `Running on mainnet without providing an ethereumRpcUrl is not recommended. Using the default ethereum provided may result in your requests being rate limited`
        )
      }
      // TODO (CDB-2229): use providers cache
      anchorValidator = new EthereumAnchorValidator(ethereumRpcUrl, logger)
    }

    const pinStoreOptions = {
      pinningEndpoints: config.ipfsPinningEndpoints,
      pinningBackends: config.pinningBackends,
    }

    const loadOptsOverride = config.syncOverride ? { sync: config.syncOverride } : {}

    // Use env var if set as highest priority. If no env var, check config file.
    // If not set in config file, fall back to hard-coded default.
    const streamCacheLimit = process.env.CERAMIC_STREAM_CACHE_LIMIT
      ? parseInt(process.env.CERAMIC_STREAM_CACHE_LIMIT)
      : config.streamCacheLimit ?? DEFAULT_CACHE_LIMIT
    const concurrentRequestsLimit = config.concurrentRequestsLimit ?? streamCacheLimit
    const maxQueriesPerSecond = process.env.CERAMIC_PUBSUB_QPS_LIMIT
      ? parseInt(process.env.CERAMIC_PUBSUB_QPS_LIMIT)
      : DEFAULT_QPS_LIMIT

    const ipfsTopology = new IpfsTopology(ipfs, networkOptions.name, logger)
    const repository = new Repository(streamCacheLimit, concurrentRequestsLimit, logger)
    const shutdownSignal = new ShutdownSignal()
    const dispatcher = new Dispatcher(
      ipfs,
      networkOptions.pubsubTopic,
      repository,
      logger,
      pubsubLogger,
      shutdownSignal,
      !config.disablePeerDataSync,
      maxQueriesPerSecond
    )
    const pinStoreFactory = new PinStoreFactory(
      ipfs,
      dispatcher.ipldCache,
      repository,
      pinStoreOptions,
      logger
    )

    const params: CeramicParameters = {
      gateway: config.gateway,
      stateStoreDirectory: config.stateStoreDirectory,
      indexingConfig: config.indexing,
      networkOptions,
      loadOptsOverride,
      sync: config.indexing?.enableHistoricalSync,
    }

    const modules: CeramicModules = {
      anchorService,
      anchorValidator,
      dispatcher,
      ipfs,
      ipfsTopology,
      loggerProvider,
      pinStoreFactory,
      repository,
      shutdownSignal,
      providersCache,
    }

    return [modules, params]
  }

  /**
   * Create Ceramic instance
   * @param ipfs - IPFS instance
   * @param config - Ceramic configuration
   */
  static async create(ipfs: IpfsApi, config: CeramicConfig = {}): Promise<Ceramic> {
    const [modules, params] = await Ceramic._processConfig(ipfs, config)
    const ceramic = new Ceramic(modules, params)

    const doPeerDiscovery = config.useCentralizedPeerDiscovery ?? !TESTING

    await ceramic._init(doPeerDiscovery)

    return ceramic
  }

  /**
   * Finishes initialization and startup of a Ceramic instance. This usually should not be called
   * directly - most users will prefer to call `Ceramic.create()` instead which calls this internally.
   * @param doPeerDiscovery - Controls whether we connect to the "peerlist" to manually perform IPFS peer discovery
   */
  async _init(doPeerDiscovery: boolean): Promise<void> {
    try {
      this._logger.imp(
        `Connecting to ceramic network '${this._networkOptions.name}' using pubsub topic '${this._networkOptions.pubsubTopic}'`
      )

      if (this._gateway) {
        this._logger.warn(`Starting in read-only gateway mode. All write operations will fail`)
      }

      await this.repository.init()

      if (doPeerDiscovery) {
        await this._ipfsTopology.start()
      }

      if (!this._gateway) {
        await this.context.anchorService.init()
        this._supportedChains = await usableAnchorChains(
          this._networkOptions.name,
          this.context.anchorService
        )
        this._logger.imp(
          `Connected to anchor service '${
            this.context.anchorService.url
          }' with supported anchor chains ['${this._supportedChains.join("','")}']`
        )
      }

      const chainId = this._supportedChains ? this._supportedChains[0] : null
      await this._anchorValidator.init(chainId)

      if (this.index.enabled && this.syncApi.enabled) {
        const provider = await this.providersCache.getProvider(chainId)
        await this.syncApi.init(provider)
      }

      await this._startupChecks()

      // We're not awaiting here on purpose, it's not supposed to be blocking
      this.anchorResumingService
        .resumeRunningStatesFromAnchorRequestStore(this.repository)
        .catch((error) => {
          this._logger.err(`Error while resuming anchors: ${error}`)
        })

      if (process.env.CERAMIC_DISABLE_ANCHOR_POLLING_RETRIES == 'true') {
        this._logger.warn(
          `Running with anchor polling retries disabled. This is not recommended in production`
        )
      }
    } catch (err) {
      await this.close()
      throw err
    }
  }

  /**
   * Runs some checks at node startup to ensure that the node is healthy and properly configured.
   * Throws an Error if any issues are detected
   */
  async _startupChecks(): Promise<void> {
    await this._checkIPFSPersistence()

    if (!this.dispatcher.enableSync && this.index.enabled && this.syncApi.enabled) {
      throw new Error(
        `Cannot enable ComposeDB Historical Data Sync while IPFS peer data sync is disabled`
      )
    }

    if (!this.dispatcher.enableSync) {
      this._logger.warn(
        `IPFS peer data sync is disabled. This node will be unable to load data from any other Ceramic nodes on the network`
      )
    }
  }

  /**
   * Used at startup to do a sanity check that the IPFS node has the commit data for pinned streams
   * as expected.
   */
  async _checkIPFSPersistence(): Promise<void> {
    if (process.env.CERAMIC_SKIP_IPFS_PERSISTENCE_STARTUP_CHECK == 'true') {
      this._logger.warn(`Skipping IPFS persistence checks`)
      return
    }

    const state = await this.repository.randomPinnedStreamState()
    if (!state) {
      this._logger.warn(
        `No pinned streams detected. This is expected if this is the first time this node has been run, but may indicate a problem with the node's persistence setup if it should have pinned streams`
      )
      return
    }

    const commitCIDs = [state.log[0].cid]
    if (state.log.length > 1) {
      commitCIDs.push(state.log[state.log.length - 1].cid)
    }

    for (const cid of commitCIDs) {
      const cidFound = await this.dispatcher.cidExistsInLocalIPFSStore(cid)
      if (!cidFound) {
        const streamID = StreamUtils.streamIdFromState(state).toString()

        if (!process.env.IPFS_PATH && fs.existsSync(path.resolve(os.homedir(), '.jsipfs'))) {
          throw new Error(
            `IPFS data missing! The CID ${cid} of pinned Stream ${streamID} is missing from the local IPFS node. This means that pinned content has gone missing from the IPFS node. A ~/.jsipfs directory has been detected which may mean you have not completed the steps needed to upgrade to js-ceramic v2. Please follow the upgrade guide found here: https://threebox.notion.site/Upgrading-to-js-ceramic-v2-Filesystem-b6b3cbb989a34e05893761fd914965b7. If that does not work check your IPFS node configuration and make sure it is pointing to the proper repo`
          )
        }

        throw new Error(
          `IPFS data missing! The CID ${cid} of pinned Stream ${streamID} is missing from the local IPFS node. This means that pinned content has gone missing from the IPFS node. Check your IPFS node configuration and make sure it is pointing to the proper repo`
        )
      }
    }
  }

  /**
   * @deprecated - use the Ceramic.did setter instead
   */
  async setDID(did: DID): Promise<void> {
    this.context.did = did
  }

  /**
   * Register new stream handler
   * @param streamHandler - Stream type handler
   */
  addStreamHandler<T extends Stream>(streamHandler: StreamHandler<T>): void {
    this._streamHandlers.add(streamHandler)
  }

  async nodeStatus(): Promise<NodeStatusResponse> {
    const anchor = {
      anchorServiceUrl: this.context.anchorService.url,
      ethereumRpcEndpoint: this._anchorValidator.ethereumRpcEndpoint,
      chainId: this._anchorValidator.chainId,
      pendingAnchors: this.repository.numPendingAnchors,
    }
    const ipfsStatus = await this.dispatcher.ipfsNodeStatus()

    let composeDB = undefined
    if (this.repository.index.enabled) {
      composeDB = {
        indexedModels: this.repository.index.indexedModels().map((stream) => stream.toString()),
      }
      if (this.syncApi.enabled) {
        composeDB.syncs = await this.syncApi.syncStatus()
      }
    }

    return {
      runId: this._runId,
      uptimeMs: new Date().getTime() - this._startTime.getTime(),
      network: this._networkOptions.name,
      anchor,
      ipfs: ipfsStatus,
      composeDB,
    }
  }

  /**
   * Applies commit on a given stream
   * @param streamId - Stream ID
   * @param commit - Commit to be applied
   * @param opts - Initialization options
   */
  async applyCommit<T extends Stream>(
    streamId: string | StreamID,
    commit: CeramicCommit,
    opts: CreateOpts | UpdateOpts = {}
  ): Promise<T> {
    if (this._gateway) {
      throw new Error('Writes to streams are not supported in gateway mode')
    }

    const id = normalizeStreamID(streamId)
    this._logger.verbose(`Apply commit to stream ${id.toString()}`)
    opts = { ...DEFAULT_APPLY_COMMIT_OPTS, ...opts, ...this._loadOptsOverride }
    const state$ = await this.repository.applyCommit(id, commit, opts as CreateOpts)

    const stream = streamFromState<T>(
      this.context,
      this._streamHandlers,
      state$.value,
      this.repository.updates$
    )

    await this.repository.indexStreamIfNeeded(state$)
    this._logger.verbose(`Applied commit to stream ${id.toString()}`)

    return stream
  }

  /**
   * Requests an anchor for the given StreamID if the Stream isn't already anchored.
   * Returns the new AnchorStatus for the Stream.
   * @param streamId
   * @param opts used to load the current Stream state
   */
  async requestAnchor(
    streamId: string | StreamID,
    opts: LoadOpts & AnchorOpts = {}
  ): Promise<AnchorStatus> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts, ...this._loadOptsOverride }
    const effectiveStreamId = normalizeStreamID(streamId)
    const state = await this.repository.load(effectiveStreamId, opts)
    await this.repository.anchor(state, opts)
    return state.state.anchorStatus
  }

  /**
   * Creates stream from genesis commit
   * @param type - Stream type
   * @param genesis - Genesis CID
   * @param opts - Initialization options
   */
  async createStreamFromGenesis<T extends Stream>(
    type: number,
    genesis: any,
    opts: CreateOpts = {}
  ): Promise<T> {
    opts = { ...DEFAULT_CREATE_FROM_GENESIS_OPTS, ...opts, ...this._loadOptsOverride }
    const genesisCid = await this.dispatcher.storeCommit(genesis)
    const streamId = new StreamID(type, genesisCid)
    this._logger.verbose(
      `Created stream from genesis, StreamID: ${streamId.toString()}, genesis CID: ${genesisCid.toString()}`
    )
    const state$ = await this.repository.applyCreateOpts(streamId, opts)
    const stream = streamFromState<T>(
      this.context,
      this._streamHandlers,
      state$.value,
      this.repository.updates$
    )
    this._logger.verbose(`Created stream ${streamId.toString()} from state`)

    await this.repository.indexStreamIfNeeded(state$)

    return stream
  }

  /**
   * Load stream type instance
   * @param streamId - Stream ID
   * @param opts - Initialization options
   */
  async loadStream<T extends Stream>(
    streamId: StreamID | CommitID | string,
    opts: LoadOpts = {}
  ): Promise<T> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts, ...this._loadOptsOverride }
    const streamRef = StreamRef.from(streamId)

    if (CommitID.isInstance(streamRef)) {
      const snapshot$ = await this.repository.loadAtCommit(streamRef, opts)
      return streamFromState<T>(this.context, this._streamHandlers, snapshot$.value)
    } else if (opts.atTime) {
      const snapshot$ = await this.repository.loadAtTime(streamRef, opts)
      return streamFromState<T>(this.context, this._streamHandlers, snapshot$.value)
    } else {
      try {
        const base$ = await this.repository.load(streamRef.baseID, opts)
        return streamFromState<T>(
          this.context,
          this._streamHandlers,
          base$.value,
          this.repository.updates$
        )
      } catch (err) {
        if (opts.sync != SyncOptions.SYNC_ON_ERROR) {
          throw err
        }

        this._logger.warn(
          `Error while loading stream ${streamRef.toString()} with SYNC_ON_ERROR flag. Resyncing stream. Error: ${err}`
        )

        // Retry with a full resync
        opts.sync = SyncOptions.SYNC_ALWAYS
        const base$ = await this.repository.load(streamRef.baseID, opts)
        return streamFromState<T>(
          this.context,
          this._streamHandlers,
          base$.value,
          this.repository.updates$
        )
      }
    }
  }

  /**
   * Load stream state for indexing queries, bypassing the stream cache and repository loading queue
   * @param streamId - Stream ID
   */
  async loadStreamState(streamId: StreamID): Promise<StreamState | undefined> {
    return await this.repository.streamState(streamId)
  }

  /**
   * Used to ensure that the given genesis commit contents already exist on IPFS so we don't time
   * out trying to load it.
   * @param genesis
   * @param streamRef
   */
  async _ensureGenesis(genesis: CeramicCommit, streamRef: StreamRef) {
    if (StreamUtils.isSignedCommitContainer(genesis) || StreamUtils.isSignedCommit(genesis)) {
      throw new Error('Given genesis commit is not deterministic')
    }

    const stream = await this.createStreamFromGenesis(streamRef.type, genesis)
    if (!streamRef.equals(stream.id)) {
      throw new Error(
        `StreamID ${stream.id.toString()} generated does not match expected StreamID ${streamRef.toString()} determined from genesis content in multiquery request`
      )
    }
  }

  /**
   * Load all stream type instance for given paths
   * @param query
   * @param timeout - Timeout in milliseconds
   * @private
   */
  private async _loadLinkedStreams(
    query: MultiQuery,
    timeout: number
  ): Promise<Record<string, Stream>> {
    const id = StreamRef.from(query.streamId)
    const pathTrie = new PathTrie()
    query.paths?.forEach((path) => pathTrie.add(path))

    if (query.genesis) {
      await this._ensureGenesis(query.genesis, id)
    }

    const index = {}
    const walkNext = async (node: TrieNode, streamId: StreamID | CommitID) => {
      const queryAtTime = query.opts?.atTime ? query.opts?.atTime : query.atTime
      const opts = (queryAtTime ? { atTime: queryAtTime, ...query.opts } : query.opts) ?? {}
      let stream
      try {
        stream = await promiseTimeout(
          this.loadStream(streamId, opts),
          timeout,
          `Timeout after ${timeout}ms`
        )
      } catch (e) {
        if (CommitID.isInstance(streamId)) {
          this._logger.warn(
            `Error loading stream ${streamId.baseID.toString()} at commit ${streamId.commit.toString()} at time ${
              opts.atTime
            } as part of a multiQuery request: ${e.toString()}`
          )
        } else {
          this._logger.warn(
            `Error loading stream ${streamId.toString()} at time ${
              opts.atTime
            } as part of a multiQuery request: ${e.toString()}`
          )
        }
        Metrics.count(ERROR_LOADING_STREAM, 1)
        return Promise.resolve()
      }
      const streamRef = opts?.atTime ? CommitID.make(streamId.baseID, stream.tip) : streamId
      index[streamRef.toString()] = stream

      const promiseList = Object.keys(node.children).map((key) => {
        const keyStreamId = stream.content[key] ? tryStreamId(stream.content[key]) : null
        if (keyStreamId) return walkNext(node.children[key], keyStreamId)
        return Promise.resolve()
      })

      await Promise.all(promiseList)
    }

    await walkNext(pathTrie.root, id)

    return index
  }

  /**
   * Load all stream types instances for given multiqueries
   * @param queries - Array of MultiQueries
   * @param timeout - Timeout in milliseconds
   */
  async multiQuery(queries: Array<MultiQuery>, timeout = 7000): Promise<Record<string, Stream>> {
    const queryResults = await Promise.all(
      queries.map((query) => {
        return this._loadLinkedStreams(query, timeout).catch((e) => {
          this._logger.warn(`Error during multiQuery: ${e.toString()}`)
          return {}
        })
      })
    )
    // Flatten the result objects from each individual multi query into a single response object
    const results = queryResults.reduce((acc, res) => ({ ...acc, ...res }), {})
    // Before returning the results, sync each Stream to its current state in the cache.  This is
    // necessary to handle the case where there are two MultiQueries in this batch for the same stream,
    // one on a specific CommitID and one on a base StreamID, and loading the CommitID tells this
    // node about a tip it had not previously heard about that turns out to be the best current tip.
    // This ensures the returned Streams always are as up-to-date as possible, and is behavior that
    // the anchor service relies upon.
    await Promise.all(
      Object.values(results).map((stream) => {
        if (!stream.isReadOnly) {
          return stream.sync({ sync: SyncOptions.NEVER_SYNC, syncTimeoutSeconds: 0 })
        }
      })
    )
    return results
  }

  /**
   * Load all stream commits by stream ID
   * @param streamId - Stream ID
   */
  async loadStreamCommits(streamId: string | StreamID): Promise<Record<string, any>[]> {
    const effectiveStreamId = normalizeStreamID(streamId)
    const stream = await this.loadStream(effectiveStreamId)
    const { state } = stream

    const results = await Promise.all(
      state.log.map(async ({ cid }) => {
        const commit = await this.dispatcher.retrieveCommit(cid, effectiveStreamId)
        return {
          cid: cid.toString(),
          value: await StreamUtils.convertCommitToSignedCommitContainer(commit, this.ipfs),
        }
      })
    )
    this._logger.verbose(
      `Successfully loaded ${results.length} commits for stream ${streamId.toString()}`
    )
    return results
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported for anchoring
   * streams.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return this._supportedChains
  }

  /**
   * Turns +state+ into a Stream instance of the appropriate StreamType.
   * Does not add the resulting instance to a cache.
   * @param state StreamState for a stream.
   */
  buildStreamFromState<T extends Stream = Stream>(state: StreamState): T {
    return streamFromState<T>(this.context, this._streamHandlers, state, this.repository.updates$)
  }

  /**
   * Close Ceramic instance gracefully
   */
  async close(): Promise<void> {
    this._logger.imp('Closing Ceramic instance')
    await this.anchorResumingService.close()
    this._shutdownSignal.abort()
    await this.syncApi.shutdown()
    await this.dispatcher.close()
    await this.repository.close()
    this._ipfsTopology.stop()
    this._logger.imp('Ceramic instance closed successfully')
  }
}
