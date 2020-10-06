import Ipfs from 'ipfs'
import Dispatcher from './dispatcher'
import Document from './document'
import { AnchorServiceFactory } from "./anchor/anchor-service-factory";
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from '@ceramicnetwork/key-did-resolver'

import { CeramicApi, DIDProvider, PinApi } from "@ceramicnetwork/ceramic-common"
import {
  Doctype,
  DoctypeHandler,
  DocOpts,
  Context,
  DoctypeUtils,
  DocParams,
  LoggerProvider,
} from "@ceramicnetwork/ceramic-common"
import { Resolver } from "did-resolver"

import { DID } from 'dids'
import { TileDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-tile"
import { AccountLinkDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-account-link"
import { PinStoreFactory } from "./store/pin-store-factory";
import { PinStore } from "./store/pin-store";

/**
 * Initial Ceramic configuration
 */
export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStorePath?: string;

  didResolver?: Resolver;
  didProvider?: DIDProvider;

  validateDocs?: boolean;
  pinning?: string[];

  logLevel?: string;
  logToFiles?: boolean;
  logPath?: string;
  gateway?: boolean;

  topic?: string;
}

/**
 * Ceramic instance implementation
 */
class Ceramic implements CeramicApi {
  private readonly _docmap: Record<string, Document>
  private readonly _doctypeHandlers: Record<string, DoctypeHandler<Doctype>>

  public readonly pin: PinApi
  public readonly context: Context

  constructor (public dispatcher: Dispatcher, public pinStore: PinStore, context: Context, private _validateDocs: boolean = true) {
    this._docmap = {}
    this._doctypeHandlers = {
      'tile': new TileDoctypeHandler(),
      'account-link': new AccountLinkDoctypeHandler()
    }

    this.pin = this._initPinApi();
    this.context = context
    this.context.api = this // set API reference
  }

  /**
   * Get IPFS instance
   */
  get ipfs(): Ipfs.Ipfs {
    return this.context.ipfs
  }

  get did(): DID | undefined {
    return this.context.did
  }

  /**
   * Initialize Ceramic pinning API
   * @private
   */
  _initPinApi(): PinApi {
    return {
      add: async (docId: string): Promise<void> => {
        const document = await this._loadDoc(docId)
        await this.pinStore.add(document.doctype)
      },
      rm: async (docId: string): Promise<void> => {
        await this.pinStore.rm(docId)
      },
      ls: async (docId?: string): Promise<AsyncIterable<string>> => {
        const normalized = docId ? DoctypeUtils.getBaseDocId(DoctypeUtils.normalizeDocId(docId)) : undefined
        const docIds = await this.pinStore.ls(normalized)
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

  /**
   * Create Ceramic instance
   * @param ipfs - IPFS instance
   * @param config - Ceramic configuration
   */
  static async create(ipfs: Ipfs.Ipfs, config: CeramicConfig = {}): Promise<Ceramic> {
    LoggerProvider.init({
      level: config.logLevel? config.logLevel : 'silent',
      component: config.gateway? 'GATEWAY' : 'NODE',
      outputToFiles: config.logToFiles,
      outputPath: config.logPath
    })

    const dispatcher = new Dispatcher(ipfs, config.topic)
    await dispatcher.init()

    const anchorServiceFactory = new AnchorServiceFactory(dispatcher, config)
    const anchorService = anchorServiceFactory.get();

    const context: Context = {
      ipfs,
      anchorService,
    }

    const pinStoreFactory = new PinStoreFactory(context, config.stateStorePath, config.pinning)
    const pinStore = await pinStoreFactory.open()

    const ceramic = new Ceramic(dispatcher, pinStore, context, config.validateDocs)
    if (config.didProvider) {
      await ceramic.setDIDProvider(config.didProvider)
    }

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
    ceramic.context.resolver = new Resolver({
      ...config.didResolver, ...threeIdResolver, ...keyDidResolver,
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
    this.context.did = new DID( { provider })

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
  async applyRecord<T extends Doctype>(docId: string, record: object, opts?: DocOpts): Promise<T> {
    if (DoctypeUtils.getVersionId(docId) != null) {
      throw new Error('The version of the document is readonly. Checkout the latest HEAD in order to update.')
    }

    const doc = await this._loadDoc(docId, opts)

    await doc.applyRecord(record, opts, this._validateDocs)
    return doc.doctype as T
  }

  /**
   * Get document from map by Genesis CID
   * @param genesisCid
   */
  getDocFromMap(genesisCid: any): Document {
    const id = DoctypeUtils.createDocIdFromGenesis(genesisCid)
    const normalizedDocId = DoctypeUtils.normalizeDocId(id)
    return this._docmap[normalizedDocId]
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
    let doc = this.getDocFromMap(genesisCid)
    if (doc) {
      return doc
    }

    doc = await Document.create(genesisCid, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
    const normalizedId = DoctypeUtils.normalizeDocId(doc.id)
    this._docmap[normalizedId] = doc
    return doc
  }

  /**
   * Creates doctype from genesis record
   * @param genesis - Genesis CID
   * @param opts - Initialization options
   */
  async createDocumentFromGenesis<T extends Doctype>(genesis: any, opts: DocOpts = {}): Promise<T> {
    const doc = await this._createDocFromGenesis(genesis, opts)
    return doc.doctype as T
  }

  /**
   * Creates document from genesis record
   * @param genesis - Genesis record
   * @param opts - Initialization options
   * @private
   */
  async _createDocFromGenesis(genesis: any, opts: DocOpts = {}): Promise<Document> {
    const genesisCid = await this.dispatcher.storeRecord(genesis)
    let doc = this.getDocFromMap(genesisCid)
    if (doc) {
      return doc
    }

    let doctypeHandler
    genesis = await this.dispatcher.retrieveRecord(genesisCid)
    if (DoctypeUtils.isSignedRecord(genesis)) {
      const payload = await this.dispatcher.retrieveRecord(genesis.link)
      doctypeHandler = this.findHandler(payload)
    } else {
      doctypeHandler = this.findHandler(genesis)
    }

    doc = await Document.create(genesisCid, doctypeHandler, this.dispatcher, this.pinStore, this.context, opts, this._validateDocs);
    const normalizedId = DoctypeUtils.normalizeDocId(doc.id)
    this._docmap[normalizedId] = doc
    return doc
  }

  /**
   * Load document type instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async loadDocument<T extends Doctype>(docId: string, opts: DocOpts = {}): Promise<T> {
    const normalizedId = DoctypeUtils.normalizeDocId(docId)

    const baseDocId = DoctypeUtils.getBaseDocId(normalizedId)
    const doc = await this._loadDoc(baseDocId, opts)

    const version = DoctypeUtils.getVersionId(normalizedId)
    return (version? await doc.getVersion<T>(version) : doc.doctype) as T
  }

  /**
   * Load all document records by document ID
   * @param docId - Document ID
   */
  async loadDocumentRecords(docId: string): Promise<Array<Record<string, any>>> {
    const doc = await this.loadDocument(docId)
    const { state } = doc

    return Promise.all(state.log.map(async (cid) => {
      const record = (await this.ipfs.dag.get(cid)).value
      return {
        cid: cid.toString(),
        value: await DoctypeUtils.convertRecordToDTO(record, this.ipfs)
      }
    }))
  }

  /**
   * Load document instance
   * @param docId - Document ID
   * @param opts - Initialization options
   */
  async _loadDoc(docId: string, opts: DocOpts = {}): Promise<Document> {
    const normalizedId = DoctypeUtils.normalizeDocId(docId)

    if (!this._docmap[normalizedId]) {
      this._docmap[normalizedId] = await Document.load(docId, this.findHandler.bind(this), this.dispatcher, this.pinStore, this.context, opts)
    }
    return this._docmap[normalizedId]
  }

  /**
   * Lists ceramic
   * @param docId - Document ID
   */
  async listVersions(docId: string): Promise<string[]> {
    const doc = await this._loadDoc(docId, {
      applyOnly: true
    })
    return (await doc.listVersions()).map((e) => e.toString())
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
