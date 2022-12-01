import { Dispatcher } from '../dispatcher.js'
import { PinStore } from '../store/pin-store.js'
import { ExecutionQueue } from './execution-queue.js'
import { commitAtTime, ConflictResolution } from '../conflict-resolution.js'
import {
  AnchorService,
  AnchorServiceResponse,
  AnchorStatus,
  CreateOpts,
  LoadOpts,
  InternalOpts,
  UpdateOpts,
  UnreachableCaseError,
  RunningStateLike,
  DiagnosticsLogger,
  StreamUtils,
  GenesisCommit,
} from '@ceramicnetwork/common'
import { RunningState } from './running-state.js'
import type { CID } from 'multiformats/cid'
import { catchError, concatMap, takeUntil, tap } from 'rxjs/operators'
import { empty, Observable, Subject, Subscription, timer, lastValueFrom, merge, of } from 'rxjs'
import { SnapshotState } from './snapshot-state.js'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { LocalIndexApi } from '../indexing/local-index-api.js'
import { AnchorRequestStore } from '../store/anchor-request-store.js'

const APPLY_ANCHOR_COMMIT_ATTEMPTS = 3

export class StateManager {
  /**
   * Keeps track of every pinned StreamID that has had its state 'synced' (i.e. a query was sent to
   * pubsub requesting the current tip for that stream) since the start of this process. This set
   * only grows over time, in line with how many pinned streams get queried.
   * @private
   */
  private readonly syncedPinnedStreams: Set<string> = new Set()

