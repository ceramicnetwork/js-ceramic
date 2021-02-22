import Dispatcher from './dispatcher'
import Document from './document'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import DocID, { CommitID, DocRef } from '@ceramicnetwork/docid';
import {IpfsTopology} from "@ceramicnetwork/ipfs-topology";
import {
  Doctype,
  DoctypeHandler,
  DocOpts,
  Context,
  DoctypeUtils,
  DocParams,
  LoggerProviderOld,
  LoggerPlugin,
  LoggerPluginOptions,
  AnchorService,
  CeramicApi,
  CeramicCommit,
  DIDProvider,
  IpfsApi,
  PinApi,
  MultiQuery,
  PinningBackendStatic,
  AnchorStatus,
  LoggerProvider,
} from "@ceramicnetwork/common"
import { Resolver } from "did-resolver"

import { DID } from 'dids'
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile-handler"
import { Caip10LinkDoctypeHandler } from "@ceramicnetwork/doctype-caip10-link-handler"
import { DiagnosticsLogger, LogLevel } from "@ceramicnetwork/logger";
import { PinStoreFactory } from "./store/pin-store-factory";
import { PinStore } from "./store/pin-store";
import { PathTrie, TrieNode, promiseTimeout } from './utils'

import EthereumAnchorService from "./anchor/ethereum/ethereum-anchor-service"
import InMemoryAnchorService from "./anchor/memory/in-memory-anchor-service"

import { randomUint32 } from '@stablelib/random'
import { LocalPinApi } from './local-pin-api';
import { Repository } from './repository';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json')

const DEFAULT_DOC_CACHE_LIMIT = 500; // number of docs stored in the cache
const IPFS_GET_TIMEOUT = 60000 // 1 minute
const TESTING = process.env.NODE_ENV == 'test'

/**
 * Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStoreDirectory?: string;

  didResolver?: Resolver;

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
  didResolver: Resolver,
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
  validateDocs: boolean,
}


/**
 * Protocol options that are derived from the Ceramic network name (e.g. "mainnet", "testnet-clay", etc) specified
 */
interface CeramicNetworkOptions {
  name: string, // Must be one of the supported network names
  supportedChains: string[], // A list of CAIP-2 chainIds that are acceptable anchor proof locations
  pubsubTopic: string, // The topic that will be used for broadcasting protocol messages
}

