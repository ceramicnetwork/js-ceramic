import { combineURLs, fetchJson, typeDocID } from "./utils"
import Document from './document'

import { DID } from 'dids'
import {
  CeramicApi,
  CeramicRecord,
  Context,
  DIDProvider,
  DocCache,
  DocOpts,
  DocParams,
  Doctype, DoctypeConstructor,
  DoctypeHandler,
  DoctypeUtils,
  MultiQuery,
  PinApi,
} from "@ceramicnetwork/common"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import { Caip10LinkDoctype } from "@ceramicnetwork/doctype-caip10-link"
import DocID from '@ceramicnetwork/docid'
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"

const API_PATH = '/api/v0'
const CERAMIC_HOST = 'http://localhost:7007'

/**
 * Default Ceramic client configuration
 */
export const DEFAULT_CLIENT_CONFIG: CeramicClientConfig = {
  docSyncEnabled: false,
  docSyncInterval: 5000,
  docCacheLimit: 500,
  cacheDocCommits: false,
}

/**
 * Ceramic client configuration
 */
export interface CeramicClientConfig {
  didResolver?: Resolver
  docSyncEnabled?: boolean
  docSyncInterval?: number
  docCacheLimit?: number;
  cacheDocCommits?: boolean;
}

/**
 * Ceramic client implementation
 */
export default class CeramicClient implements CeramicApi {
  private readonly _apiUrl: string
  /**
   * _docCache stores handles to Documents that been handed out. This allows us
   * to update the state within the Document object when we learn about changes
   * to the document. This means that client code with Document references
   * always have access to the most recent known-about version, without needing
   * to explicitly re-load the document.
   */
  private readonly _docCache: DocCache
  private _supportedChains: Array<string>

  public readonly pin: PinApi
  public readonly context: Context

  private readonly _config: CeramicClientConfig
  public readonly _doctypeConstructors: Record<string, DoctypeConstructor<Doctype>>

  constructor (apiHost: string = CERAMIC_HOST, config: CeramicClientConfig = {}) {
    this._config = { ...DEFAULT_CLIENT_CONFIG, ...config }

    this._apiUrl = combineURLs(apiHost, API_PATH)
    this._docCache = new DocCache(config.docCacheLimit, this._config.cacheDocCommits)

    this.context = { api: this }
    this.pin = this._initPinApi()

    const keyDidResolver = KeyDidResolver.getResolver()
    const threeIdResolver = ThreeIdResolver.getResolver(this)
    this.context.resolver = new Resolver({
      ...this._config.didResolver, ...threeIdResolver, ...keyDidResolver,
    })

    this._doctypeConstructors = {
      'tile': TileDoctype,
      'caip10-link': Caip10LinkDoctype
    }
  }

  get did(): DID | undefined {
    return this.context.did
  }

  _initPinApi(): PinApi {
    return {
      add: async (docId: DocID): Promise<void> => {
        const doc = await fetchJson(this._apiUrl + '/pins' + `/${docId.toString()}`, { method: 'post' })
        this._docCache.pin(doc)
      },
      rm: async (docId: DocID): Promise<void> => {
        await fetchJson(this._apiUrl + '/pins' + `/${docId.toString()}`, { method: 'delete' })
        this._docCache.unpin(docId)
      },
      ls: async (docId?: DocID): Promise<AsyncIterable<string>> => {
        let url = this._apiUrl + '/pins'
        if (docId !== undefined) {
          url += `/${docId.toString()}`
        }
        const result = await fetchJson(url)
        const { pinnedDocIds } = result
        return {
          [Symbol.asyncIterator](): AsyncIterator<string, any, undefined> {
            let index = 0
            return {
              next(): Promise<IteratorResult<string>> {
                if (index === pinnedDocIds.length) {
                  return Promise.resolve({ value: null, done: true });
                }
                return Promise.resolve({ value: pinnedDocIds[index++], done: false });
              }
            }
          }
        }
      }
    }
  }

  async createDocument<T extends Doctype>(doctype: string, params: DocParams, opts?: DocOpts): Promise<T> {
    const doctypeConstructor = this.findDoctypeConstructor(doctype)
    const genesis = await doctypeConstructor.makeGenesis(params, this.context, opts)

    return await this.createDocumentFromGenesis(doctype, genesis, opts)
  }

  async createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts?: DocOpts): Promise<T> {
    const doc = await Document.createFromGenesis(this._apiUrl, doctype, genesis, this.context, opts, this._config)

    let docFromCache = this._docCache.get(doc.id) as Document
    if (docFromCache == null) {
      this._docCache.put(doc)
      docFromCache = doc
    } else if (!DoctypeUtils.statesEqual(doc.state, docFromCache.state)) {
      docFromCache.state = doc.state
      docFromCache.emit('change')
    }

    doc.doctypeLogic = this.findDoctypeConstructor(doc.state.doctype)
    return docFromCache as unknown as T
  }

  async loadDocument<T extends Doctype>(docId: DocID | string): Promise<T> {
    docId = typeDocID(docId)

    let doc = this._docCache.get(docId) as Document
    if (doc == null) {
      doc = await Document.load(docId, this._apiUrl, this.context, this._config)
      this._docCache.put(doc)
    } else {
      await doc._syncState()
    }
    doc.doctypeLogic = this.findDoctypeConstructor(doc.state.doctype)
    return doc as unknown as T
  }

  async multiQuery(queries: Array<MultiQuery>): Promise<Record<string, Doctype>> {
    const queriesJSON = queries.map(q => {
      return {
        docId: typeof q.docId === 'string' ? q.docId : q.docId.toString(),
        paths: q.paths
      }
    })

    const results = await fetchJson(this._apiUrl + '/multiqueries', {
      method: 'post',
      body: {
       queries: queriesJSON
      }
    })

    return Object.entries(results).reduce((acc, e) => {
      const [k, v] = e
      const state = DoctypeUtils.deserializeState(v)
      acc[k] = new Document(state, this.context, this._apiUrl, this._config)
      return acc
    }, {})
  }

  async loadDocumentRecords(docId: DocID | string): Promise<Array<Record<string, any>>> {
    docId = typeDocID(docId)
    return Document.loadDocumentRecords(docId, this._apiUrl)
  }

  async applyRecord<T extends Doctype>(docId: DocID | string, record: CeramicRecord, opts?: DocOpts): Promise<T> {
    docId = typeDocID(docId)
    return await Document.applyRecord(this._apiUrl, docId, record, this.context, opts) as unknown as T
  }

  addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void {
    this._doctypeConstructors[doctypeHandler.name] = doctypeHandler.doctype
  }

  findDoctypeConstructor<T extends Doctype>(doctype: string) {
    const constructor = this._doctypeConstructors[doctype]
    if (constructor) {
      return constructor as DoctypeConstructor<T>
    } else {
      throw new Error(`Failed to find doctype constructor for doctype ${doctype}`)
    }
  }

  async setDIDProvider(provider: DIDProvider): Promise<void> {
    this.context.provider = provider;
    this.context.did = new DID( { provider, resolver: this.context.resolver })

    if (!this.context.did.authenticated) {
      await this.context.did.authenticate()
    }
  }

  async getSupportedChains(): Promise<Array<string>> {
    if (this._supportedChains) {
      return this._supportedChains
    }

    // Fetch the chainId from the daemon and cache the result
    const {supportedChains} = await fetchJson(this._apiUrl + '/node/chains')
    this._supportedChains = supportedChains
    return supportedChains
  }

  async close (): Promise<void> {
    this._docCache.applyToAll((d: Document) => d.close())
    this._docCache.clear()
  }
}
