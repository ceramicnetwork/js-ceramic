import { Dispatcher } from './dispatcher'
import StreamID, { CommitID, StreamRef } from '@ceramicnetwork/streamid'
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
  PinApi,
  MultiQuery,
  PinningBackendStatic,
  LoggerProvider,
  Networks,
  UpdateOpts,
  SyncOptions,
  AnchorValidator,
  AnchorStatus,
} from '@ceramicnetwork/common'

import { DID } from 'dids'
import { PinStoreFactory } from './store/pin-store-factory'
import { PathTrie, TrieNode, promiseTimeout } from './utils'

import EthereumAnchorService from './anchor/ethereum/ethereum-anchor-service'
import InMemoryAnchorService from './anchor/memory/in-memory-anchor-service'

import { randomUint32 } from '@stablelib/random'
import { LocalPinApi } from './local-pin-api'
import { Repository } from './state-management/repository'
import { HandlersMap } from './handlers-map'
import {
  FauxStateValidation,
  RealStateValidation,
  StateValidation,
} from './state-management/state-validation'
import { streamFromState } from './state-management/stream-from-state'
import { ConflictResolution } from './conflict-resolution'
import EthereumAnchorValidator from './anchor/ethereum/ethereum-anchor-validator'

const DEFAULT_CACHE_LIMIT = 500 // number of streams stored in the cache
const IPFS_GET_TIMEOUT = 60000 // 1 minute
const TESTING = process.env.NODE_ENV == 'test'

const TRAILING_SLASH = /\/$/ // slash at the end of the string

const DEFAULT_ANCHOR_SERVICE_URLS = {
  [Networks.MAINNET]: 'https://cas.3boxlabs.com',
  [Networks.ELP]: 'https://cas.3boxlabs.com',
  [Networks.TESTNET_CLAY]: 'https://cas-clay.3boxlabs.com',
  [Networks.DEV_UNSTABLE]: 'https://cas-dev.3boxlabs.com',
  [Networks.LOCAL]: 'http://localhost:8081',
}

const DEFAULT_LOCAL_ETHEREUM_RPC = 'http://localhost:7545' // default Ganache port

const SUPPORTED_CHAINS_BY_NETWORK = {
  [Networks.MAINNET]: ['eip155:1'], // Ethereum mainnet
  [Networks.ELP]: ['eip155:1'], // Ethereum mainnet
  [Networks.TESTNET_CLAY]: ['eip155:3', 'eip155:4'], // Ethereum Ropsten, Rinkeby
  [Networks.DEV_UNSTABLE]: ['eip155:3', 'eip155:4'], // Ethereum Ropsten, Rinkeby
  [Networks.LOCAL]: ['eip155:1337'], // Ganache
  [Networks.INMEMORY]: ['inmemory:12345'], // Our fake in-memory anchor service chainId
}

const DEFAULT_APPLY_COMMIT_OPTS = { anchor: true, publish: true, sync: SyncOptions.PREFER_CACHE }
const DEFAULT_CREATE_FROM_GENESIS_OPTS = {
  anchor: true,
  publish: true,
  sync: SyncOptions.PREFER_CACHE,
}
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }

/**
 * Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string
  anchorServiceUrl?: string
  stateStoreDirectory?: string

  validateStreams?: boolean
  ipfsPinningEndpoints?: string[]
  pinningBackends?: PinningBackendStatic[]

  loggerProvider?: LoggerProvider
  gateway?: boolean

  networkName?: string
  pubsubTopic?: string

  streamCacheLimit?: number
  concurrentRequestsLimit?: number

  useCentralizedPeerDiscovery?: boolean
  syncOverride?: SyncOptions

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
}

/**
 * Parameters that control internal Ceramic behavior.
 * Most users will not provide this directly but will let it be derived automatically from the
 * `CeramicConfig` via `Ceramic.create()`.
 */
export interface CeramicParameters {
  gateway: boolean
  networkOptions: CeramicNetworkOptions
  validateStreams: boolean
  loadOptsOverride: LoadOpts
}

