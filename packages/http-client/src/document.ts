import {
  Context, DocOpts, DocParams, DocState, Doctype, DoctypeHandler, DoctypeUtils
} from "@ceramicnetwork/common"

import { fetchJson, typeDocID } from './utils'
import DocID from '@ceramicnetwork/docid'

const docIdUrl = (docId: DocID ): string => `/ceramic/${docId.toString()}`

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

  get id(): DocID {
    return new DocID(this.state.doctype, this.state.log[0])
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

  static async applyRecord(apiUrl: string, docId: DocID | string, record: any, context: Context, opts: DocOpts = {}): Promise<Document> {
    docId = typeDocID(docId)
    const { state } = await fetchJson(apiUrl + '/apply', {
      docId: docId.toString(),
      record: DoctypeUtils.serializeRecord(record),
      docOpts: {
        applyOnly: opts.applyOnly,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl, false)
  }

  static async load (docId: DocID | string, apiUrl: string, context: Context): Promise<Document> {
    docId = typeDocID(docId)
    const { state } = await fetchJson(apiUrl + '/state' + docIdUrl(docId))
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl)
  }

  static async listVersions (docId: DocID | string, apiUrl: string): Promise<string[]> {
    docId = typeDocID(docId)
    const { versions } = await fetchJson(apiUrl + '/versions' + docIdUrl(docId))
    return versions
  }

  static async loadDocumentRecords (docId: DocID | string, apiUrl: string): Promise<Array<Record<string, any>>> {
    docId = typeDocID(docId)
    const { records } = await fetchJson(apiUrl + '/records' + docIdUrl(docId))

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
    let { state } = await fetchJson(this._apiUrl + '/state' + docIdUrl(this.id))
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
