import { Dispatcher } from './dispatcher.js'
import { StreamID, CommitID, StreamRef } from '@ceramicnetwork/streamid'
import { IpfsTopology } from '@ceramicnetwork/ipfs-topology'
import {
  CreateOpts,
  Stream,
  StreamHandler,
  DiagnosticsLogger,
  EnvironmentUtils,
  StreamUtils,
  LoadOpts,
  CeramicCommit,
  IpfsApi,
  MultiQuery,
  PinningBackendStatic,
  LoggerProvider,
  UpdateOpts,
  SyncOptions,
  AnchorStatus,
  StreamState,
  AdminApi,
  NodeStatusResponse,
  AnchorOpts,
  CeramicSigner,
  StreamStateLoader,
  StreamReaderWriter,
} from '@ceramicnetwork/common'
import {
  DEFAULT_TRACE_SAMPLE_RATIO,
  ServiceMetrics as Metrics,
} from '@ceramicnetwork/observability'
import { DEFAULT_PUBLISH_INTERVAL_MS, NodeMetrics } from '@ceramicnetwork/node-metrics'

import { DID } from 'dids'
import { PinStoreFactory } from './store/pin-store-factory.js'
import { PathTrie, TrieNode, promiseTimeout } from './utils.js'
import { LocalPinApi } from './local-pin-api.js'
import { LocalAdminApi } from './local-admin-api.js'
import { Repository } from './state-management/repository.js'
import { HandlersMap } from './handlers-map.js'
import { streamFromState } from './state-management/stream-from-state.js'
import * as fs from 'fs'
import os from 'os'
import * as path from 'path'
import { type IndexingConfig, LocalIndexApi, SyncApi } from '@ceramicnetwork/indexing'
import { ShutdownSignal } from './shutdown-signal.js'
import { AnchorRequestStore } from './store/anchor-request-store.js'
import { ProvidersCache } from './providers-cache.js'
import crypto from 'crypto'
import {
  networkOptionsByName,
  type CeramicNetworkOptions,
} from './initialization/network-options.js'
import {
  usableAnchorChains,
  makeAnchorService,
  makeEthereumRpcUrl,
} from './initialization/anchoring.js'
import type { AnchorService } from './anchor/anchor-service.js'
import { makeStreamLoaderAndUpdater } from './initialization/stream-loading.js'
import { Feed, type PublicFeed } from './feed.js'
import { IReconApi, ReconApi } from './recon.js'
import { IKVFactory } from './store/ikv-store.js'
import { LevelKVFactory } from './store/level-kv-factory.js'

const METRICS_CALLER_NAME = 'js-ceramic'
const DEFAULT_CACHE_LIMIT = 500 // number of streams stored in the cache
const DEFAULT_QPS_LIMIT = 10 // Max number of pubsub query messages that can be published per second without rate limiting
const DEFAULT_MULTIQUERY_TIMEOUT_MS = 30 * 1000
const DEFAULT_MIN_ANCHOR_LOOP_DURATION_MS = 60 * 1000 // 1 minute
const TESTING = process.env.NODE_ENV == 'test'

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
const ERROR_APPLYING_COMMIT = 'error_applying_commit'
const VERSION_INFO = 'version_info'

const PUBLISH_VERSION_INTERVAL_MS = 1000 * 60 * 60 // once per hour

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
  readOnly?: boolean

  indexing?: IndexingConfig
  metrics?: MetricsConfig

  networkName?: string
  pubsubTopic?: string

  streamCacheLimit?: number
  concurrentRequestsLimit?: number

  useCentralizedPeerDiscovery?: boolean
  syncOverride?: SyncOptions

  disablePeerDataSync?: boolean

  networkId?: number

  [index: string]: any // allow arbitrary properties
}

/**
 * Modules that Ceramic uses internally.
 * Most users will not provide this directly but will let it be derived automatically from the
 * `CeramicConfig` via `Ceramic.create()`.
 */
export interface CeramicModules {
  anchorService: AnchorService | null
  dispatcher: Dispatcher
  ipfs: IpfsApi
  ipfsTopology: IpfsTopology
  loggerProvider: LoggerProvider
  pinStoreFactory: PinStoreFactory
  repository: Repository
  shutdownSignal: ShutdownSignal
  providersCache: ProvidersCache
  feed: Feed
  signer: CeramicSigner
  reconApi: IReconApi
}

