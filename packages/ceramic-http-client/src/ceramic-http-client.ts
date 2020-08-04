import { fetchJson } from "./utils"
import Document from './document'
import { Doctype, DoctypeHandler, DocOpts, DocParams } from "@ceramicnetwork/ceramic-common"
import { CeramicApi, PinApi, DoctypeUtils } from "@ceramicnetwork/ceramic-common"

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
          [Symbol.asyncIterator](): AsyncIterator<string, any, undefined> {
            let index = 0
            return {
              next(): Promise<IteratorResult<string>> {
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

  async createDocument<T extends Doctype>(doctype: string, params: DocParams, opts?: DocOpts): Promise<T> {
    console.log('ovo saljem ' + JSON.stringify(params, null, 2))
    const doc = await Document.create(this._apiUrl, doctype, params, opts)
    const normalizedId = DoctypeUtils.normalizeDocId(doc.id)
    if (!this._docmap[normalizedId]) {
      this._docmap[normalizedId] = doc
    }
    return doc as unknown as T
  }

  async loadDocument<T extends Doctype>(id: string): Promise<T> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)
    if (!this._docmap[normalizedId]) {
      this._docmap[normalizedId] = await Document.load(normalizedId, this._apiUrl)
    }
    return this._docmap[normalizedId] as unknown as T
  }

  async listVersions(docId: string): Promise<string[]> {
    const normalizedId = DoctypeUtils.normalizeDocId(docId)
    return Document.listVersions(normalizedId, this._apiUrl)
  }

  applyRecord<T extends Doctype>(): Promise<T> {
    throw new Error('method not implemented')
  }

  createDocumentFromGenesis<T extends Doctype>(): Promise<T> {
    throw new Error('method not implemented')
  }

  addDoctypeHandler<T extends Doctype>(): void {
    throw new Error('method not implemented')
  }

  findDoctypeHandler<T extends Doctype>(): DoctypeHandler<T> {
    throw new Error('method not implemented')
  }

  setDIDProvider(): Promise<void> {
    throw new Error('method not implemented')
  }

  async close (): Promise<void> {
    for (const docId in this._docmap) {
      this._docmap[docId].close();
    }
  }
}

export default CeramicClient
