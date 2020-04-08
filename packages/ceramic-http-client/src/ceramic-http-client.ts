import fetch from 'node-fetch'
import CID from 'cids'
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
  const res = await (await fetch(url, opts)).json()
  if (res.error) throw new Error(res.error)
  return res
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
  owners?: Array<string>;
}

function deserializeState (state: any): DocState {
  state.log = state.log.map((cidStr: string): CID => new CID(cidStr))
  return state
}

class Document extends EventEmitter {

  constructor (public id: string, private _state: any) {
    super()
  }

  static async create (genesis: any, doctype: string, apiUrl: string, opts: InitOpts = {}): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/create', { genesis, doctype, onlyGenesis: opts.onlyGenesis, owners: opts.owners })
    const doc = new Document(docId, deserializeState(state))
    return doc
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/state' + id)
    const doc = new Document(docId, deserializeState(state))
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
    const { state } = await fetchJson(apiUrl + '/change' + this.id, { content: newContent })
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
  private _apiUrl: string
  private _docmap: Record<string, Document>
  private _iid: any

  constructor (apiHost: string = CERAMIC_HOST) {
    this._apiUrl = apiHost + API_PATH
    this._docmap = {}
    // this is an ugly way of getting updates, switch to something better
    this._iid = setInterval(() => {
      for (const docId in this._docmap) {
        this._docmap[docId]._syncState(this._apiUrl)
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

  async _updateDocument (id: string, content: any): Promise<Document> {
    const doc = new Document(id, {})
    await doc.change(content, this._apiUrl)
    return doc
  }

  async close (): Promise<void> {
    clearInterval(this._iid)
  }
}

export default CeramicClient
