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

export class Document extends Observable<StreamState> implements RunningStateLike {
  private readonly state$: StreamStateSubject
  private periodicSubscription: Subscription | undefined
  private readonly _apiUrl: URL

  constructor(
    initial: StreamState,
    _apiUrl: URL | string,
    syncInterval: number,
    onSubscribe: (stream: Document) => void,
    onUnsubscribe: (stream: Document) => void
  ) {
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
      onSubscribe(this)
      subscriber.add(() => {
        onUnsubscribe(this)
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
    const state = await Document.loadState(streamId, this._apiUrl, opts)
    this.state$.next(state)
  }

  get id(): StreamID {
    return new StreamID(this.state$.value.type, this.state$.value.log[0].cid)
  }

  static async loadState(
    streamId: StreamID | CommitID,
    apiUrl: URL | string,
    opts: LoadOpts
  ): Promise<StreamState> {
    const url = new URL(`./streams/${streamId}`, apiUrl)
    for (const key in opts) {
      url.searchParams.set(key, opts[key])
    }
    const { state } = await fetchJson(url)
    return StreamUtils.deserializeState(state)
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
