import { Doctype, DoctypeUtils, InitOpts } from "@ceramicnetwork/ceramic-common"

import { fetchJson } from './utils'
import { Context, DocState } from "@ceramicnetwork/ceramic-common/lib"

class Document extends Doctype {

  private readonly _syncHandle: NodeJS.Timeout

  constructor (state: DocState, private _apiUrl: string) {
    super(state)

    this._syncHandle = setInterval(async () => {
        this._syncState()
    }, 1000)
  }

  static async create (apiUrl: string, doctype: string, params: object, opts: InitOpts = {}): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/create', {
      params,
      doctype,
      initOpts: {
        applyOnly: opts.applyOnly,
        isUnique: opts.isUnique
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl)
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/state' + id)
    return new Document(DoctypeUtils.deserializeState(state), apiUrl)
  }

  async change(params: Record<string, any>, context: Context, opts?: InitOpts): Promise<void> {
    const { content, owners } = params
    const { state } = await fetchJson(this._apiUrl + '/change' + this.id, {
      params: {
        content,
        owners,
      }
    })
    this.state = DoctypeUtils.deserializeState(state)
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
    if (JSON.stringify(this.state) !== JSON.stringify(state)) {
      this.state = state
      this.state = state
      this.emit('change')
    }
  }

  close() {
    clearInterval(this._syncHandle)
  }
}

export default Document
