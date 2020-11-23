import { fetchJson, typeDocID, combineURLs } from "./utils"
import Document from './document'

import { DID } from 'dids'
import { Doctype, DoctypeHandler, DocOpts, DocParams, DIDProvider, Context, CeramicApi, PinApi } from "@ceramicnetwork/common"
import { TileDoctypeHandler } from "@ceramicnetwork/doctype-tile"
import { Caip10LinkDoctypeHandler } from "@ceramicnetwork/doctype-caip10-link"
import DocID from '@ceramicnetwork/docid'

const API_PATH = '/api/v0'
const CERAMIC_HOST = 'http://localhost:7007'

/**
 * Default Ceramic client configuration
 */
export const DEFAULT_CLIENT_CONFIG: CeramicClientConfig = {
  docSyncEnabled: false,
  docSyncInterval: 1000,
}

/**
 * Ceramic client configuration
 */
export interface CeramicClientConfig {
  docSyncEnabled?: boolean
  docSyncInterval?: number
}

/**
 * Ceramic client implementation
 */
export default class CeramicClient implements CeramicApi {
  private readonly _apiUrl: string
  private readonly _docmap: Record<string, Document>
  private _supportedChains: Array<string>

  public readonly pin: PinApi
  public readonly context: Context

  private readonly _config: CeramicClientConfig
  public readonly _doctypeHandlers: Record<string, DoctypeHandler<Doctype>>

  constructor (apiHost: string = CERAMIC_HOST, config?: CeramicClientConfig) {
    this._config = Object.assign(config ? config : {}, DEFAULT_CLIENT_CONFIG)

    this._apiUrl = combineURLs(apiHost, API_PATH)
    this._docmap = {}

    this.context = { api: this }
    this.pin = this._initPinApi()

    this._doctypeHandlers = {
      'tile': new TileDoctypeHandler(),
      'caip10-link': new Caip10LinkDoctypeHandler()
    }
  }

  get did(): DID | undefined {
    return this.context.did
  }

  _initPinApi(): PinApi {
    return {
      add: async (docId: DocID): Promise<void> => {
        return await fetchJson(this._apiUrl + '/pin/add' + `/ceramic/${docId.toString()}`)
      },
      rm: async (docId: DocID): Promise<void> => {
        return await fetchJson(this._apiUrl + '/pin/rm' + `/ceramic/${docId.toString()}`)
      },
      ls: async (docId?: DocID): Promise<AsyncIterable<string>> => {
        let url = this._apiUrl + '/pin/ls'
        if (docId !== undefined) {
          url += `/ceramic/${docId.toString()}`
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
    const doctypeHandler = this.findDoctypeHandler(doctype)
    const genesis = await doctypeHandler.doctype.makeGenesis(params, this.context, opts)

    return await this.createDocumentFromGenesis(doctype, genesis, opts)
  }

  async createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts?: DocOpts): Promise<T> {
    const doc = await Document.createFromGenesis(this._apiUrl, doctype, genesis, this.context, opts, this._config)
    const docIdStr = doc.id.toString()
    if (!this._docmap[docIdStr]) {
      this._docmap[docIdStr] = doc
    }
    this._docmap[docIdStr].doctypeHandler = this.findDoctypeHandler(this._docmap[docIdStr].state.doctype)
    return this._docmap[docIdStr] as unknown as T
  }

  async loadDocument<T extends Doctype>(docId: DocID | string): Promise<T> {
    docId = typeDocID(docId)
    const docIdStr = docId.toString()
    if (!this._docmap[docIdStr]) {
      this._docmap[docIdStr] = await Document.load(docId, this._apiUrl, this.context, this._config)
    }
    this._docmap[docIdStr].doctypeHandler = this.findDoctypeHandler(this._docmap[docIdStr].state.doctype)
    return this._docmap[docIdStr] as unknown as T
  }

  async loadDocumentRecords(docId: DocID | string): Promise<Array<Record<string, any>>> {
    docId = typeDocID(docId)
    return Document.loadDocumentRecords(docId, this._apiUrl)
  }

  async applyRecord<T extends Doctype>(docId: DocID | string, record: Record<string, unknown>, opts?: DocOpts): Promise<T> {
    docId = typeDocID(docId)
    return await Document.applyRecord(this._apiUrl, docId, record, this.context, opts) as unknown as T
  }

  addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void {
    this._doctypeHandlers[doctypeHandler.name] = doctypeHandler
  }

  findDoctypeHandler<T extends Doctype>(doctype: string): DoctypeHandler<T> {
    const doctypeHandler = this._doctypeHandlers[doctype]
    if (doctypeHandler == null) {
      throw new Error(`Failed to find doctype handler for doctype ${doctype}`)
    }
    return doctypeHandler as DoctypeHandler<T>
  }

  async setDIDProvider(provider: DIDProvider): Promise<void> {
    this.context.provider = provider;
    this.context.did = new DID( { provider })

    if (!this.context.did.authenticated) {
      await this.context.did.authenticate()
    }
  }

  async getSupportedChains(): Promise<Array<string>> {
    if (this._supportedChains) {
      return this._supportedChains
    }

    // Fetch the chainId from the daemon and cache the result
    const {supportedChains} = await fetchJson(this._apiUrl + '/supported_chains')
    this._supportedChains = supportedChains
    return supportedChains
  }

  async close (): Promise<void> {
    for (const docId in this._docmap) {
      this._docmap[docId].close();
    }
  }
}
