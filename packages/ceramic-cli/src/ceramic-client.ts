import fetch from 'node-fetch'
import { EventEmitter } from 'events'

const fetchJson = async (url: string, payload?: any): Promise<any> => {
  let opts
  if (payload) {
    opts = {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    }
  }
  const res = await fetch(url, opts)
  return res.json()
}

export enum SignatureStatus {
  UNSIGNED,
  PARTIAL,
  SIGNED
}

interface DocState {
  content: any;
  nextContent?: any;
  signature: SignatureStatus;
  anchored: number;
  log: Array<string>;
}

export interface InitOpts {
  onlyGenesis?: boolean;
  skipWait?: boolean;
}

class Document extends EventEmitter {

  constructor (public id: string, private _state: any) {
    super()
  }

  static async create (genesis: any, doctype: string, apiUrl: string, opts: InitOpts = {}): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/create', { genesis, doctype, onlyGenesis: opts.onlyGenesis })
    const doc = new Document(docId, state)
    return doc
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/state' + id)
    const doc = new Document(docId, state)
    return doc
  }

  get content (): any {
    return this._state.nextContent || this._state.content
  }

  get state (): DocState {
    return this._state
  }

  get head (): string {
    const log = this._state.log
    return log[log.length - 1]
  }

  async change (newContent: any, apiUrl: string): Promise<boolean> {
    const { docId, state } = await fetchJson(apiUrl + '/change' + this.id, { content: newContent })
    this._state = state
    return true
  }

  async sign (): Promise<boolean> {
    return false
  }

  async anchor (): Promise<boolean> {
    return false
  }

  async _syncState (apiUrl: string): Promise<void> {
    const { state } = await fetchJson(apiUrl + '/state' + this.id)
    if (JSON.stringify(this._state) !== JSON.stringify(state)) {
      this._state = state
      this.emit('change')
    }
  }
}


const CERAMIC_HOST = 'http://localhost:7007'
const API_PATH = '/api/v0'

class CeramicClient {
  private apiUrl: string
  private docmap: Record<string, Document>
  private iid: any

  constructor (apiHost: string = CERAMIC_HOST) {
    this.apiUrl = apiHost + API_PATH
    this.docmap = {}
    // this is an ugly way of getting updates, switch to something better
    this.iid = setInterval(() => {
      for (const docId in this.docmap) {
        this.docmap[docId]._syncState(this.apiUrl)
      }
    }, 1000)
  }

  async createDocument (genesis: any, doctype: string, opts?: InitOpts): Promise<Document> {
    const doc = await Document.create(genesis, doctype, this.apiUrl, opts)
    if (!this.docmap[doc.id]) this.docmap[doc.id] = doc
    return doc
  }

  async loadDocument (id: string): Promise<Document> {
    if (!this.docmap[id]) this.docmap[id] = await Document.load(id, this.apiUrl)
    return this.docmap[id]
  }

  async _updateDocument (id: string, content: any): Promise<Document> {
    const doc = new Document(id, {})
    await doc.change(content, this.apiUrl)
    return doc
  }

  async close () {
    clearInterval(this.iid)
  }
}

export default CeramicClient