/**
 * Protocol options that are derived from the specified Ceramic network name (e.g. "mainnet", "testnet-clay", etc)
 */
interface CeramicNetworkOptions {
  name: string // Must be one of the supported network names
  pubsubTopic: string // The topic that will be used for broadcasting protocol messages
}

const DEFAULT_NETWORK = Networks.INMEMORY

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
  public readonly pin: PinApi
  readonly repository: Repository

  readonly _streamHandlers: HandlersMap
  private readonly _anchorValidator: AnchorValidator
  private readonly _gateway: boolean
  private readonly _ipfsTopology: IpfsTopology
  private readonly _logger: DiagnosticsLogger
  private readonly _networkOptions: CeramicNetworkOptions
  private _supportedChains: Array<string>
  private readonly _validateStreams: boolean
  private readonly stateValidation: StateValidation
  private readonly _loadOptsOverride: LoadOpts

  constructor(modules: CeramicModules, params: CeramicParameters) {
    this._ipfsTopology = modules.ipfsTopology
    this.loggerProvider = modules.loggerProvider
    this._logger = modules.loggerProvider.getDiagnosticsLogger()
    this.repository = modules.repository
    this.dispatcher = modules.dispatcher
    this.pin = this._buildPinApi()
    this._anchorValidator = modules.anchorValidator

    this._gateway = params.gateway
    this._networkOptions = params.networkOptions
    this._validateStreams = params.validateStreams
    this._loadOptsOverride = params.loadOptsOverride

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
    this.stateValidation = this._validateStreams
      ? new RealStateValidation(this.loadStream.bind(this))
      : new FauxStateValidation()
    const conflictResolution = new ConflictResolution(
      modules.anchorValidator,
      this.stateValidation,
      this.dispatcher,
      this.context,
      this._streamHandlers
    )
    const pinStore = modules.pinStoreFactory.createPinStore()
    this.repository.setDeps({
      dispatcher: this.dispatcher,
      pinStore: pinStore,
      context: this.context,
      handlers: this._streamHandlers,
      anchorService: modules.anchorService,
      conflictResolution: conflictResolution,
      stateValidation: this.stateValidation,
    })
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

  private _buildPinApi(): PinApi {
    return new LocalPinApi(this.repository, this._logger)
  }

  private static _generateNetworkOptions(config: CeramicConfig): CeramicNetworkOptions {
    const networkName = config.networkName || DEFAULT_NETWORK

    if (config.pubsubTopic && networkName !== Networks.INMEMORY && networkName !== Networks.LOCAL) {
      throw new Error(
        "Specifying pub/sub topic is only supported for the 'inmemory' and 'local' networks"
      )
    }

    let pubsubTopic
    switch (networkName) {
      case Networks.MAINNET: {
        pubsubTopic = '/ceramic/mainnet'
        break
      }
      case Networks.ELP: {
        pubsubTopic = '/ceramic/mainnet'
        break
      }
      case Networks.TESTNET_CLAY: {
        pubsubTopic = '/ceramic/testnet-clay'
        break
      }
      case Networks.DEV_UNSTABLE: {
        pubsubTopic = '/ceramic/dev-unstable'
        break
      }
      case Networks.LOCAL: {
        // Default to a random pub/sub topic so that local deployments are isolated from each other
        // by default.  Allow specifying a specific pub/sub topic so that test deployments *can*
        // be made to talk to each other if needed.
        if (config.pubsubTopic) {
          pubsubTopic = config.pubsubTopic
        } else {
          const rand = randomUint32()
          pubsubTopic = '/ceramic/local-' + rand
        }
        break
      }
      case Networks.INMEMORY: {
        // Default to a random pub/sub topic so that inmemory deployments are isolated from each other
        // by default.  Allow specifying a specific pub/sub topic so that test deployments *can*
        // be made to talk to each other if needed.
        if (config.pubsubTopic) {
          pubsubTopic = config.pubsubTopic
        } else {
          const rand = randomUint32()
          pubsubTopic = '/ceramic/inmemory-' + rand
        }
        break
      }
      default: {
        throw new Error(
          "Unrecognized Ceramic network name: '" +
            networkName +
            "'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'"
        )
      }
    }

    if (networkName == Networks.MAINNET) {
      throw new Error('Ceramic mainnet is not yet supported')
    }

    return { name: networkName, pubsubTopic }
  }

  /**
   * Given the ceramic network we are running on and the anchor service we are connected to, figure
   * out the set of caip2 chain IDs that are supported for stream anchoring
   * @private
   */
  private async _loadSupportedChains(): Promise<void> {
    const networkName = this._networkOptions.name
    const anchorService = this.context.anchorService
    const networkChains = SUPPORTED_CHAINS_BY_NETWORK[networkName]

    // Now that we know the set of supported chains for the specified network, get the actually
    // configured chainId from the anchorService and make sure it's valid.
    const anchorServiceChains = await anchorService.getSupportedChains()
    const usableChains = networkChains.filter((c) => anchorServiceChains.includes(c))
    if (usableChains.length === 0) {
      throw new Error(
        "No usable chainId for anchoring was found.  The ceramic network '" +
          networkName +
          "' supports the chains: ['" +
          networkChains.join("', '") +
          "'], but the configured anchor service '" +
          anchorService.url +
          "' only supports the chains: ['" +
          anchorServiceChains.join("', '") +
          "']"
      )
    }

    this._supportedChains = usableChains
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

    const networkOptions = Ceramic._generateNetworkOptions(config)

    let anchorService = null
    if (!config.gateway) {
      const anchorServiceUrl =
        config.anchorServiceUrl?.replace(TRAILING_SLASH, '') ||
        DEFAULT_ANCHOR_SERVICE_URLS[networkOptions.name]

      if (
        (networkOptions.name == Networks.MAINNET || networkOptions.name == Networks.ELP) &&
        anchorServiceUrl !== 'https://cas-internal.3boxlabs.com' &&
        anchorServiceUrl !== DEFAULT_ANCHOR_SERVICE_URLS[networkOptions.name]
      ) {
        throw new Error('Cannot use custom anchor service on Ceramic mainnet')
      }
      anchorService =
        networkOptions.name != Networks.INMEMORY
          ? new EthereumAnchorService(anchorServiceUrl, logger)
          : new InMemoryAnchorService(config as any)
    }

    let ethereumRpcUrl = config.ethereumRpcUrl
    if (!ethereumRpcUrl && networkOptions.name == Networks.LOCAL) {
      ethereumRpcUrl = DEFAULT_LOCAL_ETHEREUM_RPC
    }
    let anchorValidator
    if (networkOptions.name == Networks.INMEMORY) {
      // Just use the InMemoryAnchorService as the AnchorValidator
      anchorValidator = anchorService
    } else {
      anchorValidator = new EthereumAnchorValidator(ethereumRpcUrl, logger)
    }

    const pinStoreOptions = {
      networkName: networkOptions.name,
      stateStoreDirectory: config.stateStoreDirectory,
      pinningEndpoints: config.ipfsPinningEndpoints,
      pinningBackends: config.pinningBackends,
    }

    const loadOptsOverride = config.syncOverride ? { sync: config.syncOverride } : {}

    const streamCacheLimit = config.streamCacheLimit ?? DEFAULT_CACHE_LIMIT
    const concurrentRequestsLimit = config.concurrentRequestsLimit ?? streamCacheLimit

    const ipfsTopology = new IpfsTopology(ipfs, networkOptions.name, logger)
    const pinStoreFactory = new PinStoreFactory(ipfs, pinStoreOptions)
    const repository = new Repository(streamCacheLimit, concurrentRequestsLimit, logger)
    const dispatcher = new Dispatcher(
      ipfs,
      networkOptions.pubsubTopic,
      repository,
      logger,
      pubsubLogger
    )

    const params: CeramicParameters = {
      gateway: config.gateway,
      networkOptions,
      validateStreams: config.validateStreams ?? true,
      loadOptsOverride,
    }

    const modules = {
      anchorService,
      anchorValidator,
      dispatcher,
      ipfs,
      ipfsTopology,
      loggerProvider,
      pinStoreFactory,
      repository,
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

    let doPeerDiscovery = config.useCentralizedPeerDiscovery ?? !TESTING
    if (process.env.DISABLE_PEER_DISCOVERY) {
      console.log('DISABLING PEER DISCOVERY from ceramic core')
      doPeerDiscovery = false
    }

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

      if (doPeerDiscovery) {
        await this._ipfsTopology.start()
      }

      if (!this._gateway) {
        await this.context.anchorService.init()
        await this._loadSupportedChains()
        this._logger.imp(
          `Connected to anchor service '${
            this.context.anchorService.url
          }' with supported anchor chains ['${this._supportedChains.join("','")}']`
        )
      }

      await this._anchorValidator.init(this._supportedChains ? this._supportedChains[0] : null)
    } catch (err) {
      await this.close()
      throw err
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

    opts = { ...DEFAULT_APPLY_COMMIT_OPTS, ...opts, ...this._loadOptsOverride }
    const state$ = await this.repository.applyCommit(
      normalizeStreamID(streamId),
      commit,
      opts as CreateOpts
    )
    return streamFromState<T>(
      this.context,
      this._streamHandlers,
      state$.value,
      this.repository.updates$
    )
  }

  /**
   * Requests an anchor for the given StreamID if the Stream isn't already anchored.
   * Returns the new AnchorStatus for the Stream.
   * @param streamId
   * @param opts used to load the current Stream state
   */
  async requestAnchor(streamId: string | StreamID, opts: LoadOpts = {}): Promise<AnchorStatus> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts, ...this._loadOptsOverride }
    const effectiveStreamId = normalizeStreamID(streamId)
    const state = await this.repository.load(effectiveStreamId, opts)
    await this.repository.stateManager.anchor(state)
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
    const state$ = await this.repository.applyCreateOpts(streamId, opts)
    return streamFromState<T>(
      this.context,
      this._streamHandlers,
      state$.value,
      this.repository.updates$
    )
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
      const base$ = await this.repository.load(streamRef.baseID, opts)
      return streamFromState<T>(
        this.context,
        this._streamHandlers,
        base$.value,
        this.repository.updates$
      )
    }
  }

  /**
   * Load all stream type instance for given paths
   * @param query
   * @param timeout - Timeout in milliseconds
   * @private
   */
  async _loadLinkedStreams(query: MultiQuery, timeout = 7000): Promise<Record<string, Stream>> {
    const id = StreamRef.from(query.streamId)
    const pathTrie = new PathTrie()
    query.paths?.forEach((path) => pathTrie.add(path))

    const index = {}

    const walkNext = async (node: TrieNode, streamId: StreamID | CommitID) => {
      let stream
      if (query.genesis) {
        if (
          StreamUtils.isSignedCommitContainer(query.genesis) ||
          StreamUtils.isSignedCommit(query.genesis)
        ) {
          throw new Error('Given genesis commit is not deterministic')
        }

        const genesisCID = await this.ipfs.dag.put(query.genesis)
        if (!streamId.cid.equals(genesisCID)) {
          throw new Error('Given StreamID CID does not match given genesis content')
        }
      }
      try {
        stream = await promiseTimeout(timeout, this.loadStream(streamId, { atTime: query.atTime }))
      } catch (e) {
        return Promise.resolve()
      }
      const streamRef = query.atTime ? streamId.atCommit(stream.tip) : streamId
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
  async multiQuery(queries: Array<MultiQuery>, timeout?: number): Promise<Record<string, Stream>> {
    const queryResults = await Promise.all(
      queries.map((query) => {
        try {
          return this._loadLinkedStreams(query, timeout)
        } catch (e) {
          return Promise.resolve({})
        }
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
        const commit = await this.dispatcher.retrieveCommit(cid)
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
   * Close Ceramic instance gracefully
   */
  async close(): Promise<void> {
    this._logger.imp('Closing Ceramic instance')
    await this.dispatcher.close()
    await this.repository.close()
    this._ipfsTopology.stop()
    this._logger.imp('Ceramic instance closed successfully')
  }
}

export default Ceramic
