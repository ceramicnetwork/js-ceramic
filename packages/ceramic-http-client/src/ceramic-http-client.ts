import Document, { InitOpts } from './document'

const CERAMIC_HOST = 'http://localhost:7007'
const API_PATH = '/api/v0'

class CeramicClient {
  private _apiUrl: string
  private _docmap: Record<string, Document>
  private _iid: any

  constructor (apiHost: string = CERAMIC_HOST) {
    this._apiUrl = apiHost + API_PATH
    this._docmap = {}
    // this is an ugly way of getting updates, switch to something better
    this._iid = setInterval(() => {
      for (const docId in this._docmap) {
        this._docmap[docId]._syncState()
      }
    }, 1000)
  }

  async createDocument (genesis: any, doctype: string, opts?: InitOpts): Promise<Document> {
    const doc = await Document.create(genesis, doctype, this._apiUrl, opts)
    if (!this._docmap[doc.id]) this._docmap[doc.id] = doc
    return doc
  }

  async loadDocument (id: string): Promise<Document> {
    if (!this._docmap[id]) this._docmap[id] = await Document.load(id, this._apiUrl)
    return this._docmap[id]
  }

  async _updateDocument (id: string, content: any, owners?: Array<string>): Promise<Document> {
    const doc = new Document(id, {}, this._apiUrl)
    await doc.change(content, owners)
    return doc
  }

  async close (): Promise<void> {
    clearInterval(this._iid)
  }
}

export default CeramicClient
