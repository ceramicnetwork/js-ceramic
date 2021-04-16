import { Observable, timer } from 'rxjs'
import { throttle } from 'rxjs/operators'
import {
  CeramicCommit,
  CreateOpts,
  StreamState,
  StreamUtils,
  SyncOptions,
  RunningStateLike,
  StreamStateSubject,
  LoadOpts,
  UpdateOpts,
} from '@ceramicnetwork/common';
import { StreamID, CommitID } from '@ceramicnetwork/streamid';
import { fetchJson } from './utils'
import QueryString from 'query-string'

export class Document extends Observable<StreamState> implements RunningStateLike {
  private readonly state$: StreamStateSubject;

  constructor (initial: StreamState, private _apiUrl: string, syncInterval: number) {
    super(subscriber => {
      const periodicUpdates = timer(0, syncInterval).pipe(throttle(() => this._syncState(this.id, { sync: SyncOptions.PREFER_CACHE }))).subscribe();
      this.state$.subscribe(subscriber).add(() => {
        periodicUpdates.unsubscribe();
      })
    })
    this.state$ = new StreamStateSubject(initial);
  }

  get value(): StreamState {
    return this.state$.value
  }

  get state(): StreamState {
    return this.state$.value
  }

  next(state: StreamState): void {
    this.state$.next(state)
  }

  /**
   * Sync stream state
   * @private
   */
  async _syncState(streamId: StreamID | CommitID, opts: LoadOpts): Promise<void> {
    const state = await Document._load(streamId, this._apiUrl, opts)
    this.state$.next(StreamUtils.deserializeState(state))
  }

  get id(): StreamID {
    return new StreamID(this.state$.value.type, this.state$.value.log[0].cid)
  }

  static async createFromGenesis (apiUrl: string, type: number, genesis: any, opts: CreateOpts, syncInterval: number): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/streams', {
      method: 'post',
      body: {
        type,
        genesis: StreamUtils.serializeCommit(genesis),
        opts,
      }
    })
    return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval)
  }

  static async applyCommit(apiUrl: string, streamId: StreamID | string, commit: CeramicCommit, opts: UpdateOpts, syncInterval: number): Promise<Document> {
    const { state } = await fetchJson(apiUrl + '/commits', {
      method: 'post',
      body: {
        streamId: streamId.toString(),
        commit: StreamUtils.serializeCommit(commit),
        opts,
      }
    })
    return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval)
  }

  private static async _load(streamId: StreamID | CommitID, apiUrl: string, opts: LoadOpts): Promise<StreamState> {
    const url = apiUrl + '/streams/' + streamId.toString() + '?' + QueryString.stringify(opts)
    const { state } = await fetchJson(url)
    return state
  }

  static async load (streamId: StreamID | CommitID, apiUrl: string, syncInterval: number, opts: LoadOpts): Promise<Document> {
    const state = await Document._load(streamId, apiUrl, opts)
    return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval)
  }

  static async loadDocumentCommits (streamId: StreamID, apiUrl: string): Promise<Array<Record<string, CeramicCommit>>> {
    const { commits } = await fetchJson(`${apiUrl}/commits/${streamId}`)

    return commits.map((r: any) => {
      return {
        cid: r.cid, value: StreamUtils.deserializeCommit(r.value)
      }
    })
  }

  complete(): void {
    this.state$.complete()
  }
}
