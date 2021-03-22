import { combineURLs, fetchJson, typeDocID } from "./utils"
import { Document } from './document'

import { DID } from 'dids'
import {
  CeramicApi,
  CeramicCommit,
  Context,
  DIDProvider,
  DocOpts,
  DocParams,
  Doctype,
  DoctypeConstructor,
  DoctypeHandler,
  DoctypeUtils,
  MultiQuery,
  PinApi,
} from "@ceramicnetwork/common"
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import { Caip10LinkDoctype } from "@ceramicnetwork/doctype-caip10-link"
import { DocID, CommitID, DocRef } from '@ceramicnetwork/docid';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"

const API_PATH = '/api/v0'
const CERAMIC_HOST = 'http://localhost:7007'

/**
 * Default Ceramic client configuration
 */
export const DEFAULT_CLIENT_CONFIG: CeramicClientConfig = {
  docSyncInterval: 5000,
  docCacheLimit: 500,
  cacheDocCommits: false,
}

/**
 * Ceramic client configuration
 */
export interface CeramicClientConfig {
  didResolver?: Resolver
  docSyncInterval: number
  docCacheLimit: number;
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
  private readonly _docCache: Map<string, Document>
  private _supportedChains: Array<string>

  public readonly pin: PinApi
  public readonly context: Context

  private readonly _config: CeramicClientConfig
  public readonly _doctypeConstructors: Record<string, DoctypeConstructor<Doctype>>

  constructor (apiHost: string = CERAMIC_HOST, config: Partial<CeramicClientConfig> = {}) {
    this._config = { ...DEFAULT_CLIENT_CONFIG, ...config }

    this._apiUrl = combineURLs(apiHost, API_PATH)
    // this._docCache = new LRUMap(config.docCacheLimit) Not now. We do not know what to do when document is evicted on HTTP client.
    this._docCache = new Map()

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
        await fetchJson(this._apiUrl + '/pins' + `/${docId.toString()}`, { method: 'post' })
      },
      rm: async (docId: DocID): Promise<void> => {
        await fetchJson(this._apiUrl + '/pins' + `/${docId.toString()}`, { method: 'delete' })
      },
      ls: async (docId?: DocID): Promise<AsyncIterable<string>> => {
        let url = this._apiUrl + '/pins'
        if (docId) {
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

    return this.createDocumentFromGenesis(doctype, genesis, opts)
  }

  async createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts?: DocOpts): Promise<T> {
    const doc = await Document.createFromGenesis(this._apiUrl, doctype, genesis, opts, this._config)

    const found = this._docCache.get(doc.id.toString())
    if (found) {
      if (!DoctypeUtils.statesEqual(doc.state, found.state)) found.next(doc.state);
      return this.buildDoctype<T>(found);
    } else {
      this._docCache.set(doc.id.toString(), doc);
      return this.buildDoctype<T>(doc);
    }
  }

  async loadDocument<T extends Doctype>(docId: DocID | CommitID | string): Promise<T> {
    const docRef = DocRef.from(docId)
    let doc = this._docCache.get(docRef.baseID.toString())
    if (doc) {
      await doc._syncState(docRef)
    } else {
      doc = await Document.load(docRef, this._apiUrl, this._config)
      this._docCache.set(doc.id.toString(), doc)
    }
    return this.buildDoctype<T>(doc)
  }

  async multiQuery(queries: Array<MultiQuery>): Promise<Record<string, Doctype>> {
    const queriesJSON = queries.map(q => {
      return {
        docId: typeof q.docId === 'string' ? q.docId : q.docId.toString(),
        paths: q.paths,
        atTime: q.atTime
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
      const doc = new Document(state, this._apiUrl, this._config)
      acc[k] = this.buildDoctype(doc)
      return acc
    }, {})
  }

  loadDocumentCommits(docId: string | DocID): Promise<Record<string, any>[]> {
    const effectiveDocId = typeDocID(docId)
    return Document.loadDocumentCommits(effectiveDocId, this._apiUrl)
  }

  /**
   * @deprecated See `loadDocumentCommits`.
   */
  async loadDocumentRecords(docId: DocID | string): Promise<Array<Record<string, any>>> {
    return this.loadDocumentCommits(docId)
  }

  async applyCommit<T extends Doctype>(docId: string | DocID, commit: CeramicCommit, opts?: DocOpts): Promise<T> {
    const effectiveDocId = typeDocID(docId)
    const document = await Document.applyCommit(this._apiUrl, effectiveDocId, commit, opts, this._config)
    return this.buildDoctype<T>(document)
  }

  /**
   * @deprecated See `applyCommit`.
   */
  async applyRecord<T extends Doctype>(docId: DocID | string, record: CeramicCommit, opts?: DocOpts): Promise<T> {
    return this.applyCommit(docId, record, opts)
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

  private buildDoctype<T extends Doctype = Doctype>(document: Document) {
    const doctypeConstructor = this.findDoctypeConstructor<T>(document.state.doctype)
    return new doctypeConstructor(document, this.context)
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
    Array.from(this._docCache).map(([, document]) => {
      document.close()
    })
    this._docCache.clear()
  }
}
