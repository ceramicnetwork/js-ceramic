import { EventEmitter } from 'events'
import cloneDeep from 'lodash.clonedeep'
import { fetchJson } from './utils'
import { DocState, Doctype, DoctypeUtils, InitOpts } from "@ceramicnetwork/ceramic-common"

class Document extends EventEmitter {

  public doctype: Doctype
  private readonly _syncHandle: NodeJS.Timeout

  constructor (public id: string, private _state: any, private _apiUrl: string) {
    super()
    this.doctype = new Doctype(_state)

    this._syncHandle = setInterval(async () => {
        this._syncState()
    }, 1000)
  }

  static async create (apiUrl: string, doctype: string, params: object, opts: InitOpts = {}): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/create', {
      params,
      doctype,
      initOpts: {
        applyOnly: opts.applyOnly,
        isUnique: opts.isUnique
      }
    })
    return new Document(docId, DoctypeUtils.deserializeState(state), apiUrl)
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/state' + id)
    return new Document(docId, DoctypeUtils.deserializeState(state), apiUrl)
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

  async change (newContent: any, newOwners?: Array<string>): Promise<boolean> {
    const { state } = await fetchJson(this._apiUrl + '/change' + this.id, {
      params: {
        content: newContent,
        owners: newOwners
      }
    })
    this._state = DoctypeUtils.deserializeState(state)
    return true
  }

  async sign (): Promise<boolean> {
    return false
  }

  async anchor (): Promise<boolean> {
    return false
  }

  async _syncState(): Promise<void> {
    let { state } = await fetchJson(this._apiUrl + '/state' + this.id)
    state = DoctypeUtils.deserializeState(state)
    if (JSON.stringify(this._state) !== JSON.stringify(state)) {
      this._state = state
      this.doctype.state = state
      this.doctype.emit('change')
    }
  }

  close() {
    clearInterval(this._syncHandle)
  }
}

export default Document
