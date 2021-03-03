import {
  CeramicCommit, Context, DocOpts, DocParams, DocState, Doctype, DoctypeConstructor, DoctypeUtils
} from "@ceramicnetwork/common"

import DocID, { CommitID } from '@ceramicnetwork/docid';

import { fetchJson, typeDocID, delay } from './utils'
import { CeramicClientConfig } from "./ceramic-http-client"

export class Document extends Doctype {

  private _syncEnabled: boolean
  private readonly _syncInterval: number

  public doctypeLogic: DoctypeConstructor<Doctype>

  constructor (state: DocState, context: Context, private _apiUrl: string, config: CeramicClientConfig = { docSyncEnabled: false }) {
    super(state, context)

    this._syncEnabled = config.docSyncEnabled
    this._syncInterval = config.docSyncInterval

    if (this._syncEnabled) {
      this._syncPeriodically() // start syncing
    }
  }

  /**
   * Sync document state
   * @private
   */
  async _syncState() {
    const { state } = await fetchJson(this._apiUrl + '/documents/' + this.id.toString())

    if (JSON.stringify(DoctypeUtils.serializeState(this.state)) !== JSON.stringify(state)) {
      this.state = DoctypeUtils.deserializeState(state)
      this.emit('change')
    }
  }

  /**
   * Sync document states periodically
   * @private
   */
  async _syncPeriodically() {
    while (this._syncEnabled) {
      try {
        await this._syncState()
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
        genesis: DoctypeUtils.serializeCommit(genesis),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl, config)
  }

  static async applyCommit(apiUrl: string, docId: DocID | string, commit: CeramicCommit, context: Context, docOpts: DocOpts = {}): Promise<Document> {
    docId = typeDocID(docId)
    const { state } = await fetchJson(apiUrl + '/commits', {
      method: 'post',
      body: {
        docId: docId.toString(),
        commit: DoctypeUtils.serializeCommit(commit),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl)
  }

  static async load (docId: DocID | CommitID, apiUrl: string, context: Context, config: CeramicClientConfig): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/documents/' + docId.toString())
    return new Document(DoctypeUtils.deserializeState(state), context, apiUrl, config)
  }

  static async loadDocumentCommits (docId: DocID, apiUrl: string): Promise<Array<Record<string, CeramicCommit>>> {
    const { commits } = await fetchJson(`${apiUrl}/commits/${docId}`)

    return commits.map((r: any) => {
      return {
        cid: r.cid, value: DoctypeUtils.deserializeCommit(r.value)
      }
    })
  }

  async change(params: DocParams, opts: DocOpts): Promise<void> {
    const doctype = new this.doctypeLogic(this.state, this.context)

    await doctype.change(params, opts)
    this.state = doctype.state
  }

  close(): void {
    this._syncEnabled = false
  }
}
