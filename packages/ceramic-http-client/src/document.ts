import fetch from 'node-fetch'
import CID from 'cids'
import { EventEmitter } from 'events'
import cloneDeep from 'lodash.clonedeep'

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

  constructor (public id: string, private _state: any, private _apiUrl: string) {
    super()
  }

  static async create (genesis: any, doctype: string, apiUrl: string, opts: InitOpts = {}): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/create', { genesis, doctype, onlyGenesis: opts.onlyGenesis, owners: opts.owners })
    const doc = new Document(docId, deserializeState(state), apiUrl)
    return doc
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/state' + id)
    const doc = new Document(docId, deserializeState(state), apiUrl)
    return doc
  }

  get content (): any {
    return this._state.nextContent || this._state.content
  }

  get state (): DocState {
    return cloneDeep(this._state)
  }

  get head (): string {
    const log = this._state.log
    return log[log.length - 1]
  }

  async change (newContent: any): Promise<boolean> {
    const { state } = await fetchJson(this._apiUrl + '/change' + this.id, { content: newContent })
    this._state = deserializeState(state)
    return true
  }

  async sign (): Promise<boolean> {
    return false
  }

  async anchor (): Promise<boolean> {
    return false
  }

  async _syncState (): Promise<void> {
    let { state } = await fetchJson(this._apiUrl + '/state' + this.id)
    state = deserializeState(state)
    if (JSON.stringify(this._state) !== JSON.stringify(state)) {
      this._state = state
      this.emit('change')
    }
  }
}

export default Document
