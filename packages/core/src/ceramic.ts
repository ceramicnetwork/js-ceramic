import { Dispatcher } from './dispatcher'
import StreamID, { CommitID, StreamRef } from '@ceramicnetwork/streamid';
import {IpfsTopology} from "@ceramicnetwork/ipfs-topology";
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
} from "@ceramicnetwork/common"

import { DID } from 'dids'
import { PinStoreFactory } from "./store/pin-store-factory";
import { PathTrie, TrieNode, promiseTimeout } from './utils'

import EthereumAnchorService from "./anchor/ethereum/ethereum-anchor-service"
import InMemoryAnchorService from "./anchor/memory/in-memory-anchor-service"

import { randomUint32 } from '@stablelib/random'
import { LocalPinApi } from './local-pin-api';
import { Repository } from './state-management/repository';
import { HandlersMap } from './handlers-map';
import { FauxStateValidation, RealStateValidation, StateValidation } from './state-management/state-validation';
import { doctypeFromState } from './state-management/doctype-from-state';
import { ConflictResolution } from './conflict-resolution';
import { RunningState } from './state-management/running-state';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json')

const DEFAULT_DOC_CACHE_LIMIT = 500; // number of docs stored in the cache
const IPFS_GET_TIMEOUT = 60000 // 1 minute
const TESTING = process.env.NODE_ENV == 'test'

const DEFAULT_ANCHOR_SERVICE_URLS = {
  [Networks.MAINNET]: "https://cas.3boxlabs.com",
  [Networks.ELP]: "https://cas.3boxlabs.com",
  [Networks.TESTNET_CLAY]: "https://cas-clay.3boxlabs.com",
  [Networks.DEV_UNSTABLE]: "https://cas-dev.3boxlabs.com",
  [Networks.LOCAL]: "http://localhost:8081",
}

const DEFAULT_LOCAL_ETHEREUM_RPC = "http://localhost:7545" // default Ganache port

const SUPPORTED_CHAINS_BY_NETWORK = {
  [Networks.MAINNET]: ["eip155:1"], // Ethereum mainnet
  [Networks.ELP]: ["eip155:1"], // Ethereum mainnet
  [Networks.TESTNET_CLAY]: ["eip155:3", "eip155:4"], // Ethereum Ropsten, Rinkeby
  [Networks.DEV_UNSTABLE]: ["eip155:3", "eip155:4"], // Ethereum Ropsten, Rinkeby
  [Networks.LOCAL]: ["eip155:1337"], // Ganache
  [Networks.INMEMORY]: ["inmemory:12345"], // Our fake in-memory anchor service chainId
}

const DEFAULT_APPLY_COMMIT_OPTS = { anchor: true, publish: true, sync: SyncOptions.PREFER_CACHE }
const DEFAULT_CREATE_FROM_GENESIS_OPTS = { anchor: true, publish: true, sync: SyncOptions.PREFER_CACHE }
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE }

/**
 * Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStoreDirectory?: string;

  validateStreams?: boolean;
  ipfsPinningEndpoints?: string[];
  pinningBackends?: PinningBackendStatic[];

  loggerProvider?: LoggerProvider;
  gateway?: boolean;

  networkName?: string;
  pubsubTopic?: string;

  streamCacheLimit?: number;
  concurrentRequestsLimit?: number;

  useCentralizedPeerDiscovery?: boolean;
  restoreStreams?: boolean;

  [index: string]: any; // allow arbitrary properties
}

/**
 * Modules that Ceramic uses internally.
 * Most users will not provide this directly but will let it be derived automatically from the
 * `CeramicConfig` via `Ceramic.create()`.
 */
export interface CeramicModules {
  anchorService: AnchorService,
  dispatcher: Dispatcher,
  ipfs: IpfsApi,
  ipfsTopology: IpfsTopology,
  loggerProvider: LoggerProvider,
  pinStoreFactory: PinStoreFactory,
  repository: Repository
}

/**
 * Parameters that control internal Ceramic behavior.
 * Most users will not provide this directly but will let it be derived automatically from the
 * `CeramicConfig` via `Ceramic.create()`.
 */
export interface CeramicParameters {
  networkOptions: CeramicNetworkOptions,
  supportedChains: string[],
  validateStreams: boolean,
}