export interface VersionInfo {
  cliPackageVersion: string
  gitHash: string
  ceramicOneVersion: string
}

/**
 * Ceramic core type corresponding to the DaemonMetricsConfig in the cli package
 */
interface MetricsConfig {
  prometheusExporterEnabled?: boolean
  prometheusExporterPort?: number
  metricsExporterEnabled?: boolean
  collectorHost?: string
  metricsPublisherEnabled?: boolean
  metricsPublishIntervalMS?: number
}

/**
 * Parameters that control internal Ceramic behavior.
 * Most users will not provide this directly but will let it be derived automatically from the
 * `CeramicConfig` via `Ceramic.create()`.
 */
export interface CeramicParameters {
  readOnly: boolean
  stateStoreDirectory?: string
  indexingConfig: IndexingConfig
  sync?: boolean
  networkOptions: CeramicNetworkOptions
  loadOptsOverride: LoadOpts
  anchorLoopMinDurationMs?: number
  versionInfo?: VersionInfo
  metrics?: MetricsConfig
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
 * Internal API for js-ceramic core, mimics the HTTP API outlined above
 *
 * - `ceramic.feed.aggregation.streamStates`
 *     - all as Observable<T>
 */

/**
 * ### Ceramic core implementation.<br/>
 *
 * To install this library:<br/>
 * `$ npm install --save @ceramicnetwork/core`
 */
export class Ceramic implements StreamReaderWriter, StreamStateLoader {
  // Primarily for backwards compatibility around the get did call, any usages for signing
  // or verification should be done using `_signer`. See `get did` and `get signer` for more
  // information
  private _did?: DID
  private _ipfs?: IpfsApi
  private _signer: CeramicSigner
  public readonly dispatcher: Dispatcher
  public readonly loggerProvider: LoggerProvider
  public readonly recon: IReconApi
  public readonly admin: AdminApi
  public readonly feed: PublicFeed
  readonly repository: Repository
  readonly anchorService: AnchorService
  private readonly providersCache: ProvidersCache
  private readonly syncApi: SyncApi

  readonly _streamHandlers: HandlersMap
  private readonly _readOnly: boolean
  private readonly _ipfsTopology: IpfsTopology
  private readonly _logger: DiagnosticsLogger
  private readonly _metricsConfig: MetricsConfig
  private readonly _networkOptions: CeramicNetworkOptions
  private _supportedChains: Array<string>
  private readonly _loadOptsOverride: LoadOpts
  private readonly _shutdownSignal: ShutdownSignal
  private readonly _kvFactory: IKVFactory
  private readonly _runId: string
  private readonly _startTime: Date
  private readonly _versionInfo: VersionInfo
  private _versionMetricInterval: NodeJS.Timer | undefined = undefined

