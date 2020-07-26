import { Doctype, DoctypeUtils, DocState, DocOpts } from "@ceramicnetwork/ceramic-common"

import { fetchJson } from './utils'

class Document extends Doctype {

  private readonly _syncHandle: NodeJS.Timeout

  constructor (state: DocState, private _apiUrl: string) {
    super(state, null)

    this._syncHandle = setInterval(async () => {
        this._syncState()
    }, 1000)
  }

  static async create (apiUrl: string, doctype: string, params: object, opts: DocOpts = {}): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/create', {
      params,
      doctype,
      docOpts: {
        applyOnly: opts.applyOnly,
        isUnique: opts.isUnique
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl)
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)
    const { state } = await fetchJson(apiUrl + '/state' + normalizedId)
    return new Document(DoctypeUtils.deserializeState(state), apiUrl)
  }

  static async listVersions (id: string, apiUrl: string): Promise<string[]> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)
    const { versions } = await fetchJson(apiUrl + '/versions' + normalizedId)
    return versions
  }

  async change(params: Record<string, any>): Promise<void> {
    const { content, owners } = params
    const normalizedId = DoctypeUtils.getBaseDocId(DoctypeUtils.normalizeDocId(this.id))
    const { state } = await fetchJson(this._apiUrl + '/change' + normalizedId, {
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
    const normalizedId = DoctypeUtils.normalizeDocId(this.id)
    let { state } = await fetchJson(this._apiUrl + '/state' + normalizedId)
    state = DoctypeUtils.deserializeState(state)
    if (JSON.stringify(this.state) !== JSON.stringify(state)) {
      this.state = state
      this.state = state
      this.emit('change')
    }
  }

  close(): void {
    clearInterval(this._syncHandle)
  }
}

export default Document
