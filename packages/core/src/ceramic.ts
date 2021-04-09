import { Dispatcher } from './dispatcher'
import { DEFAULT_WRITE_DOCOPTS, DEFAULT_LOAD_DOCOPTS } from './state-management/state-manager';
import DocID, { CommitID, DocRef } from '@ceramicnetwork/docid';
import {IpfsTopology} from "@ceramicnetwork/ipfs-topology";
import {
  Doctype,
  DoctypeHandler,
  DocOpts,
  Context,
  DiagnosticsLogger,
  DoctypeUtils,
  LogLevel,
  LoggerProviderOld,
  LoggerPlugin,
  LoggerPluginOptions,
  AnchorService,
  CeramicApi,
  CeramicCommit,
  IpfsApi,
  PinApi,
  MultiQuery,
  PinningBackendStatic,
  LoggerProvider,
  Networks,
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

/**
 * Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStoreDirectory?: string;

  validateDocs?: boolean;
  ipfsPinningEndpoints?: string[];
  pinningBackends?: PinningBackendStatic[];

  loggerProvider?: LoggerProvider;
  logToFilesPlugin?: {
    plugin: LoggerPlugin;
    state: any;
    options: LoggerPluginOptions;
  };
  gateway?: boolean;

  networkName?: string;
  pubsubTopic?: string;

  docCacheLimit?: number;
  cacheDocCommits?: boolean; // adds 'docCacheLimit' additional cache entries if commits can be cached as well

  useCentralizedPeerDiscovery?: boolean;
  restoreDocuments?: boolean;

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
  cacheDocumentCommits: boolean,
  docCacheLimit: number,
  networkOptions: CeramicNetworkOptions,
  supportedChains: string[],
  validateDocs: boolean,
}


/**
 * Protocol options that are derived from the specified Ceramic network name (e.g. "mainnet", "testnet-clay", etc)
 */
interface CeramicNetworkOptions {
  name: string, // Must be one of the supported network names
  pubsubTopic: string, // The topic that will be used for broadcasting protocol messages
}

const DEFAULT_NETWORK = Networks.INMEMORY

const normalizeDocID = (docId: DocID | string): DocID => {
  const docRef = DocRef.from(docId)
  if (docRef instanceof DocID) {
    return docRef
  } else {
    throw new Error(`Not DocID: ${docRef}`)
  }
}

const tryDocId = (id: string): DocID | null => {
  try {
    return DocID.fromString(id)
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
  private readonly _validateDocs: boolean
  private readonly stateValidation: StateValidation

  constructor (modules: CeramicModules, params: CeramicParameters) {
    this._ipfsTopology = modules.ipfsTopology
    this.loggerProvider = modules.loggerProvider
    this._logger = modules.loggerProvider.getDiagnosticsLogger()
    this.repository = modules.repository
    this.pin = new LocalPinApi(this.repository, this._loadDoc.bind(this), this._logger)
    this.dispatcher = modules.dispatcher

    this._validateDocs = params.validateDocs
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
    this.stateValidation = this._validateDocs ? new RealStateValidation(this.loadDocument.bind(this)) : new FauxStateValidation()
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

    // todo remove all code related to LoggerProviderOld
    LoggerProviderOld.init({
      level: loggerProvider.config.logLevel <= LogLevel.debug ? 'debug' : 'silent',
      component: config.gateway? 'GATEWAY' : 'NODE',
    })

    if (config.logToFiles) {
      LoggerProviderOld.addPlugin(
        config.logToFilesPlugin.plugin,
        config.logToFilesPlugin.state,
        null,
        config.logToFilesPlugin.options
      )
    }

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

    const docCacheLimit = config.docCacheLimit ?? DEFAULT_DOC_CACHE_LIMIT

    const ipfsTopology = new IpfsTopology(ipfs, networkOptions.name, logger)
    const pinStoreFactory = new PinStoreFactory(ipfs, pinStoreOptions)
    const repository = new Repository(docCacheLimit, logger)
    const dispatcher = new Dispatcher(ipfs, networkOptions.pubsubTopic, repository, logger, pubsubLogger)

    const params = {
      cacheDocumentCommits: config.cacheDocCommits ?? true,
      docCacheLimit: docCacheLimit,
      networkOptions,
      supportedChains,
      validateDocs: config.validateDocs ?? true,
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
    delete configCopy.logToFilesPlugin
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
    const restoreDocuments = config.restoreDocuments ?? true

    await ceramic._init(doPeerDiscovery, restoreDocuments)

    return ceramic
  }

  /**
   * Finishes initialization and startup of a Ceramic instance. This usually should not be called
   * directly - most users will prefer to call `Ceramic.create()` instead which calls this internally.
   * @param doPeerDiscovery - Controls whether we connect to the "peerlist" to manually perform IPFS peer discovery
   * @param restoreDocuments - Controls whether we attempt to load pinned document state into memory at startup
   */
  async _init(doPeerDiscovery: boolean, restoreDocuments: boolean): Promise<void> {
    if (doPeerDiscovery) {
      await this._ipfsTopology.start()
    }

    if (restoreDocuments) {
      this.restoreDocuments()
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
  addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void {
    this._doctypeHandlers.add(doctypeHandler)
  }

  /**
   * Applies commit on a given document
   * @param docId - Document ID
   * @param commit - Commit to be applied
   * @param opts - Initialization options
   */
  async applyCommit<T extends Doctype>(docId: string | DocID, commit: CeramicCommit, opts?: DocOpts): Promise<T> {
    const state$ = await this._loadDoc(normalizeDocID(docId), opts)
    await this.repository.stateManager.applyCommit(state$, commit, opts)
    return doctypeFromState<T>(this.context, this._doctypeHandlers, state$.value, this.repository.updates$)
  }

  /**
   * Creates doctype from genesis record
   * @param doctype - Document type
   * @param genesis - Genesis CID
   * @param opts - Initialization options
   */
  async createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts: DocOpts = {}): Promise<T> {
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
  async _createDocFromGenesis(doctype: string, genesis: any, opts: DocOpts = {}): Promise<RunningState> {
    const genesisCid = await this.dispatcher.storeCommit(genesis);
    const docId = new DocID(doctype, genesisCid);
    return this.repository.load(docId, {...DEFAULT_WRITE_DOCOPTS, ...opts});
  }

  /**
   * Load document type instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async loadDocument<T extends Doctype>(docId: DocID | CommitID | string, opts: DocOpts = {}): Promise<T> {
    const docRef = DocRef.from(docId)
    const base$ = await this._loadDoc(docRef.baseID, opts)
    this._logger.verbose(`Document ${docId.toString()} successfully loaded`)
    if (docRef instanceof CommitID) {
      // Here CommitID is requested, let's return document at specific commit
      const snapshot$ = await this.repository.stateManager.rewind(base$, docRef)
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
  async _loadLinkedDocuments(query: MultiQuery, timeout = 7000): Promise<Record<string, Doctype>> {
    const id = DocRef.from(query.docId)
    const pathTrie = new PathTrie()
    query.paths?.forEach(path => pathTrie.add(path))

    const index = {}

    const walkNext = async (node: TrieNode, docId: DocID | CommitID) => {
      let doc
      try {
        doc = await promiseTimeout(timeout, this.loadDocument(docId, { atTime: query.atTime }))
      } catch (e) {
        return Promise.resolve()
      }
      const docRef = query.atTime ? docId.atCommit(doc.tip) : docId
      index[docRef.toString()] = doc

      const promiseList = Object.keys(node.children).map(key => {
        const keyDocId = doc.content[key] ? tryDocId(doc.content[key]) : null
        if (keyDocId) return walkNext(node.children[key], keyDocId)
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
  async multiQuery(queries: Array<MultiQuery>, timeout?: number):  Promise<Record<string, Doctype>> {
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
   * @param docId - Document ID
   */
  async loadDocumentCommits(docId: string | DocID): Promise<Record<string, any>[]> {
    const effectiveDocId = normalizeDocID(docId)
    const doc = await this.loadDocument(effectiveDocId)
    const { state } = doc

    const results = await Promise.all(state.log.map(async ({ cid }) => {
      const record = (await this.ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })).value
      return {
        cid: cid.toString(),
        value: await DoctypeUtils.convertCommitToSignedCommitContainer(record, this.ipfs)
      }
    }))
    this._logger.verbose(`Successfully loaded ${results.length} commits for document ${docId.toString()}`)
    return results
  }

  /**
   * Load document instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async _loadDoc(docId: DocID, opts: DocOpts = {}): Promise<RunningState> {
    return this.repository.load(docId, {...DEFAULT_LOAD_DOCOPTS, ...opts})
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported for anchoring
   * documents.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return this._supportedChains
  }

  /**
   * Load all the pinned documents, re-request PENDING or PROCESSING anchors.
   */
  restoreDocuments() {
    this.repository.listPinned().then(async list => {
      let n = 0
      await Promise.all(list.map(async docId => {
        await this._loadDoc(DocID.fromString(docId))
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