  constructor(modules: CeramicModules, params: CeramicParameters) {
    this._signer = modules.signer
    this._ipfsTopology = modules.ipfsTopology
    this.loggerProvider = modules.loggerProvider
    this._logger = modules.loggerProvider.getDiagnosticsLogger()
    this.repository = modules.repository
    this.feed = modules.feed
    this._shutdownSignal = modules.shutdownSignal
    this.dispatcher = modules.dispatcher
    this.anchorService = modules.anchorService
    this.providersCache = modules.providersCache

    this._readOnly = params.readOnly
    this._metricsConfig = params.metrics
    this._networkOptions = params.networkOptions
    this._loadOptsOverride = params.loadOptsOverride
    this._versionInfo = params.versionInfo
    this._runId = crypto.randomUUID()
    this._startTime = new Date()

    this._kvFactory = new LevelKVFactory(
      params.stateStoreDirectory ?? DEFAULT_STATE_STORE_DIRECTORY,
      this._networkOptions.name,
      this._logger
    )

    this._ipfs = modules.ipfs

    this._streamHandlers = new HandlersMap(this._logger)

    // This initialization block below has to be redone.
    // Things below should be passed here as `modules` variable.
    const [streamLoader, streamUpdater] = makeStreamLoaderAndUpdater(
      this._logger,
      this.dispatcher,
      modules.anchorService.validator,
      this,
      this._streamHandlers
    )
    const pinStore = modules.pinStoreFactory.createPinStore()
    const localIndex = new LocalIndexApi(
      params.indexingConfig,
      this,
      this,
      this._logger,
      params.networkOptions.name
    )
    const anchorRequestStore = new AnchorRequestStore(
      this._logger,
      params.anchorLoopMinDurationMs >= 0
        ? params.anchorLoopMinDurationMs
        : DEFAULT_MIN_ANCHOR_LOOP_DURATION_MS
    )
    this.repository.setDeps({
      dispatcher: this.dispatcher,
      pinStore: pinStore,
      kvFactory: this._kvFactory,
      anchorRequestStore,
      handlers: this._streamHandlers,
      anchorService: modules.anchorService,
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
      this.repository.handleUpdateFromNetwork.bind(this.repository),
      this.repository.index,
      this._logger
    )
    const pinApi = new LocalPinApi(this.repository, this._logger)
    this.repository.index.setSyncQueryApi(this.syncApi)
    this.recon = modules.reconApi
    this.admin = new LocalAdminApi(
      this._logger,
      localIndex,
      this.syncApi,
      this.nodeStatus.bind(this),
      pinApi,
      this.providersCache,
      this.loadStream.bind(this),
      modules.reconApi
    )
  }

  get index(): LocalIndexApi {
    return this.repository.index
  }

  get pubsubTopic(): string {
    return this._networkOptions.pubsubTopic
  }

  /**
   * Get the signer for this ceramic, used in creating and verifying signatures. This should be used
   * for all of those instances rather than `did`, since the signer has any additional logic
   * related to creating and verifying signatures.
   */
  get signer(): CeramicSigner {
    return this._signer
  }

  /**
   * Get IPFS instance
   */
  get ipfs(): IpfsApi {
    return this._ipfs
  }

  /**
   * Get DID. This should only be used if you need to interrogate the DID that was set for this
   * ceramic. For most instances, prefer `signer`, as it has the necessary information for creating
   * and verifying signatures.
   */
  get did(): DID | undefined {
    return this._did
  }

  /**
   * Sets the DID instance that will be used to author commits to streams. The DID instance
   * also includes the DID Resolver that will be used to verify commits from others.
   * @param did
   */
  set did(did: DID) {
    this._did = did
    this._signer.withDid(did)
  }

  /**
   * Parses the given `CeramicConfig` and generates the appropriate `CeramicParameters` and
   * `CeramicModules` from it. This usually should not be called directly - most users will prefer
   * to call `Ceramic.create()` instead which calls this internally.
   */
  static _processConfig(
    ipfs: IpfsApi,
    config: CeramicConfig,
    versionInfo: VersionInfo
  ): [CeramicModules, CeramicParameters] {
    // Initialize ceramic loggers
    const loggerProvider = config.loggerProvider ?? new LoggerProvider()
    const logger = loggerProvider.getDiagnosticsLogger()
    const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
    const networkOptions = networkOptionsByName(
      config.networkName,
      config.pubsubTopic,
      config.networkId
    )

    const ethereumRpcUrl = makeEthereumRpcUrl(config.ethereumRpcUrl, networkOptions.name, logger)
    const signer = CeramicSigner.invalid()
    const anchorService = makeAnchorService(
      config,
      ethereumRpcUrl,
      networkOptions.name,
      logger,
      versionInfo,
      signer
    )
    const providersCache = new ProvidersCache(ethereumRpcUrl)

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
    const reconApi = new ReconApi(
      {
        enabled: EnvironmentUtils.useRustCeramic(),
        url: ipfs.config.get('Addresses.API').then((url) => url.toString()),
        // TODO: WS1-1487 not an official ceramic config option
        feedEnabled: config.reconFeedEnabled ?? true,
      },
      logger
    )
    const repository = new Repository(streamCacheLimit, concurrentRequestsLimit, reconApi, logger)
    const shutdownSignal = new ShutdownSignal()
    const dispatcher = new Dispatcher(
      ipfs,
      networkOptions.pubsubTopic,
      repository,
      logger,
      pubsubLogger,
      shutdownSignal,
      !config.disablePeerDataSync,
      maxQueriesPerSecond,
      reconApi
    )
    const pinStoreOptions = {
      pinningEndpoints: config.ipfsPinningEndpoints,
      pinningBackends: config.pinningBackends,
    }
    const pinStoreFactory = new PinStoreFactory(
      ipfs,
      dispatcher.ipldCache,
      repository,
      pinStoreOptions,
      logger
    )

    const params: CeramicParameters = {
      readOnly: config.readOnly,
      stateStoreDirectory: config.stateStoreDirectory,
      indexingConfig: config.indexing,
      metrics: config.metrics,
      networkOptions,
      loadOptsOverride,
      sync: config.indexing?.enableHistoricalSync,
      anchorLoopMinDurationMs: parseInt(config.anchorLoopMinDurationMs, 10),
      versionInfo,
    }

    const modules: CeramicModules = {
      anchorService,
      dispatcher,
      ipfs,
      ipfsTopology,
      loggerProvider,
      pinStoreFactory,
      repository,
      shutdownSignal,
      providersCache,
      feed: repository.feed,
      signer,
      reconApi,
    }

    return [modules, params]
  }

  /**
   * Create Ceramic instance
   * @param ipfs - IPFS instance
   * @param config - Ceramic configuration
   * @param versionInfo - Information about the version of js-ceramic and ceramic-one that is being running.
   */
  static async create(
    ipfs: IpfsApi,
    config: CeramicConfig = {},
    versionInfo: VersionInfo
  ): Promise<Ceramic> {
    const [modules, params] = Ceramic._processConfig(ipfs, config, versionInfo)
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
      if (EnvironmentUtils.useRustCeramic()) {
        // this is potentially incorrect if we're running in remote mode as we don't control the network and could mismatch with c1
        this._logger.imp(
          `Connecting to ceramic network '${this._networkOptions.name}' using ceramic-one with Recon for data synchronization.`
        )
      } else {
        this._logger.imp(
          `Connecting to ceramic network '${this._networkOptions.name}' using pubsub topic '${this._networkOptions.pubsubTopic}'`
        )
      }
      if (this._readOnly) {
        this._logger.warn(`Starting in read-only mode. All write operations will fail`)
      }

      await this.repository.init()
      await this.dispatcher.init()

      if (doPeerDiscovery) {
        await this._ipfsTopology.start()
      }

      if (!this._readOnly) {
        await this.anchorService.init(
          this.repository.anchorRequestStore,
          this.repository.anchorLoopHandler()
        )
        this._supportedChains = await usableAnchorChains(
          this._networkOptions.name,
          this.anchorService,
          this._logger
        )
        if (this.index.enabled && this.syncApi.enabled) {
          const chainId = this._supportedChains[0]
          if (chainId) {
            const provider = await this.providersCache.getProvider(chainId)
            await this.syncApi.init(provider)
          }
        }
      }

      await this._startupChecks()
      await this._startMetrics()
    } catch (err) {
      this._logger.err(err)
      await this.close()
      throw err
    }
  }