/**
 * Protocol options that are derived from the specified Ceramic network name (e.g. "mainnet", "testnet-clay", etc)
 */
interface CeramicNetworkOptions {
  name: string, // Must be one of the supported network names
  pubsubTopic: string, // The topic that will be used for broadcasting protocol messages
}

const DEFAULT_NETWORK = Networks.INMEMORY

const normalizeStreamID = (streamId: StreamID | string): StreamID => {
  const streamRef = StreamRef.from(streamId)
  if (streamRef instanceof StreamID) {
    return streamRef
  } else {
    throw new Error(`Not StreamID: ${streamRef}`)
  }
}

const tryStreamId = (id: string): StreamID | null => {
  try {
    return StreamID.fromString(id)
  } catch(e) {
    return null
  }
}

/**
 * ### Ceramic core implementation.<br/>
 *
 * To install this library:<br/>
 * `$ npm install --save @ceramicnetwork/core`
 */
class Ceramic implements CeramicApi {

  public readonly context: Context
  public readonly dispatcher: Dispatcher;
  public readonly loggerProvider: LoggerProvider;
  public readonly pin: PinApi;
  readonly repository: Repository;

  readonly _doctypeHandlers: HandlersMap
  private readonly _ipfsTopology: IpfsTopology
  private readonly _logger: DiagnosticsLogger
  private readonly _networkOptions: CeramicNetworkOptions
  private readonly _supportedChains: Array<string>
  private readonly _validateStreams: boolean
  private readonly stateValidation: StateValidation

  constructor (modules: CeramicModules, params: CeramicParameters) {
    this._ipfsTopology = modules.ipfsTopology
    this.loggerProvider = modules.loggerProvider
    this._logger = modules.loggerProvider.getDiagnosticsLogger()
    this.repository = modules.repository
    this.dispatcher = modules.dispatcher
    this.pin = this._buildPinApi()

    this._validateStreams = params.validateStreams
    this._networkOptions = params.networkOptions
    this._supportedChains = params.supportedChains

    this.context = {
      api: this,
      anchorService: modules.anchorService,
      ipfs: modules.ipfs,
      loggerProvider: modules.loggerProvider,
    }
    this.context.anchorService.ceramic = this

    this._doctypeHandlers = new HandlersMap(this._logger)

    // This initialization block below has to be redone.
    // Things below should be passed here as `modules` variable.
    this.stateValidation = this._validateStreams ? new RealStateValidation(this.loadDocument.bind(this)) : new FauxStateValidation()
    const conflictResolution = new ConflictResolution(modules.anchorService, this.stateValidation, this.dispatcher, this.context, this._doctypeHandlers)
    const pinStore = modules.pinStoreFactory.createPinStore()
    this.repository.setDeps({
      dispatcher: this.dispatcher,
      pinStore: pinStore,
      context: this.context,
      handlers: this._doctypeHandlers,
      anchorService: modules.anchorService,
      conflictResolution: conflictResolution,
      stateValidation: this.stateValidation
    });
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

  private _buildPinApi(): PinApi {
    const boundDocLoader = this._loadDoc.bind(this)
    const loaderWithSyncSet = (streamid) => { return boundDocLoader(streamid, { sync: true })}
    return new LocalPinApi(this.repository, loaderWithSyncSet, this._logger)
  }

  private static _generateNetworkOptions(config: CeramicConfig): CeramicNetworkOptions {
    const networkName = config.networkName || DEFAULT_NETWORK

    if (config.pubsubTopic && (networkName !== Networks.INMEMORY && networkName !== Networks.LOCAL)) {
      throw new Error("Specifying pub/sub topic is only supported for the 'inmemory' and 'local' networks")
    }

    let pubsubTopic
    switch (networkName) {
      case Networks.MAINNET: {
        pubsubTopic = "/ceramic/mainnet"
        break
      }
      case Networks.ELP: {
        pubsubTopic = "/ceramic/mainnet"
        break
      }
      case Networks.TESTNET_CLAY: {
        pubsubTopic = "/ceramic/testnet-clay"
        break
      }
      case Networks.DEV_UNSTABLE: {
        pubsubTopic = "/ceramic/dev-unstable"
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
          pubsubTopic = "/ceramic/local-" + rand
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
          pubsubTopic = "/ceramic/inmemory-" + rand
        }
        break
      }
      default: {
        throw new Error("Unrecognized Ceramic network name: '" + networkName + "'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'")
      }
    }

    if (networkName == Networks.MAINNET) {
      throw new Error("Ceramic mainnet is not yet supported")
    }

    return {name: networkName, pubsubTopic}
  }