  /**
   * @param dispatcher - currently used instance of Dispatcher
   * @param pinStore - currently used instance of PinStore
   * @param executionQ - currently used instance of ExecutionQueue
   * @param anchorService - currently used instance of AnchorService
   * @param conflictResolution - currently used instance of ConflictResolution
   * @param logger - Logger
   * @param fromMemoryOrStore - load RunningState from in-memory cache or from state store, see `Repository#fromMemoryOrStore`.
   * @param load - `Repository#load`
   * @param indexStreamIfNeeded - `Repository#indexStreamIfNeeded`
   */
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly pinStore: PinStore,
    private readonly anchorRequestStore: AnchorRequestStore,
    private readonly executionQ: ExecutionQueue,
    public anchorService: AnchorService,
    public conflictResolution: ConflictResolution,
    private readonly logger: DiagnosticsLogger,
    private readonly fromMemoryOrStore: (streamId: StreamID) => Promise<RunningState | undefined>,
    private readonly load: (
      streamId: StreamID,
      opts?: LoadOpts | CreateOpts
    ) => Promise<RunningState>,
    private readonly indexStreamIfNeeded,
    private readonly _index: LocalIndexApi | undefined
  ) {}

  /**
   * Returns whether the given StreamID corresponds to a pinned stream that has been synced at least
   * once during the lifetime of this process. As long as it's been synced once, it's guaranteed to
   * be up to date since we keep streams in the state store up to date when we hear pubsub messages
   * about updates to them.
   * @param streamId
   */
  wasPinnedStreamSynced(streamId: StreamID): boolean {
    return this.syncedPinnedStreams.has(streamId.toString())
  }

  /**
   * Takes a stream state that might not contain the complete log (and might in fact contain only the
   * genesis commit) and kicks off the process to load and apply the most recent Tip to it.
   *
   * @param state$ - Current stream state.
   * @param timeoutMillis - How much time do we wait for a response from the network.
   * @param hint - Tip to try while we are waiting for the network to respond.
   */
  async sync(state$: RunningState, timeoutMillis: number, hint?: CID): Promise<void> {
    // Begin querying the network for the tip immediately.
    const tip$ = this.dispatcher.messageBus.queryNetwork(state$.id)
    // If a 'hint' is provided we can work on applying it while the tip is
    // fetched from the network
    const tipSource$ = hint ? merge(tip$, of(hint)) : tip$
    // We do not expect this promise to return anything, so set `defaultValue` to `undefined`
    await lastValueFrom(
      tipSource$.pipe(
        takeUntil(timer(timeoutMillis)),
        concatMap((tip) => this._handleTip(state$, tip))
      ),
      { defaultValue: undefined }
    )
    if (state$.isPinned) {
      this.markPinnedAndSynced(state$.id)
    }
  }

  markPinnedAndSynced(streamId: StreamID): void {
    this.syncedPinnedStreams.add(streamId.toString())
  }

  /**
   * Take the version of a stream state and a specific commit and returns a snapshot of a state
   * at the requested commit. If the requested commit is for a branch of history that conflicts with the
   * known commits, throw an error. If the requested commit is ahead of the currently known state
   * for this stream, emit the new state.
   *
   * @param state$ - Currently known state of the stream.
   * @param commitId - Requested commit.
   */
  async atCommit(state$: RunningStateLike, commitId: CommitID): Promise<SnapshotState> {
    return this.executionQ.forStream(commitId).run(async () => {
      const snapshot = await this.conflictResolution.snapshotAtCommit(state$.value, commitId)

      // If the provided CommitID is ahead of what we have in the cache, then we should update
      // the cache to include it.
      if (StreamUtils.isStateSupersetOf(snapshot, state$.value)) {
        state$.next(snapshot)
      }

      return new SnapshotState(snapshot)
    })
  }

  /**
   * Find the relevant AnchorCommit given a particular timestamp.
   * Will return an AnchorCommit whose timestamp is earlier to or
   * equal the requested timestamp.
   *
   * @param state$
   * @param timestamp - unix timestamp
   */
  atTime(state$: RunningStateLike, timestamp: number): Promise<SnapshotState> {
    const commitId = commitAtTime(state$, timestamp)
    return this.atCommit(state$, commitId)
  }

  /**
   * Apply options relating to authoring a new commit
   *
   * @param state$ - Running State
   * @param opts - Initialization options (request anchor, publish to pubsub, etc.)
   * @private
   */
  async applyWriteOpts(state$: RunningState, opts: CreateOpts | UpdateOpts): Promise<void> {
    const anchor = (opts as any).anchor
    const publish = (opts as any).publish
    if (anchor) {
      await this.anchor(state$)
    }
    if (publish) {
      this.publishTip(state$)
    }
  }

  /**
   * Applies the given tip CID as a new commit to the given running state.
   * @param state$ - State to apply tip to
   * @param cid - tip CID
   * @param opts - options that control the behavior when applying the commit
   * @returns boolean - whether or not the tip was actually applied
   * @private
   */
  async _handleTip(state$: RunningState, cid: CID, opts: InternalOpts = {}): Promise<boolean> {
    // by default swallow and log errors applying commits
    opts.throwOnInvalidCommit = opts.throwOnInvalidCommit ?? false
    this.logger.verbose(`Learned of new tip ${cid.toString()} for stream ${state$.id.toString()}`)
    const next = await this.conflictResolution.applyTip(state$.value, cid, opts)
    if (next) {
      state$.next(next)
      this.logger.verbose(
        `Stream ${state$.id.toString()} successfully updated to tip ${cid.toString()}`
      )
      await this._updateStateIfPinned(state$)
      return true
    } else {
      return false
    }
  }

  private async _updateStateIfPinned(state$: RunningState): Promise<void> {
    const isPinned = Boolean(await this.pinStore.stateStore.load(state$.id))
    // TODO (NET-1687): unify shouldIndex check into indexStreamIfNeeded
    const shouldIndex =
      state$.state.metadata.model && this._index.shouldIndexStream(state$.state.metadata.model)
    if (isPinned || shouldIndex) {
      await this.pinStore.add(state$)
    }
    await this.indexStreamIfNeeded(state$)
  }

  publishTip(state$: RunningState): void {
    this.dispatcher.publishTip(state$.id, state$.tip, state$.state.metadata.model)
  }

  /**
   * Handles update from the PubSub topic
   *
   * @param streamId
   * @param tip - Stream Tip CID
   * @param model - Model Stream ID
   */
  async handlePubsubUpdate(streamId: StreamID, tip: CID, model?: StreamID): Promise<void> {
    let state$ = await this.fromMemoryOrStore(streamId)
    const shouldIndex = model && this._index.shouldIndexStream(model)
    if (!shouldIndex && !state$) {
      // stream isn't pinned or indexed, nothing to do
      return
    }

    if (!state$) {
      state$ = await this.load(streamId)
    }
    this.executionQ.forStream(streamId).add(async () => {
      await this._handleTip(state$, tip)
    })
    await this.indexStreamIfNeeded(state$)
  }

  /**
   * Applies commit to the existing state
   *
   * @param streamId - Stream ID to update
   * @param commit - Commit data
   * @param opts - Stream initialization options (request anchor, wait, etc.)
   */
  async applyCommit(
    streamId: StreamID,
    commit: any,
    opts: CreateOpts | UpdateOpts
  ): Promise<RunningState> {
    const state$ = await this.load(streamId, opts)

    return this.executionQ.forStream(streamId).run(async () => {
      const cid = await this.dispatcher.storeCommit(commit, streamId)

      await this._handleTip(state$, cid, opts)
      return state$
    })
  }

  /**
   * Takes the CID of an anchor commit received from an anchor service and applies it. Runs the
   * work of loading and applying the commit on the execution queue so it gets serialized alongside
   * any other updates to the same stream. Includes logic to retry up to a total of 3 attempts to
   * handle transient failures of loading the anchor commit from IPFS.
   *
   * Note that most of the time this will be a no-op because we'll have already heard about the
   * AnchorCommit via a pubsub message from the Ceramic node used by the CAS.  Since we have to poll
   * the CAS anyway in order to learn if our anchor request failed, it seems prudent not to throw
   * away information if we do wind up learning of the AnchorCommit via polling and haven't
   * heard about it already via pubsub (given that pubsub is an unreliable channel).
   * @param state$ - state of the stream being anchored
   * @param tip - The tip that anchorCommit is anchoring
   * @param anchorCommit - cid of the anchor commit
   * @private
   */
  private async _handleAnchorCommit(
    state$: RunningState,
    tip: CID,
    anchorCommit: CID
  ): Promise<void> {
    for (
      let remainingRetries = APPLY_ANCHOR_COMMIT_ATTEMPTS - 1;
      remainingRetries >= 0;
      remainingRetries--
    ) {
      try {
        await this.executionQ.forStream(state$.id).run(async () => {
          const applied = await this._handleTip(state$, anchorCommit)
          if (applied) {
            // We hadn't already heard about the AnchorCommit via pubsub, so it's possible
            // other nodes didn't hear about it via pubsub either, so we rebroadcast it to pubsub now.
            this.publishTip(state$)

            if (remainingRetries < APPLY_ANCHOR_COMMIT_ATTEMPTS - 1) {
              // If we failed to apply the commit at least once, then it's worth logging when
              // we are able to do so successfully on the retry.
              this.logger.imp(
                `Successfully applied anchor commit ${anchorCommit.toString()} for stream ${state$.id.toString()}`
              )
            }
          }
        })
        return
      } catch (error) {
        this.logger.warn(
          `Error while applying anchor commit ${anchorCommit.toString()} for stream ${state$.id.toString()}, ${remainingRetries} retries remain. ${error}`
        )

        if (remainingRetries == 0) {
          this.logger.err(
            `Anchor failed for commit ${tip.toString()} of stream ${state$.id.toString()}: ${error}`
          )

          // Don't update stream's state if the commit that failed to be anchored is no longer the
          // tip of that stream.
          if (tip.equals(state$.tip)) {
            state$.next({ ...state$.value, anchorStatus: AnchorStatus.FAILED })
          }
        }
      }
    }
  }

  /**
   * Request anchor for the latest stream state
   */
  async anchor(state$: RunningState): Promise<void> {
    if (!this.anchorService) {
      throw new Error(
        `Anchor requested for stream ${state$.id.toString()} but anchoring is disabled`
      )
    }
    if (state$.value.anchorStatus == AnchorStatus.ANCHORED) {
      return
    }

    await this._saveAnchorRequestForState(state$)
    const anchorStatus$ = this.anchorService.requestAnchor(state$.id, state$.tip)
    this._processAnchorResponse(state$, anchorStatus$)
  }

  /**
   * Restart polling and handle response for a previously submitted anchor request
   */
  confirmAnchorResponse(state$: RunningState): Subscription {
    const anchorStatus$ = this.anchorService.pollForAnchorResponse(state$.id, state$.tip)
    return this._processAnchorResponse(state$, anchorStatus$)
  }

  private async _saveAnchorRequestForState(state$: RunningState): Promise<void> {
    await this.anchorRequestStore.save(state$.id, {
      cid: state$.tip,
      timestamp: Date.now(),
      genesis: (await this.dispatcher.retrieveCommit(
        state$.value.log[0].cid, // genesis commit CID
        state$.id
      )) as GenesisCommit,
    })
  }

  private _processAnchorResponse(
    state$: RunningState,
    anchorStatus$: Observable<AnchorServiceResponse>
  ): Subscription {
    const stopSignal = new Subject<void>()
    const subscription = anchorStatus$
      .pipe(
        takeUntil(stopSignal),
        concatMap(async (asr) => {
          if (!asr.cid.equals(state$.tip) && asr.status != AnchorStatus.ANCHORED) {
            // We don't want to change a stream's state due to changes to the anchor
            // status of a commit that is no longer the tip of the stream, so we early return
            // in most cases when receiving a response to an old anchor request.
            // The one exception is if the AnchorServiceResponse indicates that the old commit
            // is now anchored, in which case we still want to try to process the anchor commit
            // and let the stream's conflict resolution mechanism decide whether or not to update
            // the stream's state.
            return
          }
          switch (asr.status) {
            case AnchorStatus.PENDING: {
              const next = {
                ...state$.value,
                anchorStatus: AnchorStatus.PENDING,
              }
              state$.next(next)
              await this._updateStateIfPinned(state$)
              return
            }
            case AnchorStatus.PROCESSING: {
              state$.next({ ...state$.value, anchorStatus: AnchorStatus.PROCESSING })
              await this._updateStateIfPinned(state$)
              return
            }
            case AnchorStatus.ANCHORED: {
              await this._handleAnchorCommit(state$, asr.cid, asr.anchorCommit)
              await this.anchorRequestStore.remove(state$.id)
              stopSignal.next()
              return
            }
            case AnchorStatus.FAILED: {
              this.logger.warn(
                `Anchor failed for commit ${asr.cid.toString()} of stream ${asr.streamId}: ${
                  asr.message
                }`
              )
              state$.next({ ...state$.value, anchorStatus: AnchorStatus.FAILED })
              await this.anchorRequestStore.remove(state$.id)
              stopSignal.next()
              return
            }
            default:
              throw new UnreachableCaseError(asr, 'Unknown anchoring state')
          }
        }),
        catchError((error) => {
          // TODO: Combine these two log statements into one line so that they can't get split up in the
          // log output.
          this.logger.warn(`Error while anchoring stream ${state$.id.toString()}:${error}`)
          this.logger.warn(error) // Log stack trace

          // TODO: This can leave a stream with AnchorStatus PENDING or PROCESSING indefinitely.
          // We should distinguish whether the error is transient or permanent, and either transition
          // to AnchorStatus FAILED or keep retrying.
          return empty()
        })
      )
      .subscribe()
    state$.add(subscription)
    return subscription
  }
}
