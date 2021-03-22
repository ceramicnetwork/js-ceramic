import {BehaviorSubject, Subscription, interval, pipe} from 'rxjs'
import {concatMap, filter} from 'rxjs/operators'
import {
  CeramicCommit, Context, DocOpts, DocParams, DocState, Doctype, DoctypeConstructor, DoctypeUtils
} from "@ceramicnetwork/common"

import DocID, { CommitID } from '@ceramicnetwork/docid';

import { fetchJson, typeDocID } from './utils'
import { CeramicClientConfig } from "./ceramic-http-client"

function mapTask<T>(f: () => Promise<T>) {
  let isProcessing = false;
  return pipe(
    filter(() => !isProcessing),
    concatMap(async () => {
      isProcessing = true;
      try {
        return await f()
      } finally {
        isProcessing = false;
      }
    })
  )
}

export class Document extends Doctype {
  readonly state$: BehaviorSubject<DocState>;
  readonly periodicSync: Subscription;

  private readonly _syncInterval: number

  public doctypeLogic: DoctypeConstructor<Doctype>

  constructor (state: DocState, context: Context, private _apiUrl: string, config: CeramicClientConfig = { docSyncEnabled: false }) {
    super(state, context)

    this.state$ = new BehaviorSubject(state)
    this.state$.subscribe(state => {
      this.state = state
      this.emit('change')
    })
    this._syncInterval = config.docSyncInterval

    if (config.docSyncEnabled) {
      this.periodicSync = interval(this._syncInterval).pipe(
        mapTask(async () => {
          await this._syncState();
        })).subscribe();
    } else {
      this.periodicSync = Subscription.EMPTY;
    }
  }

  /**
   * Sync document state
   * @private
   */
  async _syncState() {
    const { state } = await fetchJson(this._apiUrl + '/documents/' + this.id.toString())

    if (JSON.stringify(DoctypeUtils.serializeState(this.state)) !== JSON.stringify(state)) {
      this.state$.next(DoctypeUtils.deserializeState(state))
    }
  }

  get id(): DocID {
    return new DocID(this.state$.value.doctype, this.state$.value.log[0].cid)
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
    const doctype = new this.doctypeLogic(this.state$.value, this.context)

    await doctype.change(params, opts)
    this.state$.next(doctype.state)
  }

  close(): void {
    this.periodicSync.unsubscribe()
    this.state$.complete()
  }
}
