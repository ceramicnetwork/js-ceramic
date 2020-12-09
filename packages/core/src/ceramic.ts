import Dispatcher from './dispatcher'
import Document from './document'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from '@ceramicnetwork/key-did-resolver'
import DocID from '@ceramicnetwork/docid'
import { AnchorService, CeramicApi, CeramicRecord, DIDProvider, IpfsApi, PinApi, MultiQuery } from "@ceramicnetwork/common"

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
} from "@ceramicnetwork/common"
import { Resolver } from "did-resolver"

import { DID } from 'dids'
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile"
import { Caip10LinkDoctypeHandler } from "@ceramicnetwork/doctype-caip10-link"
import { PinStoreFactory } from "./store/pin-store-factory";
import { PinStore } from "./store/pin-store";
import { PathTrie, TrieNode, promiseTimeout } from './utils'

import EthereumAnchorService from "./anchor/ethereum/ethereum-anchor-service"
import InMemoryAnchorService from "./anchor/memory/in-memory-anchor-service"
import { PinningBackendStatic } from "@ceramicnetwork/common"


import { randomUint32 } from '@stablelib/random'

/**
 * Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStorePath?: string;

  didResolver?: Resolver;
  didProvider?: DIDProvider;

  validateDocs?: boolean;
  pinning?: string[];
  pinningBackends?: PinningBackendStatic[];

  logLevel?: string;
  logToFiles?: boolean;
  logToFilesPlugin?: {
    plugin: LoggerPlugin;
    options: LoggerPluginOptions;
  };
  gateway?: boolean;

  networkName?: string;
  pubsubTopic?: string;

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
  private readonly _docmap: Record<string, Document>
  private readonly _doctypeHandlers: Record<string, DoctypeHandler<Doctype>>

  public readonly pin: PinApi
  public readonly context: Context

  // TODO: Make the constructor private and force the use of Ceramic.create() everywhere
  constructor (public dispatcher: Dispatcher,
               public pinStore: PinStore,
               context: Context,
               private _networkOptions: CeramicNetworkOptions,
               private _validateDocs: boolean = true) {
    this._docmap = {}
    this._doctypeHandlers = {
      'tile': new TileDoctypeHandler(),
      'caip10-link': new Caip10LinkDoctypeHandler()
    }

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
      },
      rm: async (docId: DocID): Promise<void> => {
        await this.pinStore.rm(docId)
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

    if (config.pubsubTopic && networkName !== "inmemory") {
      throw new Error("Specifying pub/sub topic is only supported for the 'inmemory' network")
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
      case "local": {
        // 'local' network always uses a random pubsub topic so that nodes stay isolated from each other
        const rand = randomUint32()
        pubsubTopic = "/ceramic/local-" + rand
        networkChains = ["eip155:1337"] // Ganache
        break
      }
      case "inmemory": {
        // For inmemory only we allow overriding the pub/sub topic.  This is to enable tests
        // within the same process to be able to talk to each other by using a fixed topic, while making the pub/sub topic random by default
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
        throw new Error("Unrecognized Ceramic network name: '" + networkName + "'. Supported networks are: 'mainnet', 'testnet-clay', 'local', 'inmemory'")
      }
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
            null,
            config.logToFilesPlugin.options
        )
    }

    const anchorService = config.anchorServiceUrl ? new EthereumAnchorService(config) : new InMemoryAnchorService(config)
    const context: Context = {
      ipfs,
      anchorService,
    }

    const networkOptions = await Ceramic._generateNetworkOptions(config, anchorService)

    const dispatcher = new Dispatcher(ipfs, networkOptions.pubsubTopic)
    await dispatcher.init()

    const pinStoreFactory = new PinStoreFactory(context, config)
    const pinStore = await pinStoreFactory.open()

    const ceramic = new Ceramic(dispatcher, pinStore, context, networkOptions, config.validateDocs)
    anchorService.ceramic = ceramic

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    ceramic.context.resolver = new Resolver({
      ...config.didResolver, ...threeIdResolver, ...keyDidResolver,
    })

    if (config.didProvider) {
      await ceramic.setDIDProvider(config.didProvider)
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
   * Finds doctype handler
   * @param doctype - Doctype
   */
  findDoctypeHandler<T extends Doctype>(doctype: string): DoctypeHandler<T> {
    const doctypeHandler = this._doctypeHandlers[doctype]
    if (doctypeHandler == null) {
      throw new Error(`Failed to find doctype handler for doctype ${doctype}`)
    }
    return doctypeHandler as DoctypeHandler<T>
  }

  /**
   * Applies record on a given document
   * @param docId - Document ID
   * @param record - Record to be applied
   * @param opts - Initialization options
   */
  async applyRecord<T extends Doctype>(docId: DocID | string, record: CeramicRecord, opts?: DocOpts): Promise<T> {
    docId = normalizeDocID(docId)
    if (docId.version != null) {
      throw new Error('Historical document versions cannot be modified. Load the document without specifying a version to make updates.')
    }

    const doc = await this._loadDoc(docId, opts)

    await doc.applyRecord(record, opts)
    return doc.doctype as T
  }

  /**
   * Get document from map by Genesis CID
   * @param docId - Document ID
   */
  getDocFromMap(docId: DocID): Document {
    return this._docmap[docId.toString()]
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
    const genesisCid = await this.dispatcher.storeRecord(genesis)
    const docId = new DocID(doctype, genesisCid)

    let doc = this.getDocFromMap(docId)
    if (doc) {
      return doc
    }

    doc = await Document.create(docId, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
    this._docmap[doc.id.toString()] = doc
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
    const genesisCid = await this.dispatcher.storeRecord(genesis)
    const doctypeHandler = this._doctypeHandlers[doctype]
    if (!doctypeHandler) {
      throw new Error(doctype + " is not a valid doctype")
    }

    const docId = new DocID(doctype, genesisCid)

    let doc = this.getDocFromMap(docId)
    if (doc) {
      return doc
    }

    doc = await Document.create(docId, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
    this._docmap[doc.id.toString()] = doc
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
   * @param docId - Document ID (root)
   * @param paths - relative paths to documents to load
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
   */
  async loadDocumentRecords(docId: DocID | string): Promise<Array<Record<string, any>>> {
    docId = normalizeDocID(docId)
    const doc = await this.loadDocument(docId)
    const { state } = doc

    return Promise.all(state.log.map(async ({ cid }) => {
      const record = (await this.ipfs.dag.get(cid)).value
      return {
        cid: cid.toString(),
        value: await DoctypeUtils.convertRecordToSignedRecordContainer(record, this.ipfs)
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
    const docIdStr = docId.toString()

    if (this._docmap[docIdStr]) {
      return this._docmap[docIdStr]
    }

    const doctypeHandler = this._doctypeHandlers[docId.typeName]
    if (!doctypeHandler) {
      throw new Error(docId.typeName + " is not a valid doctype")
    }
    const doc = await Document.load(docId, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts)
    if (!docId.version) {
      // Only cache document if we're loading the baseId (i.e. the current version)
      this._docmap[docIdStr] = doc
    }
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
  }
}

export default Ceramic
