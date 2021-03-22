import { BehaviorSubject, interval, Observable } from 'rxjs'
import { throttle } from 'rxjs/operators'
import { CeramicCommit, DocOpts, DocState, DoctypeUtils, RunningStateLike } from '@ceramicnetwork/common';
import { DocID, CommitID } from '@ceramicnetwork/docid';
import { fetchJson } from './utils'

export class Document extends Observable<DocState> implements RunningStateLike {
  readonly state$: BehaviorSubject<DocState>;

  constructor (initial: DocState, private _apiUrl: string, docSyncInterval: number) {
    super(subscriber => {
      this.state$.subscribe(subscriber);

      const periodicUpdates = interval(docSyncInterval).pipe(throttle(() => this._syncState())).subscribe()

      return () => {
        periodicUpdates.unsubscribe()
      }
    })
    this.state$ = new BehaviorSubject(initial)
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

  static async createFromGenesis (apiUrl: string, doctype: string, genesis: any, docOpts: DocOpts = {}, docSyncInterval: number): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/documents', {
      method: 'post',
      body: {
        doctype,
        genesis: DoctypeUtils.serializeCommit(genesis),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, docSyncInterval)
  }

  static async applyCommit(apiUrl: string, docId: DocID | string, commit: CeramicCommit, docOpts: DocOpts = {}, docSyncInterval: number): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/commits', {
      method: 'post',
      body: {
        docId: docId.toString(),
        commit: DoctypeUtils.serializeCommit(commit),
        docOpts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, docSyncInterval)
  }

  static async load (docId: DocID | CommitID, apiUrl: string, docSyncInterval: number): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/documents/' + docId.toString())
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, docSyncInterval)
  }

  static async loadDocumentCommits (docId: DocID, apiUrl: string): Promise<Array<Record<string, CeramicCommit>>> {
    const { commits } = await fetchJson(`${apiUrl}/commits/${docId}`)

    return commits.map((r: any) => {
      return {
        cid: r.cid, value: DoctypeUtils.deserializeCommit(r.value)
      }
    })
  }

  complete(): void {
    this.state$.complete()
  }
}
