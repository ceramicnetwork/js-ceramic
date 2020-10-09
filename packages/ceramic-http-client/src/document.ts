import {
  Context, DocOpts, DocParams, DocState, Doctype, DoctypeHandler, DoctypeUtils
} from "@ceramicnetwork/ceramic-common"

import { fetchJson } from './utils'

class Document extends Doctype {

  private readonly _syncHandle: NodeJS.Timeout

  public doctypeHandler: DoctypeHandler<Doctype>

  constructor (state: DocState, context: Context, private _apiUrl: string, syncState = true) {
    super(state, context)

    if (syncState) {
      this._syncHandle = setInterval(async () => {
        await this._syncState()
      }, 1000)
    }
  }

  get id(): string {
    return DoctypeUtils.createDocIdFromGenesis(this.state.log[0])
  }

  static async create (apiUrl: string, doctype: string, params: DocParams, context: Context, opts: DocOpts = {}): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/create', {
      params,
      doctype,
      docOpts: {
        applyOnly: opts.applyOnly,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl)
  }

  static async createFromGenesis (apiUrl: string, genesis: any, context: Context, opts: DocOpts = {}): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/create', {
      genesis: DoctypeUtils.serializeRecord(genesis),
      docOpts: {
        applyOnly: opts.applyOnly,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl)
  }

  static async applyRecord(apiUrl: string, docId: string, record: any, context: Context, opts: DocOpts = {}): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/apply', {
      docId,
      record: DoctypeUtils.serializeRecord(record),
      docOpts: {
        applyOnly: opts.applyOnly,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl, false)
  }

  static async load (id: string, apiUrl: string, context: Context): Promise<Document> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)
    const { state } = await fetchJson(apiUrl + '/state' + normalizedId)
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl)
  }

  static async listVersions (id: string, apiUrl: string): Promise<string[]> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)
    const { versions } = await fetchJson(apiUrl + '/versions' + normalizedId)
    return versions
  }

  static async loadDocumentRecords (id: string, apiUrl: string): Promise<Array<Record<string, any>>> {
    const normalizedId = DoctypeUtils.normalizeDocId(id)
    const { records } = await fetchJson(apiUrl + '/records' + normalizedId)

    return records.map((r: any) => {
      return {
        cid: r.cid, value: DoctypeUtils.deserializeRecord(r.value)
      }
    })
  }

  async change(params: DocParams): Promise<void> {
    const doctype = new this.doctypeHandler.doctype(this.state, this.context)

    await doctype.change(params)
    this.state = doctype.state
  }

  async _syncState(): Promise<void> {
    const normalizedId = DoctypeUtils.normalizeDocId(this.id)
    let { state } = await fetchJson(this._apiUrl + '/state' + normalizedId)
    state = DoctypeUtils.deserializeState(state)
    if (JSON.stringify(this.state) !== JSON.stringify(state)) {
      this.state = state
      this.emit('change')
    }
  }

  close(): void {
    clearInterval(this._syncHandle)
  }
}

export default Document
