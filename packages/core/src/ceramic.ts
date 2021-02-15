import Dispatcher from './dispatcher'
import Document from './document'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import DocID from '@ceramicnetwork/docid'
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
  DocCache,
  AnchorStatus,
  LoggerProvider,
} from "@ceramicnetwork/common"
import { Resolver } from "did-resolver"

import { DID } from 'dids'
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile-handler"
import { Caip10LinkDoctypeHandler } from "@ceramicnetwork/doctype-caip10-link-handler"
import { DiagnosticsLogger } from "@ceramicnetwork/logger";
import { PinStoreFactory } from "./store/pin-store-factory";
import { PinStore } from "./store/pin-store";
import { PathTrie, TrieNode, promiseTimeout } from './utils'

import EthereumAnchorService from "./anchor/ethereum/ethereum-anchor-service"
import InMemoryAnchorService from "./anchor/memory/in-memory-anchor-service"

import { randomUint32 } from '@stablelib/random'
import { LocalPinApi } from './local-pin-api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json')

const DEFAULT_DOC_CACHE_LIMIT = 500; // number of docs stored in the cache
const IPFS_GET_TIMEOUT = 60000 // 1 minute
const TESTING = process.env.NODE_ENV == 'test'

/**
 * Ceramic configuration parameters
 */
export interface CeramicParams {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  pinsetDirectory?: string;

  validateDocs?: boolean;
  pinningEndpoints?: string[];

  logLevel?: string;
  logToFiles?: boolean;
  logPath?: string;
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
 * Concrete instances of certain interfaces that allow developers to directly provide functionality
 * into Ceramic.
 */
export interface CeramicModules {
  didResolver?: Resolver;
  didProvider?: DIDProvider;
  pinningBackends?: PinningBackendStatic[];
}

/**
 * Ceramic configuration. Includes both the parameters that control core ceramic behavior,
 * as well as modules that allow developers to provide their own implementations or instances
 * of certain core components.
 */
export interface CeramicConfig {
  params?: CeramicParams;
  modules?: CeramicModules
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
  return (typeof docId === 'string') ? DocID.fromString(docId) : docId
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
  private readonly _doctypeHandlers: Record<string, DoctypeHandler<Doctype>>

  public readonly pin: PinApi
  public readonly context: Context

  private readonly _docCache: DocCache