  /**
   * Given the ceramic network we are running on and the anchor service we are connected to, figure
   * out the set of caip2 chain IDs that are supported for document anchoring
   * @param networkName
   * @param anchorService
   * @private
   */
  private static async _loadSupportedChains(networkName: string, anchorService: AnchorService): Promise<Array<string>> {
    const networkChains = SUPPORTED_CHAINS_BY_NETWORK[networkName]

    // Now that we know the set of supported chains for the specified network, get the actually
    // configured chainId from the anchorService and make sure it's valid.
    const anchorServiceChains = await anchorService.getSupportedChains()
    const usableChains = networkChains.filter(c => anchorServiceChains.includes(c))
    if (usableChains.length === 0) {
      throw new Error("No usable chainId for anchoring was found.  The ceramic network '" + networkName
        + "' supports the chains: ['" + networkChains.join("', '")
        + "'], but the configured anchor service '" + anchorService.url
        + "' only supports the chains: ['" + anchorServiceChains.join("', '") + "']")
    }

    return usableChains
  }

  /**
   * Parses the given `CeramicConfig` and generates the appropriate `CeramicParameters` and
   * `CeramicModules` from it. This usually should not be called directly - most users will prefer
   * to call `Ceramic.create()` instead which calls this internally.
   */
  static async _processConfig(ipfs: IpfsApi, config: CeramicConfig): Promise<[CeramicModules, CeramicParameters]> {
    // Initialize ceramic loggers
    const loggerProvider = config.loggerProvider ?? new LoggerProvider()
    const logger = loggerProvider.getDiagnosticsLogger()
    const pubsubLogger = loggerProvider.makeServiceLogger("pubsub")

    logger.imp(`Starting Ceramic node at version ${packageJson.version} with config: \n${JSON.stringify(this._cleanupConfigForLogging(config), null, 2)}`)

    const networkOptions = Ceramic._generateNetworkOptions(config)

    const anchorServiceUrl = config.anchorServiceUrl || DEFAULT_ANCHOR_SERVICE_URLS[networkOptions.name]
    let ethereumRpcUrl = config.ethereumRpcUrl
    if (!ethereumRpcUrl && networkOptions.name == Networks.LOCAL) {
      ethereumRpcUrl = DEFAULT_LOCAL_ETHEREUM_RPC
    }
    const anchorService = networkOptions.name != Networks.INMEMORY ? new EthereumAnchorService(anchorServiceUrl, ethereumRpcUrl) : new InMemoryAnchorService(config as any)
    await anchorService.init()

    const supportedChains = await Ceramic._loadSupportedChains(networkOptions.name, anchorService)

    logger.imp(`Connecting to ceramic network '${networkOptions.name}' using pubsub topic '${networkOptions.pubsubTopic}' and connecting to anchor service '${anchorService.url}' with supported anchor chains ['${supportedChains.join("','")}']`)

    const pinStoreOptions = {
      networkName: networkOptions.name,
      stateStoreDirectory: config.stateStoreDirectory,
      pinningEndpoints: config.ipfsPinningEndpoints,
      pinningBackends: config.pinningBackends,
    }

    const streamCacheLimit = config.streamCacheLimit ?? DEFAULT_DOC_CACHE_LIMIT
    const concurrentRequestsLimit = config.concurrentRequestsLimit ?? streamCacheLimit

    const ipfsTopology = new IpfsTopology(ipfs, networkOptions.name, logger)
    const pinStoreFactory = new PinStoreFactory(ipfs, pinStoreOptions)
    const repository = new Repository(streamCacheLimit, concurrentRequestsLimit, logger)
    const dispatcher = new Dispatcher(ipfs, networkOptions.pubsubTopic, repository, logger, pubsubLogger)

    const params: CeramicParameters = {
      networkOptions,
      supportedChains,
      validateStreams: config.validateStreams ?? true,
    }

    const modules = {
      anchorService,
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
   * Takes a CeramicConfig and returns an object that can be logged containing the relevant
   * properties of the config, but with complex objects removed or replaced with strings or
   * simple objects containing their relevant pieces.
   *
   * @param config
   */
  static _cleanupConfigForLogging(config: CeramicConfig) : Record<string, any> {
    const configCopy = {...config}

    const loggerConfig = config.loggerProvider?.config

    delete configCopy.pinningBackends
    delete configCopy.loggerProvider

    if (loggerConfig) {
      configCopy.loggerConfig = loggerConfig
    }

    return configCopy
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
    const restoreStreams = config.restoreStreams ?? true

    await ceramic._init(doPeerDiscovery, restoreStreams)

    return ceramic
  }

  /**
   * Finishes initialization and startup of a Ceramic instance. This usually should not be called
   * directly - most users will prefer to call `Ceramic.create()` instead which calls this internally.
   * @param doPeerDiscovery - Controls whether we connect to the "peerlist" to manually perform IPFS peer discovery
   * @param restoreStreams - Controls whether we attempt to load pinned stream state into memory at startup
   */
  async _init(doPeerDiscovery: boolean, restoreStreams: boolean): Promise<void> {
    if (doPeerDiscovery) {
      await this._ipfsTopology.start()
    }

    if (restoreStreams) {
      this.restoreStreams()
    }
  }

  /**
   * Sets the DID instance that will be used to author commits to documents. The DID instance
   * also includes the DID Resolver that will be used to verify commits from others.
   * @param did
   */
  async setDID(did: DID): Promise<void> {
    this.context.did = did
  }

  /**
   * Register new doctype handler
   * @param doctypeHandler - Document type handler
   */
  addStreamHandler<T extends Stream>(doctypeHandler: StreamHandler<T>): void {
    this._doctypeHandlers.add(doctypeHandler)
  }

  /**
   * Applies commit on a given document
   * @param streamId - Document ID
   * @param commit - Commit to be applied
   * @param opts - Initialization options
   */
  async applyCommit<T extends Stream>(streamId: string | StreamID, commit: CeramicCommit, opts: CreateOpts | UpdateOpts = {}): Promise<T> {
    opts = { ...DEFAULT_APPLY_COMMIT_OPTS, ...opts };
    const state$ = await this.repository.stateManager.applyCommit(normalizeStreamID(streamId), commit, opts as CreateOpts)
    return doctypeFromState<T>(this.context, this._doctypeHandlers, state$.value, this.repository.updates$)
  }

  /**
   * Creates doctype from genesis record
   * @param doctype - Document type
   * @param genesis - Genesis CID
   * @param opts - Initialization options
   */
  async createDocumentFromGenesis<T extends Stream>(doctype: string, genesis: any, opts: CreateOpts = {}): Promise<T> {
    opts = { ...DEFAULT_CREATE_FROM_GENESIS_OPTS, ...opts };
    const state$ = await this._createDocFromGenesis(doctype, genesis, opts)
    return doctypeFromState<T>(this.context, this._doctypeHandlers, state$.value, this.repository.updates$)
  }

  /**
   * Creates document from genesis record
   * @param doctype - Document type
   * @param genesis - Genesis record
   * @param opts - Initialization options
   * @private
   */
  async _createDocFromGenesis(doctype: string, genesis: any, opts: CreateOpts): Promise<RunningState> {
    const genesisCid = await this.dispatcher.storeCommit(genesis);
    const streamId = new StreamID(doctype, genesisCid);
    return this.repository.applyCreateOpts(streamId, opts);
  }

  /**
   * Load document type instance
   * @param streamId - Document ID
   * @param opts - Initialization options
   */
  async loadDocument<T extends Stream>(streamId: StreamID | CommitID | string, opts: LoadOpts = {}): Promise<T> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts };
    const streamRef = StreamRef.from(streamId)
    const base$ = await this._loadDoc(streamRef.baseID, opts)
    this._logger.verbose(`Document ${streamId.toString()} successfully loaded`)
    if (streamRef instanceof CommitID) {
      // Here CommitID is requested, let's return document at specific commit
      const snapshot$ = await this.repository.stateManager.rewind(base$, streamRef)
      return doctypeFromState<T>(this.context, this._doctypeHandlers, snapshot$.value)
    } else if (opts.atTime) {
      const snapshot$ = await this.repository.stateManager.atTime(base$, opts.atTime)
      return doctypeFromState<T>(this.context, this._doctypeHandlers, snapshot$.value)
    } else {
      return doctypeFromState<T>(this.context, this._doctypeHandlers, base$.value, this.repository.updates$)
    }
  }

