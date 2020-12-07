import {
  CeramicRecord, Context, DocOpts, DocParams, DocState, Doctype, DoctypeHandler, DoctypeUtils
} from "@ceramicnetwork/common"

import DocID from '@ceramicnetwork/docid'
import CID from 'cids'

import { fetchJson, typeDocID, delay } from './utils'
import { CeramicClientConfig } from "./ceramic-http-client"

class Document extends Doctype {

  private _syncEnabled: boolean
  private readonly _syncInterval: number

  public doctypeHandler: DoctypeHandler<Doctype>

  constructor (state: DocState, context: Context, private _apiUrl: string, config: CeramicClientConfig = { docSyncEnabled: false }) {
    super(state, context)

    this._syncEnabled = config.docSyncEnabled
    this._syncInterval = config.docSyncInterval

    if (this._syncEnabled) {
      this._syncPeriodically() // start syncing
    }
  }

  /**
   * Sync document states periodically
   * @private
   */
  async _syncPeriodically() {
    const _syncState = async () => {
      const { state } = await fetchJson(this._apiUrl + '/documents/' + this.id.toString())

      if (JSON.stringify(DoctypeUtils.serializeState(this.state)) !== JSON.stringify(state)) {
        this.state = DoctypeUtils.deserializeState(state)
        this.emit('change')
      }
    }

    while (this._syncEnabled) {
      try {
        await _syncState()
      } catch (e) {
        // failed to sync state
      }
      await delay(this._syncInterval)
    }
  }

  get id(): DocID {
    return new DocID(this.state.doctype, this.state.log[0].cid)
  }

  static async createFromGenesis (apiUrl: string, doctype: string, genesis: any, context: Context, docOpts: DocOpts = {}, config: CeramicClientConfig): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/documents', {
      method: 'post',
      body: {
        doctype,
        genesis: DoctypeUtils.serializeRecord(genesis),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl, config)
  }

  static async applyRecord(apiUrl: string, docId: DocID | string, record: CeramicRecord, context: Context, docOpts: DocOpts = {}): Promise<Document> {
    docId = typeDocID(docId)
    const { state } = await fetchJson(apiUrl + '/records', {
      method: 'post',
      body: {
        docId: docId.toString(),
        record: DoctypeUtils.serializeRecord(record),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl)
  }

  static async load (docId: DocID | string, apiUrl: string, context: Context, config: CeramicClientConfig, opts: DocOpts, tip?: CID): Promise<Document> {
    // todo send opts and tip
    docId = typeDocID(docId)
    const { state } = await fetchJson(apiUrl + '/documents/' + docId.toString())
    // todo if loading at tip, disable document syncing
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl, config)
  }

  static async loadDocumentRecords (docId: DocID | string, apiUrl: string): Promise<Array<Record<string, CeramicRecord>>> {
    docId = typeDocID(docId)
    const { records } = await fetchJson(apiUrl + '/records/' + docId.toString())

    return records.map((r: any) => {
      return {
        cid: r.cid, value: DoctypeUtils.deserializeRecord(r.value)
      }
    })
  }

  async change(params: DocParams, opts: DocOpts): Promise<void> {
    const doctype = new this.doctypeHandler.doctype(this.state, this.context)

    await doctype.change(params, opts)
    this.state = doctype.state
  }

  close(): void {
    this._syncEnabled = false
  }
}

export default Document
