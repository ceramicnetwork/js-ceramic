import Dispatcher from './dispatcher'
import Document from './document'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import DocID from '@ceramicnetwork/docid'
import {
  Doctype,
  DoctypeHandler,
  DocOpts,
  Context,
  DoctypeUtils,
  DocParams,
  LoggerProvider,
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
} from "@ceramicnetwork/common"
import { Resolver } from "did-resolver"

import { DID } from 'dids'
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile-handler"
import { Caip10LinkDoctypeHandler } from "@ceramicnetwork/doctype-caip10-link-handler"
import { PinStoreFactory } from "./store/pin-store-factory";
import {cancelPeriodicConnectToPeersTask, periodicallyConnectToPeers} from "./peer-discovery";
import { PinStore } from "./store/pin-store";
import { PathTrie, TrieNode, promiseTimeout } from './utils'

import EthereumAnchorService from "./anchor/ethereum/ethereum-anchor-service"
import InMemoryAnchorService from "./anchor/memory/in-memory-anchor-service"

import { randomUint32 } from '@stablelib/random'

const DEFAULT_DOC_CACHE_LIMIT = 500; // number of docs stored in the cache
const IPFS_GET_TIMEOUT = 60000 // 1 minute
const TESTING = process.env.NODE_ENV == 'test'

/**
 * Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  pinsetDirectory?: string;

  didResolver?: Resolver;
  didProvider?: DIDProvider;

  validateDocs?: boolean;
  pinningEndpoints?: string[];
  pinningBackends?: PinningBackendStatic[];

  logLevel?: string;
  logToFiles?: boolean;
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

  [index: string]: any; // allow arbitrary properties
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
               private _networkOptions: CeramicNetworkOptions,
               private _validateDocs: boolean = true,
               docCacheLimit = DEFAULT_DOC_CACHE_LIMIT,
               cacheDocumentCommits = true) {
    this._doctypeHandlers = {
      'tile': new TileDoctypeHandler(),
      'caip10-link': new Caip10LinkDoctypeHandler()
    }

    this._docCache = new DocCache(docCacheLimit, cacheDocumentCommits)

    this.pin = this._initPinApi();
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

  /**
   * Initialize Ceramic pinning API
   * @private
   */
  _initPinApi(): PinApi {
    return {
      add: async (docId: DocID): Promise<void> => {
        const document = await this._loadDoc(docId)
        await this.pinStore.add(document.doctype)
        this._docCache.pin(document)
      },
      rm: async (docId: DocID): Promise<void> => {
        await this.pinStore.rm(docId)
        this._docCache.unpin(docId)
      },
      ls: async (docId?: DocID): Promise<AsyncIterable<string>> => {
        const docIds = await this.pinStore.ls(docId ? docId.baseID : null)
        return {
          [Symbol.asyncIterator](): any {
            let index = 0
            return {
              next(): any {
                if (index === docIds.length) {
                  return Promise.resolve({ value: null, done: true });
                }
                return Promise.resolve({ value: docIds[index++], done: false });
              }
            };
          }
        }
      }
    }
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
   * Create Ceramic instance
   * @param ipfs - IPFS instance
   * @param config - Ceramic configuration
   */
  static async create(ipfs: IpfsApi, config: CeramicConfig = {}): Promise<Ceramic> {
    LoggerProvider.init({
      level: config.logLevel? config.logLevel : 'silent',
      component: config.gateway? 'GATEWAY' : 'NODE',
    })

    if (config.logToFiles) {
        LoggerProvider.addPlugin(
            config.logToFilesPlugin.plugin,
            config.logToFilesPlugin.state,
            null,
            config.logToFilesPlugin.options
        )
    }

    const anchorService = config.anchorServiceUrl ? new EthereumAnchorService(config) : new InMemoryAnchorService(config as any)
    await anchorService.init()
    const context: Context = {
      ipfs,
      anchorService,
    }

    const networkOptions = await Ceramic._generateNetworkOptions(config, anchorService)

    const dispatcher = new Dispatcher(ipfs, networkOptions.pubsubTopic)
    await dispatcher.init()

    const pinStoreProperties = {
      networkName: networkOptions.name,
      pinsetDirectory: config.pinsetDirectory,
      pinningEndpoints: config.pinningEndpoints,
      pinningBackends: config.pinningBackends
    }
    const pinStoreFactory = new PinStoreFactory(context, pinStoreProperties)
    const pinStore = await pinStoreFactory.open()

    const ceramic = new Ceramic(dispatcher, pinStore, context, networkOptions, config.validateDocs, config.docCacheLimit, config.cacheDocCommits)
    anchorService.ceramic = ceramic

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    ceramic.context.resolver = new Resolver({
      ...config.didResolver, ...threeIdResolver, ...keyDidResolver,
    })

    if (config.didProvider) {
      await ceramic.setDIDProvider(config.didProvider)
    }

    const doPeerDiscovery = config.useCentralizedPeerDiscovery ?? !TESTING
    if (doPeerDiscovery) {
      await periodicallyConnectToPeers(networkOptions.name, ipfs)
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
   * Close Ceramic instance gracefully
   */
  async close (): Promise<void> {
    await this.pinStore.close()
    await this.dispatcher.close()
    await cancelPeriodicConnectToPeersTask()
  }
}

export default Ceramic
