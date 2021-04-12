import { Observable, timer } from 'rxjs'
import { throttle } from 'rxjs/operators'
import {
  CeramicCommit,
  CreateOpts,
  DocState,
  DoctypeUtils,
  RunningStateLike,
  DocStateSubject,
  LoadOpts,
  UpdateOpts,
} from '@ceramicnetwork/common';
import { StreamID, CommitID } from '@ceramicnetwork/streamid';
import { fetchJson } from './utils'
import QueryString from 'query-string'

export class Document extends Observable<DocState> implements RunningStateLike {
  private readonly state$: DocStateSubject;

  constructor (initial: DocState, private _apiUrl: string, syncInterval: number) {
    super(subscriber => {
      const periodicUpdates = timer(0, syncInterval).pipe(throttle(() => this._syncState())).subscribe();
      this.state$.subscribe(subscriber).add(() => {
        periodicUpdates.unsubscribe();
      })
    })
    this.state$ = new DocStateSubject(initial);
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
   * Sync stream state
   * @private
   */
  async _syncState(id?: StreamID | CommitID): Promise<void> {
    const effectiveId = id || this.id
    const { state } = await fetchJson(this._apiUrl + '/streams/' + effectiveId.toString())
    this.state$.next(DoctypeUtils.deserializeState(state))
  }

  get id(): StreamID {
    return new StreamID(this.state$.value.doctype, this.state$.value.log[0].cid)
  }

  static async createFromGenesis (apiUrl: string, streamtype: string, genesis: any, opts: CreateOpts, syncInterval: number): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/streams', {
      method: 'post',
      body: {
        streamtype,
        genesis: DoctypeUtils.serializeCommit(genesis),
        opts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, syncInterval)
  }

  static async applyCommit(apiUrl: string, streamId: StreamID | string, commit: CeramicCommit, opts: UpdateOpts, streamSyncInterval: number): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/commits', {
      method: 'post',
      body: {
        streamId: streamId.toString(),
        commit: DoctypeUtils.serializeCommit(commit),
        opts,
      }
    })
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, streamSyncInterval)
  }

  static async load (streamId: StreamID | CommitID, apiUrl: string, streamSyncInterval: number, opts: LoadOpts): Promise<Document> {
    const url = apiUrl + '/streams/' + streamId.toString() + '?' + QueryString.stringify(opts)
    const { state } = await fetchJson(url)
    return new Document(DoctypeUtils.deserializeState(state), apiUrl, streamSyncInterval)
  }

  static async loadDocumentCommits (streamId: StreamID, apiUrl: string): Promise<Array<Record<string, CeramicCommit>>> {
    const { commits } = await fetchJson(`${apiUrl}/commits/${streamId}`)

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