  // TODO: Make the constructor private and force the use of Ceramic.create() everywhere
  constructor (public dispatcher: Dispatcher,
               public pinStore: PinStore,
               context: Context,
               readonly topology: IpfsTopology,
               private _networkOptions: CeramicNetworkOptions,
               private _validateDocs: boolean = true,
               docCacheLimit = DEFAULT_DOC_CACHE_LIMIT,
               cacheDocumentCommits = true) {
    this._doctypeHandlers = {
      'tile': new TileDoctypeHandler(),
      'caip10-link': new Caip10LinkDoctypeHandler()
    }

    this._docCache = new DocCache(docCacheLimit, cacheDocumentCommits)

    this.pin = new LocalPinApi(this.pinStore, this._docCache, this._loadDoc.bind(this))
    this.context = context
    this.context.api = this // set API reference
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

  private static async _generateNetworkOptions(config: CeramicParams, anchorService: AnchorService): Promise<CeramicNetworkOptions> {
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
   * Create Ceramic instance
   * @param ipfs - IPFS instance
   * @param config - Ceramic configuration
   */
  static async create(ipfs: IpfsApi, config: CeramicConfig = {}): Promise<Ceramic> {
    // todo remove
    LoggerProviderOld.init({
      level: config.params?.logLevel? config.params?.logLevel : 'silent',
      component: config.params?.gateway? 'GATEWAY' : 'NODE',
    })

    if (config.params?.logToFiles) {
        LoggerProviderOld.addPlugin(
            config.params?.logToFilesPlugin.plugin,
            config.params?.logToFilesPlugin.state,
            null,
            config.params?.logToFilesPlugin.options
        )
    }

    // Initialize ceramic loggers
    const loggerConfig = {logLevel: config.params?.logLevel, logToFiles: config.params?.logToFiles, logPath: config.params?.logPath}
    const logger = LoggerProvider.makeDiagnosticLogger(loggerConfig)
    const pubsubLogger = LoggerProvider.makeServiceLogger("pubsub", loggerConfig)

    logger.imp(`Starting Ceramic node at version ${packageJson.version} with config: \n${JSON.stringify(config.params || {}, null, 2)}`)

    const anchorService = config.params?.anchorServiceUrl ? new EthereumAnchorService(config.params || {}) : new InMemoryAnchorService(config.params || {} as any)
    await anchorService.init()
    const context: Context = {
      ipfs,
      anchorService,
      logger,
    }

    const networkOptions = await Ceramic._generateNetworkOptions(config?.params, anchorService)
    logger.imp(`Connecting to ceramic network '${networkOptions.name}' using pubsub topic '${networkOptions.pubsubTopic}' with supported anchor chains ['${networkOptions.supportedChains.join("','")}']`)

    const dispatcher = new Dispatcher(ipfs, networkOptions.pubsubTopic, logger, pubsubLogger)
    await dispatcher.init()

    const pinStoreProperties = {
      networkName: networkOptions.name,
      pinsetDirectory: config.params?.pinsetDirectory,
      pinningEndpoints: config.params?.pinningEndpoints,
      pinningBackends: config.modules?.pinningBackends
    }
    const pinStoreFactory = new PinStoreFactory(context, pinStoreProperties)
    const pinStore = await pinStoreFactory.open()
    const topology = new IpfsTopology(ipfs, networkOptions.name)
    const ceramic = new Ceramic(dispatcher, pinStore, context, topology, networkOptions, config.params?.validateDocs, config.params?.docCacheLimit, config.params?.cacheDocCommits)
    anchorService.ceramic = ceramic

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    ceramic.context.resolver = new Resolver({
      ...config.modules?.didResolver, ...threeIdResolver, ...keyDidResolver,
    })

    if (config.modules?.didProvider) {
      await ceramic.setDIDProvider(config.modules?.didProvider)
    }

    const doPeerDiscovery = config.params?.useCentralizedPeerDiscovery ?? !TESTING
    if (doPeerDiscovery) {
      await topology.start()
    }

    const restoreDocuments = config.params?.restoreDocuments ?? true
    if (restoreDocuments) {
      await ceramic.restoreDocuments()
    }

    return ceramic
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
    this.context.logger.imp(`Now authenticated as DID ${this.context.did.id}`)
  }

  /**
   * Register new doctype handler
   * @param doctypeHandler - Document type handler
   */
  addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void {
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
    docId = normalizeDocID(docId)
    if (docId.commit != null) {
      throw new Error('Historical document commits cannot be modified. Load the document without specifying a commit to make updates.')
    }
    const doc = await this._loadDoc(docId, opts)
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

    let doc = this._getDocFromCache(docId)
    if (doc) {
      return doc
    }

    doc = await Document.create(docId, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
    this._docCache.put(doc)
    return doc
  }

  /**
   * Creates doctype from genesis record
   * @param doctype - Document type
   * @param genesis - Genesis CID
   * @param opts - Initialization options
   */
  async createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts: DocOpts = {}): Promise<T> {
    const doc = await this._createDocFromGenesis(doctype, genesis, opts)
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

    let doc = this._getDocFromCache(docId)
    if (doc) {
      return doc
    }

    doc = await Document.create(docId, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
    this._docCache.put(doc)
    return doc
  }

  /**
   * Load document type instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async loadDocument<T extends Doctype>(docId: DocID | string, opts: DocOpts = {}): Promise<T> {
    docId = normalizeDocID(docId)
    const doc = await this._loadDoc(docId, opts)
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

    return Promise.all(state.log.map(async ({ cid }) => {
      const record = (await this.ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })).value
      return {
        cid: cid.toString(),
        value: await DoctypeUtils.convertCommitToSignedCommitContainer(record, this.ipfs)
      }
    }))
  }

  /**
   * Load document instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async _loadDoc(docId: DocID | string, opts: DocOpts = {}): Promise<Document> {
    docId = normalizeDocID(docId)

    // If we already have cached exactly what we want, just return it from the cache
    let doc = this._getDocFromCache(docId)
    if (doc) {
      return doc
    }

    // If we're requesting a specific commit, we should also check the cache for the current version
    // of the document
    doc = this._getDocFromCache(docId.baseID)

    if (!doc) {
      // Load the current version of the document
      const doctypeHandler = this._doctypeHandlers[docId.typeName]
      if (!doctypeHandler) {
        throw new Error(docId.typeName + " is not a valid doctype")
      }
      doc = await Document.load(docId.baseID, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts)
      this._docCache.put(doc)
    }

    if (!docId.commit) {
      // Return current version of the document
      return doc
    }

    // We requested a specific commit
    doc = await Document.loadAtCommit(docId, doc)
    this._docCache.put(doc)
    return doc
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
  }

  /**
   * Close Ceramic instance gracefully
   */
  async close (): Promise<void> {
    await this.pinStore.close()
    await this.dispatcher.close()
    this.topology.stop()
  }
}

export default Ceramic
