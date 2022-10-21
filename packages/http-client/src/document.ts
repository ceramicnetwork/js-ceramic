import { Observable, Subscription, timer } from 'rxjs'
import { throttle } from 'rxjs/operators'
import {
  CeramicCommit,
  CreateOpts,
  fetchJson,
  StreamState,
  StreamUtils,
  SyncOptions,
  RunningStateLike,
  StreamStateSubject,
  LoadOpts,
  UpdateOpts,
} from '@ceramicnetwork/common'
import { StreamID, CommitID } from '@ceramicnetwork/streamid'
import { serializeObjectToSearchParams } from './utils.js'

export class Document extends Observable<StreamState> implements RunningStateLike {
  private readonly state$: StreamStateSubject
  private periodicSubscription: Subscription | undefined
  private readonly _apiUrl: URL

  constructor(initial: StreamState, _apiUrl: URL | string, syncInterval: number) {
    super((subscriber) => {
      // Set up periodic updates only when the first observer subscribes
      const isFirstObserver = this.state$.observers.length === 0
      if (isFirstObserver) {
        this.periodicSubscription = timer(0, syncInterval)
          .pipe(throttle(() => this._syncState(this.id, { sync: SyncOptions.PREFER_CACHE })))
          .subscribe()
      }
      this.state$.subscribe(subscriber).add(() => {
        // Shut down periodic updates when the last observer unsubscribes
        const isNoObserversLeft = this.state$.observers.length === 0
        if (isNoObserversLeft) {
          this.periodicSubscription?.unsubscribe()
        }
      })
    })
    this.state$ = new StreamStateSubject(initial)
    this._apiUrl = new URL(_apiUrl)
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

  static async createFromGenesis(
    apiUrl: URL | string,
    type: number,
    genesis: any,
    opts: CreateOpts,
    syncInterval: number
  ): Promise<Document> {
    const url = new URL('./streams', apiUrl)
    const { state } = await fetchJson(url, {
      method: 'post',
      body: {
        type,
        genesis: StreamUtils.serializeCommit(genesis),
        opts,
      },
    })
    return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval)
  }

  static async applyCommit(
    apiUrl: URL | string,
    streamId: StreamID | string,
    commit: CeramicCommit,
    opts: UpdateOpts,
    syncInterval: number
  ): Promise<Document> {
    const url = new URL('./commits', apiUrl)
    const { state } = await fetchJson(url, {
      method: 'post',
      body: {
        streamId: streamId.toString(),
        commit: StreamUtils.serializeCommit(commit),
        opts,
      },
    })
    return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval)
  }

  private static async _load(
    streamId: StreamID | CommitID,
    apiUrl: URL | string,
    opts: LoadOpts
  ): Promise<StreamState> {
    const url = serializeObjectToSearchParams(new URL(`./streams/${streamId}`, apiUrl), opts)
    const { state } = await fetchJson(url)
    return state
  }

  static async load(
    streamId: StreamID | CommitID,
    apiUrl: URL | string,
    syncInterval: number,
    opts: LoadOpts
  ): Promise<Document> {
    const state = await Document._load(streamId, apiUrl, opts)
    return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval)
  }

  static async loadStreamCommits(
    streamId: StreamID,
    apiUrl: URL | string
  ): Promise<Array<Record<string, CeramicCommit>>> {
    const url = new URL(`./commits/${streamId}`, apiUrl)
    const { commits } = await fetchJson(url)

    return commits.map((r: any) => {
      return {
        cid: r.cid,
        value: StreamUtils.deserializeCommit(r.value),
      }
    })
  }

  complete(): void {
    this.state$.complete()
  }
}
