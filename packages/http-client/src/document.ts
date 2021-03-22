import {BehaviorSubject, Subscription, interval, pipe, Observable} from 'rxjs'
import {concatMap, filter} from 'rxjs/operators'
import {
  CeramicCommit, DocOpts, DocState, DoctypeUtils, RunningStateLike,
} from '@ceramicnetwork/common';

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

export class Document extends Observable<DocState> implements RunningStateLike {
  readonly state$: BehaviorSubject<DocState>;
  private periodicSync: Subscription;

  private readonly _syncInterval: number

  constructor (initial: DocState, private _apiUrl: string, config: CeramicClientConfig = { docSyncEnabled: false }) {
    super(subscriber => {
      this.state$.subscribe(subscriber);
    })
    this.state$ = new BehaviorSubject(initial)
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

  get value(): DocState {
    return this.state$.value
  }

  get state(): DocState {
    return this.state$.value
  }

  next(state: DocState): void {
    this.state$.next(state)
  }

  /**
   * Sync document state
   * @private
   */
  async _syncState(id?: DocID | CommitID) {
    const effectiveId = id || this.id
    const { state } = await fetchJson(this._apiUrl + '/documents/' + effectiveId.toString())

    if (JSON.stringify(DoctypeUtils.serializeState(this.state$.value)) !== JSON.stringify(state)) {
      this.next(DoctypeUtils.deserializeState(state))
    }
  }

  get id(): DocID {
    return new DocID(this.state$.value.doctype, this.state$.value.log[0].cid)
  }

  static async createFromGenesis (apiUrl: string, doctype: string, genesis: any, docOpts: DocOpts = {}, config: CeramicClientConfig): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/documents', {
      method: 'post',
      body: {
        doctype,
        genesis: DoctypeUtils.serializeCommit(genesis),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, config)
  }

  static async applyCommit(apiUrl: string, docId: DocID | string, commit: CeramicCommit, docOpts: DocOpts = {}): Promise<Document> {
    docId = typeDocID(docId)
    const { state } = await fetchJson(apiUrl + '/commits', {
      method: 'post',
      body: {
        docId: docId.toString(),
        commit: DoctypeUtils.serializeCommit(commit),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl)
  }

  static async load (docId: DocID | CommitID, apiUrl: string, config: CeramicClientConfig): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/documents/' + docId.toString())
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, config)
  }

  static async loadDocumentCommits (docId: DocID, apiUrl: string): Promise<Array<Record<string, CeramicCommit>>> {
    const { commits } = await fetchJson(`${apiUrl}/commits/${docId}`)

    return commits.map((r: any) => {
      return {
        cid: r.cid, value: DoctypeUtils.deserializeCommit(r.value)
      }
    })
  }

  close(): void {
    this.periodicSync.unsubscribe()
    this.state$.complete()
  }
}