  /**
   * Load all document type instance for given paths
   * @param query
   * @param timeout - Timeout in milliseconds
   * @private
   */
  async _loadLinkedDocuments(query: MultiQuery, timeout = 7000): Promise<Record<string, Stream>> {
    const id = StreamRef.from(query.streamId)
    const pathTrie = new PathTrie()
    query.paths?.forEach(path => pathTrie.add(path))

    const index = {}

    const walkNext = async (node: TrieNode, streamId: StreamID | CommitID) => {
      let doc
      try {
        doc = await promiseTimeout(timeout, this.loadDocument(streamId, { atTime: query.atTime }))
      } catch (e) {
        return Promise.resolve()
      }
      const streamRef = query.atTime ? streamId.atCommit(doc.tip) : streamId
      index[streamRef.toString()] = doc

      const promiseList = Object.keys(node.children).map(key => {
        const keyStreamId = doc.content[key] ? tryStreamId(doc.content[key]) : null
        if (keyStreamId) return walkNext(node.children[key], keyStreamId)
        return Promise.resolve()
      })

      await Promise.all(promiseList)
    }

    await walkNext(pathTrie.root, id)

    return index
  }

  /**
   * Load all document types instances for given multiqueries
   * @param queries - Array of MultiQueries
   * @param timeout - Timeout in milliseconds
   */
  async multiQuery(queries: Array<MultiQuery>, timeout?: number):  Promise<Record<string, Stream>> {
    const queryPromises = queries.map(query => {
      try {
        return this._loadLinkedDocuments(query, timeout)
      } catch (e) {
        return Promise.resolve({})
      }
    })
    const results = await Promise.all(queryPromises)
    return results.reduce((acc, res) => ({ ...acc, ...res}), {})
  }