const DEFAULT_NETWORK = 'inmemory'

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
  public readonly dispatcher: Dispatcher

  public pin: PinApi // Set during init()
  public pinStore: PinStore // Set during init()

  private readonly _doctypeHandlers: Record<string, DoctypeHandler<Doctype>>
  private readonly _repository: Repository
  private readonly _ipfsTopology: IpfsTopology
  private readonly _logger: DiagnosticsLogger
  private readonly _networkOptions: CeramicNetworkOptions
  private readonly _pinStoreFactory: PinStoreFactory
  private readonly _validateDocs: boolean

  constructor (modules: CeramicModules, params: CeramicParameters) {
    this._ipfsTopology = modules.ipfsTopology
    this._logger = modules.loggerProvider.getDiagnosticsLogger()
    this._pinStoreFactory = modules.pinStoreFactory
    this.dispatcher = modules.dispatcher

    this._validateDocs = params.validateDocs
    this._networkOptions = params.networkOptions

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(this)
    const resolver = new Resolver({
      ...modules.didResolver, ...threeIdResolver, ...keyDidResolver,
    })

    this.context = {
      api: this,
      anchorService: modules.anchorService,
      resolver,
      ipfs: modules.ipfs,
      loggerProvider: modules.loggerProvider,
    }
    this.context.anchorService.ceramic = this

    this._doctypeHandlers = {
      'tile': new TileDoctypeHandler(),
      'caip10-link': new Caip10LinkDoctypeHandler()
    }

    this._repository = modules.repository
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

  private static async _generateNetworkOptions(config: CeramicConfig, anchorService: AnchorService): Promise<CeramicNetworkOptions> {
    const networkName = config.networkName || DEFAULT_NETWORK

    if (config.pubsubTopic && (networkName !== "inmemory" && networkName !== "local")) {
      throw new Error("Specifying pub/sub topic is only supported for the 'inmemory' and 'local' networks")
    }

    let pubsubTopic
    let networkChains
    switch (networkName) {
      case "mainnet": {
        pubsubTopic = "/ceramic/mainnet"
        networkChains = ["eip155:1"] // Ethereum mainnet
        break
      }
      case "testnet-clay": {
        pubsubTopic = "/ceramic/testnet-clay"
        networkChains = ["eip155:3", "eip155:4"] // Ethereum Ropsten, Rinkeby
        break
      }
      case "dev-unstable": {
        pubsubTopic = "/ceramic/dev-unstable"
        networkChains = ["eip155:3", "eip155:4"] // Ethereum Ropsten, Rinkeby
        break
      }
      case "local": {
        // Default to a random pub/sub topic so that local deployments are isolated from each other
        // by default.  Allow specifying a specific pub/sub topic so that test deployments *can*
        // be made to talk to each other if needed.
        if (config.pubsubTopic) {
          pubsubTopic = config.pubsubTopic
        } else {
          const rand = randomUint32()
          pubsubTopic = "/ceramic/local-" + rand
        }
        networkChains = ["eip155:1337"] // Ganache
        break
      }
      case "inmemory": {
        // Default to a random pub/sub topic so that inmemory deployments are isolated from each other
        // by default.  Allow specifying a specific pub/sub topic so that test deployments *can*
        // be made to talk to each other if needed.
        if (config.pubsubTopic) {
          pubsubTopic = config.pubsubTopic
        } else {
          const rand = randomUint32()
          pubsubTopic = "/ceramic/inmemory-" + rand
        }
        networkChains = ["inmemory:12345"] // Our fake in-memory anchor service chainId
        break
      }
      default: {
        throw new Error("Unrecognized Ceramic network name: '" + networkName + "'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'")
      }
    }

    if (networkName == "mainnet") {
      throw new Error("Ceramic mainnet is not yet supported")
    }

    // Now that we know the set of supported chains for the specified network, get the actually
    // configured chainId from the anchorService and make sure it's valid.
    const anchorServiceChains = await anchorService.getSupportedChains()
    const usableChains = networkChains.filter(c => anchorServiceChains.includes(c))
    if (usableChains.length === 0) {
      throw new Error("No usable chainId for anchoring was found.  The ceramic network '" + networkName
          + "' supports the chains: ['" + networkChains.join("', '")
          + "'], but the configured anchor service '" + (config.anchorServiceURL ?? "inmemory")
          + "' only supports the chains: ['" + anchorServiceChains.join("', '") + "']")
    }

    return {name: networkName, pubsubTopic, supportedChains: usableChains}
  }

  /**
   * Parses the given `CeramicConfig` and generates the appropriate `CeramicParameters` and
   * `CeramicModules` from it. This usually should not be called directly - most users will prefer
   * to call `Ceramic.create()` instead which calls this internally.
   */
  static async _processConfig(ipfs: IpfsApi, config: CeramicConfig): Promise<[CeramicModules, CeramicParameters]> {
    // todo remove all code related to LoggerProviderOld
    LoggerProviderOld.init({
      level: config.loggerProvider?.config.logLevel <= LogLevel.debug ? 'debug' : 'silent',
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

    // Initialize ceramic loggers
    const loggerProvider = config.loggerProvider ?? new LoggerProvider()
    const logger = loggerProvider.getDiagnosticsLogger()
    const pubsubLogger = loggerProvider.makeServiceLogger("pubsub")

    logger.imp(`Starting Ceramic node at version ${packageJson.version} with config: \n${JSON.stringify(this._cleanupConfigForLogging(config), null, 2)}`)

    const anchorService = config.anchorServiceUrl ? new EthereumAnchorService(config) : new InMemoryAnchorService(config as any)
    await anchorService.init()

    const networkOptions = await Ceramic._generateNetworkOptions(config, anchorService)
    logger.imp(`Connecting to ceramic network '${networkOptions.name}' using pubsub topic '${networkOptions.pubsubTopic}' with supported anchor chains ['${networkOptions.supportedChains.join("','")}']`)

    const pinStoreOptions = {
      networkName: networkOptions.name,
      stateStoreDirectory: config.stateStoreDirectory,
      pinningEndpoints: config.ipfsPinningEndpoints,
      pinningBackends: config.pinningBackends,
    }

    const ipfsTopology = new IpfsTopology(ipfs, networkOptions.name, logger)
    const pinStoreFactory = new PinStoreFactory(ipfs, pinStoreOptions)
    const repository = new Repository()
    const dispatcher = new Dispatcher(ipfs, networkOptions.pubsubTopic, repository, logger, pubsubLogger)

    const params = {
      cacheDocumentCommits: config.cacheDocCommits ?? true,
      docCacheLimit: config.docCacheLimit ?? DEFAULT_DOC_CACHE_LIMIT,
      networkOptions,
      validateDocs: config.validateDocs ?? true,
    }

    const modules = {
      anchorService,
      didResolver: config.didResolver,
      dispatcher,
      ipfs,
      ipfsTopology,
      loggerProvider,
      pinStoreFactory,
      repository
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

    delete configCopy.didResolver
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
    this.pinStore = await this._pinStoreFactory.createPinStore()
    this.pin = new LocalPinApi(this.pinStore, this._loadDoc.bind(this), this._logger)

    if (doPeerDiscovery) {
      await this._ipfsTopology.start()
    }

    await this.dispatcher.init()

    if (restoreDocuments) {
      await this.restoreDocuments()
    }
  }

  /**
   * Set DID provider
   * @param provider - DID provider instance
   */
  async setDIDProvider (provider: DIDProvider): Promise<void> {
    this.context.provider = provider;
    this.context.did = new DID( { provider, resolver: this.context.resolver })

    if (!this.context.did.authenticated) {
      await this.context.did.authenticate()
    }
    this._logger.imp(`Now authenticated as DID ${this.context.did.id}`)
  }

  /**
   * Register new doctype handler
   * @param doctypeHandler - Document type handler
   */
  addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void {
    this._logger.debug(`Registered handler for ${doctypeHandler.name} doctype`)
    this._doctypeHandlers[doctypeHandler.name] = doctypeHandler
  }

  /**
   * Applies record on a given document
   * @param docId - Document ID
   * @param record - Record to be applied
   * @param opts - Initialization options
   * @deprecated See `applyCommit`
   */
  async applyRecord<T extends Doctype>(docId: DocID | string, record: CeramicCommit, opts?: DocOpts): Promise<T> {
    return this.applyCommit(docId, record, opts)
  }

  /**
   * Applies commit on a given document
   * @param docId - Document ID
   * @param commit - Commit to be applied
   * @param opts - Initialization options
   */
  async applyCommit<T extends Doctype>(docId: string | DocID, commit: CeramicCommit, opts?: DocOpts): Promise<T> {
    const doc = await this._loadDoc(normalizeDocID(docId), opts)
    await doc.applyCommit(commit, opts)
    return doc.doctype as T
  }

  /**
   * Get document from cache by DocID
   * @param docId - Document ID
   * @private
   */
  private _getDocFromCache(docId: DocID): Document {
    return this._docCache.get(docId) as Document
  }

  /**
   * Create doctype instance
   * @param doctype - Document type
   * @param params - Create parameters
   * @param opts - Initialization options
   */
  async createDocument<T extends Doctype>(doctype: string, params: DocParams, opts?: DocOpts): Promise<T> {
    const doc = await this._createDoc(doctype, params, opts)
    return doc.doctype as T
  }

  /**
   * Create document instance
   * @param doctype - Document type
   * @param params - Create parameters
   * @param opts - Initialization options
   * @private
   */
  async _createDoc(doctype: string, params: DocParams, opts: DocOpts = {}): Promise<Document> {
    const doctypeHandler = this._doctypeHandlers[doctype]

    const genesis = await doctypeHandler.doctype.makeGenesis(params, this.context, opts)
    const genesisCid = await this.dispatcher.storeCommit(genesis)
    const docId = new DocID(doctype, genesisCid)

    if (await this._repository.has(docId)) {
      this._logger.verbose(`Document ${docId.toString()} loaded from cache`)
      return this._repository.get(docId)
    } else {
      const document = await Document.create(docId, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
      // this.repository.add(document) TODO See Document#register, it adds to the repository too
      this._logger.verbose(`Document ${docId.toString()} successfully created`)
      return document
    }
  }

  /**
   * Creates doctype from genesis record
   * @param doctype - Document type
   * @param genesis - Genesis CID
   * @param opts - Initialization options
   */
  async createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts: DocOpts = {}): Promise<T> {
    const doc = await this._createDocFromGenesis(doctype, genesis, opts)
    this._logger.verbose(`Document ${doc.id.toString()} successfully created from genesis contents`)
    return doc.doctype as T
  }

  /**
   * Creates document from genesis record
   * @param doctype - Document type
   * @param genesis - Genesis record
   * @param opts - Initialization options
   * @private
   */
  async _createDocFromGenesis(doctype: string, genesis: any, opts: DocOpts = {}): Promise<Document> {
    const genesisCid = await this.dispatcher.storeCommit(genesis)
    const doctypeHandler = this._doctypeHandlers[doctype]
    if (!doctypeHandler) {
      throw new Error(doctype + " is not a valid doctype")
    }

    const docId = new DocID(doctype, genesisCid)

    if (await this._repository.has(docId)) {
      return this._repository.get(docId)
    } else {
      const document = await Document.create(docId, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
      // this.repository.add(document) TODO See Document#register, it adds to the repository too
      return document
    }
  }

  /**
   * Load document type instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async loadDocument<T extends Doctype>(docId: DocID | CommitID | string, opts: DocOpts = {}): Promise<T> {
    const doc = await this._loadDoc(docId, opts)
    this._logger.verbose(`Document ${docId.toString()} successfully loaded`)
    return doc.doctype as T
  }

  /**
   * Load all document type instance for given paths
   * @param id - Document ID (root)
   * @param paths - relative paths to documents to load
   * @param timeout - Timeout in milliseconds
   * @private
   */
  async _loadLinkedDocuments(id: DocID | string, paths: string[], timeout = 7000): Promise<Record<string, Doctype>> {
    id = normalizeDocID(id)
    const pathTrie = new PathTrie()
    paths.forEach(path => pathTrie.add(path))

    const index = {}

    const walkNext = async (node: TrieNode, docId: DocID) => {
      let doc
      try {
        doc = await promiseTimeout(timeout, this.loadDocument(docId))
      } catch (e) {
        return Promise.resolve()
      }
      index[docId.toString()] = doc

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
        return this._loadLinkedDocuments(query.docId, query.paths, timeout)
      } catch (e) {
        return Promise.resolve({})
      }
    })
    const results = await Promise.all(queryPromises)
    return results.reduce((acc, res) => ({ ...acc, ...res}), {})
  }

  /**
   * Load all document records by document ID
   * @param docId - Document ID
   * @deprecated See `loadDocumentCommits`
   */
  async loadDocumentRecords(docId: DocID | string): Promise<Array<Record<string, any>>> {
    return this.loadDocumentCommits(docId)
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
  async _loadDoc(docId: DocID | CommitID | string, opts: DocOpts = {}): Promise<Document> {
    const docRef = DocRef.from(docId)
    let doc: Document
    if (await this._repository.has(docRef.baseID)) {
      doc = await this._repository.get(docRef.baseID)
    } else {
      // Load the current version of the document
      const doctypeHandler = this._doctypeHandlers[docRef.typeName]
      if (!doctypeHandler) {
        throw new Error(docRef.typeName + " is not a valid doctype")
      }
      doc = await Document.load(docRef.baseID, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts)
      this._repository.add(doc)
    }

    // If DocID is requested, return the document
    if (docRef instanceof DocID) {
      return doc
    } else {
      // Here CommitID is requested, let's return document at specific commit
      return Document.loadAtCommit(docRef, doc)
    }
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported for anchoring
   * documents.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return this._networkOptions.supportedChains
  }

  /**
   * Load all the pinned documents, re-request PENDING or PROCESSING anchors.
   */
  async restoreDocuments() {
    const list = await this.pinStore.stateStore.list()
    const documents = await Promise.all(list.map(docId => this._loadDoc(docId)))
    documents.forEach(document => {
      const toRecover = document.state?.anchorStatus === AnchorStatus.PENDING || document.state?.anchorStatus === AnchorStatus.PROCESSING
      if (toRecover) {
        document.anchor()
      }
    })
    this._logger.verbose(`Successfully restored ${documents.length} pinned documents`)
  }

  /**
   * Close Ceramic instance gracefully
   */
  async close (): Promise<void> {
    this._logger.imp("Closing Ceramic instance")
    await this.pinStore.close()
    await this.dispatcher.close()
    this._ipfsTopology.stop()
    this._logger.imp("Ceramic instance closed successfully")
  }
}

export default Ceramic