  async _publishVersionMetrics() {
    Metrics.observe(VERSION_INFO, 1, {
      jsCeramicVersion: this._versionInfo.cliPackageVersion,
      jsCeramicGitHash: this._versionInfo.gitHash,
      ceramicOneVersion: this._versionInfo.ceramicOneVersion,
    })
  }

  async _startMetrics(): Promise<void> {
    // Handle base OTLP metrics
    const metricsExporterEnabled =
      this._metricsConfig?.metricsExporterEnabled && this._metricsConfig?.collectorHost
    const prometheusExporterEnabled =
      this._metricsConfig?.prometheusExporterEnabled && this._metricsConfig?.prometheusExporterPort

    // If desired, enable OTLP metrics
    if (metricsExporterEnabled && prometheusExporterEnabled) {
      Metrics.start(
        this._metricsConfig.collectorHost,
        METRICS_CALLER_NAME,
        DEFAULT_TRACE_SAMPLE_RATIO,
        null,
        true,
        this._metricsConfig.prometheusExporterPort
      )
    } else if (metricsExporterEnabled) {
      Metrics.start(this._metricsConfig.collectorHost, METRICS_CALLER_NAME)
    } else if (prometheusExporterEnabled) {
      Metrics.start(
        '',
        METRICS_CALLER_NAME,
        DEFAULT_TRACE_SAMPLE_RATIO,
        null,
        true,
        this._metricsConfig.prometheusExporterPort
      )
    }

    // Handle NodeMetrics that are published to a Model on Ceramic
    if (this.did?.authenticated) {
      // If authenticated into the node, we can start publishing metrics
      // publishing metrics is enabled by default, even if no metrics config
      if (this._metricsConfig?.metricsPublisherEnabled) {
        // First, subscribe the node to the Model used for NodeMetrics
        const metricsModel = NodeMetrics.getModel(this._networkOptions.name)
        await this._waitForMetricsModel(metricsModel)
        await this.repository.index.indexModels([{ streamID: metricsModel }])
        await this.recon.registerInterest(metricsModel, this.did.id)

        // Now start the NodeMetrics system.
        const ipfsVersion = await this.ipfs.version()
        const ipfsId = await this.ipfs.id()

        NodeMetrics.start({
          ceramic: this,
          network: this._networkOptions.name,
          ceramicVersion: this._versionInfo.cliPackageVersion,
          ipfsVersion: ipfsVersion.version,
          intervalMS: this._metricsConfig?.metricsPublishIntervalMS || DEFAULT_PUBLISH_INTERVAL_MS,
          nodeId: ipfsId.publicKey, // what makes the best ID for the node?
          nodeName: '', // daemon.hostname is not useful
          nodeAuthDID: this.did.id,
          nodeIPAddr: '', // daemon.hostname is not the external name
          nodePeerId: ipfsId.publicKey,
          logger: this._logger,
        })
        this._logger.imp(
          `Publishing Node Metrics publicly to the Ceramic Network.  To learn more, including how to disable publishing, please see the NODE_METRICS.md file for your branch, e.g. https://github.com/ceramicnetwork/js-ceramic/blob/develop/docs-dev/NODE_METRICS.md`
        )
      }
    } else {
      // warn that the node does not have an authenticated did
      this._logger.imp(
        `The ceramic daemon is running without an authenticated DID.  This means that this node cannot itself publish streams, including node metrics, and cannot use a DID as the method to authenticate with the Ceramic Anchor Service.  See https://developers.ceramic.network/docs/composedb/guides/composedb-server/access-mainnet#updating-to-did-based-authentication for instructions on how to update your node to use DID authentication.`
      )
    }

    // Start background job to publish periodic metrics
    this._versionMetricInterval = setInterval(
      this._publishVersionMetrics.bind(this),
      PUBLISH_VERSION_INTERVAL_MS
    )
  }

