import { fetchJson } from "./utils"
import Document from './document'

import { DID } from 'dids'
import { Doctype, DoctypeHandler, DocOpts, DocParams, DIDProvider, Context, CeramicApi, PinApi, DoctypeUtils } from "@ceramicnetwork/ceramic-common"
import { TileDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-tile"
import { ThreeIdDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-three-id"
import { AccountLinkDoctypeHandler } from "@ceramicnetwork/ceramic-doctype-account-link"

const CERAMIC_HOST = 'http://localhost:7007'
const API_PATH = '/api/v0'

class CeramicClient implements CeramicApi {
  private readonly _apiUrl: string
  private readonly _docmap: Record<string, Document>

  public readonly pin: PinApi
  public readonly context: Context

  public readonly _doctypeHandlers: Record<string, DoctypeHandler<Doctype>>

  constructor (apiHost: string = CERAMIC_HOST) {
    this._apiUrl = apiHost + API_PATH
    this._docmap = {}

    this.context = { api: this }
    this.pin = this._initPinApi()

    this._doctypeHandlers = {
      '3id': new ThreeIdDoctypeHandler(),
      'tile': new TileDoctypeHandler(),
      'account-link': new AccountLinkDoctypeHandler()
    }
  }

  _initPinApi(): PinApi {
    return {
      add: async (docId: string): Promise<void> => {
        const normalizedId = DoctypeUtils.normalizeDocId(docId)
        return await fetchJson(this._apiUrl + '/pin/add' + normalizedId)
      },
      rm: async (docId: string): Promise<void> => {
        const normalizedId = DoctypeUtils.normalizeDocId(docId)
        return await fetchJson(this._apiUrl + '/pin/rm' + normalizedId)
      },
      ls: async (docId?: string): Promise<AsyncIterable<string>> => {
        let url = this._apiUrl + '/pin/ls'
        if (docId !== undefined) {
          url += docId
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

    return await this.createDocumentFromGenesis(genesis, opts)
  }

  async createDocumentFromGenesis<T extends Doctype>(genesis: any, opts?: DocOpts): Promise<T> {
    const doc = await Document.createFromGenesis(this._apiUrl, genesis, this.context, opts)
    const normalizedId = DoctypeUtils.normalizeDocId(doc.id)
    if (!this._docmap[normalizedId]) {
      this._docmap[normalizedId] = doc
    }
    this._docmap[normalizedId].doctypeHandler = this.findDoctypeHandler(this._docmap[normalizedId].state.doctype)
    return doc as unknown as T
  }

  async loadDocument<T extends Doctype>(id: string): Promise<T> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)

    if (!this._docmap[normalizedId]) {
      this._docmap[normalizedId] = await Document.load(normalizedId, this._apiUrl, this.context)
    }
    this._docmap[normalizedId].doctypeHandler = this.findDoctypeHandler(this._docmap[normalizedId].state.doctype)
    return this._docmap[normalizedId] as unknown as T
  }

  async applyRecord<T extends Doctype>(docId: string, record: object, opts?: DocOpts): Promise<T> {
    return await Document.applyRecord(this._apiUrl, docId, record, opts) as unknown as T
  }

  async listVersions(docId: string): Promise<string[]> {
    const normalizedId = DoctypeUtils.normalizeDocId(docId)
    return Document.listVersions(normalizedId, this._apiUrl)
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
    this.context.user = new DID( { provider })

    if (!this.context.user.authenticated) {
      await this.context.user.authenticate()
    }
  }

  async close (): Promise<void> {
    for (const docId in this._docmap) {
      this._docmap[docId].close();
    }
  }
}

export default CeramicClient
