import { fetchJson } from "./utils"
import Document from './document'
import { Doctype, DoctypeHandler, InitOpts } from "@ceramicnetwork/ceramic-common"
import { CeramicApi, DIDProvider, PinApi } from "@ceramicnetwork/ceramic-common"
import { DoctypeUtils } from "@ceramicnetwork/ceramic-common/lib"

const CERAMIC_HOST = 'http://localhost:7007'
const API_PATH = '/api/v0'

class CeramicClient implements CeramicApi {
  private readonly _apiUrl: string
  private readonly _docmap: Record<string, Document>

  public pin: PinApi

  constructor (apiHost: string = CERAMIC_HOST) {
    this._apiUrl = apiHost + API_PATH
    this._docmap = {}

    this.pin = this._initPinApi()
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
          [Symbol.asyncIterator]() {
            let index = 0
            return {
              next() {
                if (index === pinnedDocIds.length) {
                  return Promise.resolve({ value: null, done: true });
                }
                return Promise.resolve({ value: pinnedDocIds[index++], done: false });
              }
            };
          }
        }
      }
    }
  }

  async createDocument<T extends Doctype>(doctype: string, params: object, opts?: InitOpts): Promise<T> {
    const doc = await Document.create(this._apiUrl, doctype, params, opts)
    const normalizedId = DoctypeUtils.normalizeDocId(doc.id)
    if (!this._docmap[normalizedId]) {
      this._docmap[normalizedId] = doc
    }
    return doc as unknown as T
  }

  async loadDocument<T extends Doctype>(id: string, opts?: InitOpts): Promise<T> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)
    if (!this._docmap[normalizedId]) {
      this._docmap[normalizedId] = await Document.load(normalizedId, this._apiUrl)
    }
    return this._docmap[normalizedId] as unknown as T
  }

  applyRecord<T extends Doctype>(docId: string, record: object, opts?: InitOpts): Promise<T> {
    throw new Error('method not implemented')
  }

  createDocumentFromGenesis<T extends Doctype>(genesis: any, opts?: InitOpts): Promise<T> {
    throw new Error('method not implemented')
  }

  addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void {
    throw new Error('method not implemented')
  }

  findDoctypeHandler<T extends Doctype>(doctype: string): DoctypeHandler<T> {
    throw new Error('method not implemented')
  }

  setDIDProvider(provider: DIDProvider): Promise<void> {
    throw new Error('method not implemented')
  }

  async close (): Promise<void> {
    for (const docId in this._docmap) {
      this._docmap[docId].close();
    }
  }
}

export default CeramicClient
