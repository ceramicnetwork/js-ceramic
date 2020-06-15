import Ipfs from 'ipfs'
import Dispatcher from './dispatcher'
import User from './user'
import Document from './document'
import { AnchorServiceFactory } from "./anchor/anchor-service-factory";

import LevelStateStore from "./store/level-state-store"
import StateStore from "./store/state-store"

import { CeramicApi, DIDProvider, PinApi } from "./ceramic-api"
import { Doctype, DoctypeHandler, DoctypeUtils, InitOpts } from "./doctype"
// doctype handlers
import { Context } from "./context"
import { Resolver } from 'did-resolver'

import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'

import ThreeIdDoctypeHandler from "./doctype/three-id/three-id-doctype-handler"
import TileDoctypeHandler from "./doctype/tile/tile-doctype-handler"
import AccountLinkDoctypeHandler from "./doctype/account-link/account-link-doctype-handler"

// This is temporary until we handle DIDs and in particular 3IDs better
const gen3IDgenesis = (pubkeys: any): any => {
  return {
    owners: [pubkeys.managementKey],
    content: {
      publicKeys: {
        signing: pubkeys.signingKey,
        encryption: pubkeys.asymEncryptionKey
      }
    }
  }
}

export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStorePath?: string;

  didResolver?: Resolver;
  didProvider?: DIDProvider;
}

/**
 * Ceramic instance implementation
 */
class Ceramic implements CeramicApi {
  private readonly _docmap: Record<string, Document>
  private readonly _doctypeHandlers: Record<string, DoctypeHandler<Doctype>>

  public readonly pin: PinApi
  public readonly context: Context

  constructor (public dispatcher: Dispatcher, public stateStore: StateStore, context: Context) {
    this._docmap = {}
    this._doctypeHandlers = {
      '3id': new ThreeIdDoctypeHandler(),
      'tile': new TileDoctypeHandler(),
      'account-link': new AccountLinkDoctypeHandler()
    }

    this.pin = this._initPinApi();
    this.context = context
    this.context.ceramic = this // set API reference
  }

  /**
   * Get IPFS instance
   */
  get ipfs(): Ipfs.Ipfs {
    return this.context.ipfs
  }

  /**
   * Initialize Ceramic pinning API
   * @private
   */
  _initPinApi(): PinApi {
    return {
      add: async (docId: string): Promise<void> => {
        const document = await this._loadDoc(docId)
        await this.stateStore.pin(document)
      },
      rm: async (docId: string): Promise<void> => {
        await this.stateStore.rm(docId)
      },
      ls: async (docId?: string): Promise<AsyncIterable<string>> => {
        return this.stateStore.ls(docId)
      }
    }
  }

  /**
   * Create Ceramic instance
   * @param ipfs - IPFS instance
   * @param config - Ceramic configuration
   */
  static async create(ipfs: Ipfs.Ipfs, config: CeramicConfig = {}): Promise<Ceramic> {
    const dispatcher = new Dispatcher(ipfs)

    const stateStore = new LevelStateStore(ipfs, dispatcher, config.stateStorePath)
    await stateStore.open()

    const anchorServiceFactory = new AnchorServiceFactory(dispatcher, config)
    const anchorService = anchorServiceFactory.get();

    const context: Context = {
      ipfs,
      anchorService,
    }

    const ceramic = new Ceramic(dispatcher, stateStore, context)
    if (config.didProvider) {
      await ceramic.setDIDProvider(config.didProvider)
    }

    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    ceramic.context.resolver = new Resolver({
      ...config.didResolver, ...threeIdResolver
    })
    return ceramic
  }

  /**
   * Find handler by genesis record
   * @param genesisRecord - Document genesis record
   */
  findHandler<T extends DoctypeHandler<Doctype>>(genesisRecord: any): T {
    if (genesisRecord.doctype in this._doctypeHandlers) {
      return this._doctypeHandlers[genesisRecord.doctype] as T
    } else if (genesisRecord['@context'] === "https://w3id.org/did/v1") {
      return this._doctypeHandlers['3id'] as T
    }
    throw new Error("Couldn't determine doctype handler")
  }

  /**
   * Set DID provider
   * @param provider - DID provider instance
   */
  async setDIDProvider (provider: DIDProvider): Promise<void> {
    this.context.provider = provider;
    this.context.user = new User(provider)

    await this.context.user.auth() // authenticate

    if (!this.context.user.DID) {
      // patch create did document for now
      const { owners, content } = gen3IDgenesis(this.context.user.publicKeys)
      const doc = await this._createDoc('3id', { content, owners })
      this.context.user.DID = 'did:3:' + doc.id.split('/')[2]
    }
  }

  /**
   * Register new doctype handler
   * @param doctypeHandler - Document type handler
   */
  addDoctype<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void {
    this._doctypeHandlers[doctypeHandler.name] = doctypeHandler
  }


  /**
   * Applies record on a given document
   * @param docId - Document ID
   * @param record - Record to be applied
   * @param opts - Initialization options
   */
  async applyRecord<T extends Doctype>(docId: string, record: object, opts?: InitOpts): Promise<T> {
    const doc = await this._loadDoc(docId, {})
    await doc.applyRecord(record, opts)
    return doc.toDoctype<T>()
  }

  /**
   * Create doctype instance
   * @param doctype - Document type
   * @param params - Create parameters
   * @param opts - Initialization options
   */
  async create<T extends Doctype>(doctype: string, params: object, opts?: InitOpts): Promise<T> {
    const doc = await this._createDoc(doctype, params, opts)
    return doc.toDoctype<T>()
  }

  /**
   * Create document instance
   * @param doctype - Document type
   * @param params - Create parameters
   * @param opts - Initialization options
   * @private
   */
  async _createDoc(doctype: string, params: object, opts: InitOpts = {}): Promise<Document> {
    const doctypeHandler = this._doctypeHandlers[doctype]
    const docId = await Document.create(params, doctypeHandler, this.dispatcher, this.stateStore, this.context, opts)
    return this._loadDoc(docId, opts)
  }

  /**
   * Creates doctype from genesis record
   * @param genesis - Genesis CID
   * @param opts - Initialization options
   */
  async createFromGenesis<T extends Doctype>(genesis: any, opts: InitOpts = {}): Promise<T> {
    const doc = await this._createDocFromGenesis(genesis, opts)
    return doc.toDoctype<T>()
  }

  /**
   * Creates document from genesis record
   * @param genesis - Genesis record
   * @param opts - Initialization options
   * @private
   */
  async _createDocFromGenesis(genesis: any, opts: InitOpts = {}): Promise<Document> {
    const doc = await Document.createFromGenesis(genesis, this.findHandler.bind(this), this.dispatcher, this.stateStore, this.context, opts);
    if (!this._docmap[doc.id]) {
      this._docmap[doc.id] = doc
    }
    return this._docmap[doc.id]
  }

  /**
   * Load document type instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async load<T extends Doctype>(docId: string, opts: InitOpts = {}): Promise<T> {
    const doc = await this._loadDoc(docId, opts)
    return doc.toDoctype<T>()
  }

  /**
   * Load document instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async _loadDoc(docId: string, opts: InitOpts = {}): Promise<Document> {
    if (!this._docmap[docId]) {
      this._docmap[docId] = await Document.load(docId, this.findHandler.bind(this), this.dispatcher, this.stateStore, this.context, opts)
    }
    return this._docmap[docId]
  }

  /**
   * Close Ceramic instance gracefully
   */
  async close (): Promise<void> {
    await this.stateStore.close()
    await this.dispatcher.close()
  }
}

export default Ceramic