  /**
   * Load all document commits by document ID
   * @param streamId - Document ID
   */
  async loadDocumentCommits(streamId: string | StreamID): Promise<Record<string, any>[]> {
    const effectiveStreamId = normalizeStreamID(streamId)
    const doc = await this.loadDocument(effectiveStreamId)
    const { state } = doc

    const results = await Promise.all(state.log.map(async ({ cid }) => {
      const record = (await this.ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })).value
      return {
        cid: cid.toString(),
        value: await StreamUtils.convertCommitToSignedCommitContainer(record, this.ipfs)
      }
    }))
    this._logger.verbose(`Successfully loaded ${results.length} commits for document ${streamId.toString()}`)
    return results
  }

  /**
   * Load document instance
   * @param streamId - Document ID
   * @param opts - Initialization options
   */
  async _loadDoc(streamId: StreamID, opts: LoadOpts): Promise<RunningState> {
    return this.repository.load(streamId, opts)
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported for anchoring
   * documents.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return this._supportedChains
  }

  /**
   * Load all the pinned streams, re-request PENDING or PROCESSING anchors.
   */
  restoreStreams() {
    this.repository.listPinned().then(async list => {
      let n = 0
      await Promise.all(list.map(async streamId => {
        await this._loadDoc(StreamID.fromString(streamId), { sync: SyncOptions.SYNC_ALWAYS })
        n++;
      }))
      this._logger.verbose(`Successfully restored ${n} pinned documents`)
    }).catch(error => {
      this._logger.err(error)
    })
  }

  /**
   * Close Ceramic instance gracefully
   */
  async close (): Promise<void> {
    this._logger.imp("Closing Ceramic instance")
    await this.dispatcher.close()
    await this.repository.close()
    this._ipfsTopology.stop()
    this._logger.imp("Ceramic instance closed successfully")
  }
}

export default Ceramic