  /**
   * Waits for Model used to publish NodeMetrics to be available locally.
   * Since we subscribe to the metamodel at startup, so long as some connected node on the network
   * has the model, it should eventually be available locally.
   * @param model
   */
  async _waitForMetricsModel(model: StreamID): Promise<void> {
    let attemptNum = 0
    let backoffMs = 100
    const maxBackoffMs = 1000 * 10
    const delay = async function (ms) {
      return new Promise<void>((resolve) => setTimeout(() => resolve(), ms))
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await this.dispatcher.getFromIpfs(model.cid)
        if (attemptNum > 0) {
          this._logger.imp(`Model ${model} used to publish NodeMetrics loaded successfully`)
        }
        return
      } catch (err) {
        if (attemptNum == 0) {
          this._logger.imp(
            `Waiting for Model ${model} used to publish NodeMetrics to be available locally`
          )
        }
        if (attemptNum >= 5) {
          this._logger.err(`Error loading Model ${model} used to publish NodeMetrics: ${err}`)
        }

        await delay(backoffMs)
        attemptNum++
        if (backoffMs <= maxBackoffMs) {
          backoffMs *= 2
        }
      }
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

    if (!EnvironmentUtils.useRustCeramic() && !this.dispatcher.enableSync) {
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
   * Register new stream handler
   * @param streamHandler - Stream type handler
   */
  addStreamHandler<T extends Stream>(streamHandler: StreamHandler<T>): void {
    this._streamHandlers.add(streamHandler)
  }

  async nodeStatus(): Promise<NodeStatusResponse> {
    const anchor = {
      anchorServiceUrl: this.anchorService.url,
      ethereumRpcEndpoint: this.anchorService.validator.ethereumRpcEndpoint,
      chainId: this.anchorService.validator.chainId,
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
    opts: UpdateOpts = {}
  ): Promise<T> {
    if (this._readOnly) {
      throw new Error('Writes to streams are not supported in readOnly mode')
    }
    opts = { ...DEFAULT_APPLY_COMMIT_OPTS, ...opts, ...this._loadOptsOverride }
    const id = normalizeStreamID(streamId)

    this._logger.verbose(`Apply commit to stream ${id.toString()}`)
    try {
      const state$ = await this.repository.applyCommit(id, commit, opts)
      this._logger.verbose(`Applied commit to stream ${id.toString()}`)

      return streamFromState<T>(this, this._streamHandlers, state$.value, this.repository.updates$)
    } catch (err) {
      this._logger.err(`Error applying commit to stream ${streamId.toString()}: ${err}`)
      Metrics.count(ERROR_APPLYING_COMMIT, 1)
      NodeMetrics.recordError(ERROR_APPLYING_COMMIT)
      throw err
    }
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
    const state$ = await this.repository.createStreamFromGenesis(type, genesis, opts)
    const stream = streamFromState<T>(
      this,
      this._streamHandlers,
      state$.value,
      this.repository.updates$
    )
    this._logger.verbose(`Created stream ${stream.id.toString()} from state`)
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
      return streamFromState<T>(this, this._streamHandlers, snapshot$.value)
    } else if (opts.atTime) {
      const snapshot$ = await this.repository.loadAtTime(streamRef, opts)
      return streamFromState<T>(this, this._streamHandlers, snapshot$.value)
    } else {
      try {
        const base$ = await this.repository.load(streamRef.baseID, opts)
        return streamFromState<T>(this, this._streamHandlers, base$.value, this.repository.updates$)
      } catch (err) {
        this._logger.err(`Error loading stream ${streamId.toString()}: ${err}`)
        Metrics.count(ERROR_LOADING_STREAM, 1)
        NodeMetrics.recordError(ERROR_LOADING_STREAM)
        if (opts.sync != SyncOptions.SYNC_ON_ERROR) {
          throw err
        }

        this._logger.warn(
          `Error while loading stream ${streamRef.toString()} with SYNC_ON_ERROR flag. Resyncing stream. Error: ${err}`
        )

        // Retry with a full resync
        opts.sync = SyncOptions.SYNC_ALWAYS
        const base$ = await this.repository.load(streamRef.baseID, opts)
        return streamFromState<T>(this, this._streamHandlers, base$.value, this.repository.updates$)
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
   * @param opts
   */
  async _ensureGenesis(genesis: CeramicCommit, streamRef: StreamRef, opts: LoadOpts) {
    if (StreamUtils.isSignedCommitContainer(genesis) || StreamUtils.isSignedCommit(genesis)) {
      throw new Error('Given genesis commit is not deterministic')
    }

    const stream = await this.createStreamFromGenesis(streamRef.type, genesis, opts)
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
      await this._ensureGenesis(query.genesis, id, query.opts)
    }

    const index = {}
    const walkNext = async (node: TrieNode, streamId: StreamID | CommitID) => {
      const opts = query.opts ?? {}
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
        NodeMetrics.recordError(ERROR_LOADING_STREAM)
        return Promise.resolve()
      }
      const streamRef = opts.atTime ? CommitID.make(streamId.baseID, stream.tip) : streamId
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
  async multiQuery(
    queries: Array<MultiQuery>,
    timeout = DEFAULT_MULTIQUERY_TIMEOUT_MS
  ): Promise<Record<string, Stream>> {
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
    return streamFromState<T>(this, this._streamHandlers, state, this.repository.updates$)
  }

  /**
   * Close Ceramic instance gracefully
   */
  async close(): Promise<void> {
    this._logger.imp('Closing Ceramic instance')
    clearInterval(this._versionMetricInterval)
    await this.anchorService.close()
    this._shutdownSignal.abort()
    await this.syncApi.shutdown()
    await this.dispatcher.close()
    await this.repository.close()
    this._ipfsTopology.stop()
    await this._kvFactory.close()
    this._logger.imp('Ceramic instance closed successfully')
  }
}
