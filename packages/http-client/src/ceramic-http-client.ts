import { combineURLs, fetchJson, typeStreamID } from "./utils"
import { Document } from './document'

import { DID } from 'dids'
import {
  CreateOpts,
  CeramicApi,
  CeramicCommit,
  Context,
  Doctype,
  DoctypeConstructor,
  DoctypeHandler,
  DoctypeUtils,
  LoadOpts,
  MultiQuery,
  PinApi,
  UpdateOpts,
} from '@ceramicnetwork/common';
import { TileDoctype } from "@ceramicnetwork/doctype-tile"
import { Caip10LinkDoctype } from "@ceramicnetwork/doctype-caip10-link"
import { StreamID, CommitID, StreamRef } from '@ceramicnetwork/streamid';

const API_PATH = '/api/v0'
const CERAMIC_HOST = 'http://localhost:7007'

/**
 * Default Ceramic client configuration
 */
export const DEFAULT_CLIENT_CONFIG: CeramicClientConfig = {
  syncInterval: 5000,
}

const DEFAULT_APPLY_COMMIT_OPTS = { anchor: true, publish: true, sync: false }
const DEFAULT_CREATE_FROM_GENESIS_OPTS = { anchor: true, publish: true, sync: true }
const DEFAULT_LOAD_OPTS = { sync: true }

/**
 * Ceramic client configuration
 */
export interface CeramicClientConfig {
  /**
   * Period of synchronisation, in milliseconds. Active when subscribing document.
   */
  syncInterval: number
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
      add: async (streamId: StreamID): Promise<void> => {
        await fetchJson(this._apiUrl + '/pins' + `/${streamId.toString()}`, { method: 'post' })
      },
      rm: async (streamId: StreamID): Promise<void> => {
        await fetchJson(this._apiUrl + '/pins' + `/${streamId.toString()}`, { method: 'delete' })
      },
      ls: async (streamId?: StreamID): Promise<AsyncIterable<string>> => {
        let url = this._apiUrl + '/pins'
        if (streamId) {
          url += `/${streamId.toString()}`
        }
        const result = await fetchJson(url)
        const { pinnedStreamIds } = result
        return {
          [Symbol.asyncIterator](): AsyncIterator<string, any, undefined> {
            let index = 0
            return {
              next(): Promise<IteratorResult<string>> {
                if (index === pinnedStreamIds.length) {
                  return Promise.resolve({ value: null, done: true });
                }
                return Promise.resolve({ value: pinnedStreamIds[index++], done: false });
              }
            }
          }
        }
      }
    }
  }

  async createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts: CreateOpts = {}): Promise<T> {
    opts = { ...DEFAULT_CREATE_FROM_GENESIS_OPTS, ...opts };
    const doc = await Document.createFromGenesis(this._apiUrl, doctype, genesis, opts, this._config.syncInterval)

    const found = this._docCache.get(doc.id.toString())
    if (found) {
      if (!DoctypeUtils.statesEqual(doc.state, found.state)) found.next(doc.state);
      return this.buildDoctype<T>(found);
    } else {
      this._docCache.set(doc.id.toString(), doc);
      return this.buildDoctype<T>(doc);
    }
  }

  async loadDocument<T extends Doctype>(streamId: StreamID | CommitID | string, opts: LoadOpts = {}): Promise<T> {
    opts = { ...DEFAULT_LOAD_OPTS, ...opts };
    const streamRef = StreamRef.from(streamId)
    let doc = this._docCache.get(streamRef.baseID.toString())
    if (doc) {
      await doc._syncState(streamRef)
    } else {
      doc = await Document.load(streamRef, this._apiUrl, this._config.syncInterval, opts)
      this._docCache.set(doc.id.toString(), doc)
    }
    return this.buildDoctype<T>(doc)
  }

  async multiQuery(queries: Array<MultiQuery>): Promise<Record<string, Doctype>> {
    const queriesJSON = queries.map(q => {
      return {
        streamId: typeof q.streamId === 'string' ? q.streamId : q.streamId.toString(),
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
      const doc = new Document(state, this._apiUrl, this._config.syncInterval)
      acc[k] = this.buildDoctype(doc)
      return acc
    }, {})
  }

  loadDocumentCommits(streamId: string | StreamID): Promise<Record<string, any>[]> {
    const effectiveStreamId = typeStreamID(streamId)
    return Document.loadDocumentCommits(effectiveStreamId, this._apiUrl)
  }

  async applyCommit<T extends Doctype>(streamId: string | StreamID, commit: CeramicCommit, opts: CreateOpts | UpdateOpts = {}): Promise<T> {
    opts = { ...DEFAULT_APPLY_COMMIT_OPTS, ...opts };
    const effectiveStreamId = typeStreamID(streamId)
    const stream = await Document.applyCommit(this._apiUrl, effectiveStreamId, commit, opts, this._config.syncInterval)
    return this.buildDoctype<T>(stream)
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

  async setDID(did: DID): Promise<void> {
    this.context.did = did
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
      document.complete()
    })
    this._docCache.clear()
  }
}
