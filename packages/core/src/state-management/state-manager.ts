import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { ExecutionQueue } from './execution-queue';
import { commitAtTime, ConflictResolution } from '../conflict-resolution';
import {
  AnchorService,
  AnchorStatus,
  CreateOpts,
  LoadOpts,
  UpdateOpts,
  UnreachableCaseError,
  RunningStateLike,
  DiagnosticsLogger,
} from '@ceramicnetwork/common';
import { RunningState } from './running-state';
import CID from 'cids';
import { catchError, concatMap, timeoutWith } from 'rxjs/operators';
import { empty, of, Subscription } from 'rxjs';
import { SnapshotState } from './snapshot-state';
import { CommitID, StreamID } from '@ceramicnetwork/streamid';

export class StateManager {

  /**
   * @param dispatcher - currently used instance of Dispatcher
   * @param pinStore - currently used instance of PinStore
   * @param executionQ - currently used instance of ExecutionQueue
   * @param anchorService - currently used instance of AnchorService
   * @param conflictResolution - currently used instance of ConflictResolution
   * @param logger - Logger
   * @param fromMemoryOrStore - load RunningState from in-memory cache or from state store, see `Repository#get`.
   * @param load - `Repository#load`
   */
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly pinStore: PinStore,
    private readonly executionQ: ExecutionQueue,
    public anchorService: AnchorService,
    public conflictResolution: ConflictResolution,
    private readonly logger: DiagnosticsLogger,
    private readonly fromMemoryOrStore: (streamId: StreamID) => Promise<RunningState | undefined>,
    private readonly load: (streamId: StreamID, opts?: LoadOpts | CreateOpts) => Promise<RunningState>,
  ) {}

  /**
   * Takes a document containing only the genesis commit and kicks off the process to load and apply
   * the most recent Tip to it.
   * @param state$
   * @param opts
   */
  syncGenesis(state$: RunningState, opts: LoadOpts): Promise<void> {
    return this.applyOpts(state$, opts);
  }

  /**
   * Take the version of a document state and a specific commit and returns a snapshot of a state
   * at the requested commit. If the requested commit is for a branch of history that conflicts with the
   * known commits, throw an error.
   *
   * @param state$ - Document state to rewind.
   * @param commitId - Requested commit.
   */
  async rewind(state$: RunningStateLike, commitId: CommitID): Promise<SnapshotState> {
    const snapshot = await this.conflictResolution.rewind(state$.value, commitId);
    return new SnapshotState(snapshot);
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
    const commitId = commitAtTime(state$, timestamp);
    return this.rewind(state$, commitId);
  }

  /**
   * Apply initialization options
   *
   * @param state$ - Running State
   * @param opts - Initialization options (request anchor, wait, etc.)
   * @private
   */
  private async applyOpts(state$: RunningState, opts: CreateOpts | UpdateOpts | LoadOpts) {
    const anchor = (opts as any).anchor
    const publish = (opts as any).publish
    const sync = (opts as any).sync
    if (anchor) {
      this.anchor(state$);
    }
    if (publish) {
      this.publishTip(state$);
    }
    const tip$ = this.dispatcher.messageBus.queryNetwork(state$.id);
    if (sync) {
      const tip = await tip$.pipe(timeoutWith(3000, of(undefined))).toPromise();
      if (tip) {
        await this.handleTip(state$, tip);
      }
    } else {
      state$.add(tip$.subscribe());
    }
  }

  private async handleTip(state$: RunningState, cid: CID): Promise<void> {
    const next = await this.conflictResolution.applyTip(state$.value, cid);
    if (next) {
      state$.next(next);
      await this.updateStateIfPinned(state$);
    }
  }

  private async updateStateIfPinned(state$: RunningState): Promise<void> {
    const isPinned = Boolean(await this.pinStore.stateStore.load(state$.id));
    if (isPinned) {
      await this.pinStore.add(state$);
    }
  }

  private publishTip(state$: RunningState): void {
    this.dispatcher.publishTip(state$.id, state$.tip);
  }

  /**
   * Handles update from the PubSub topic
   *
   * @param streamId
   * @param tip - Document Tip CID
   * @private
   */
  update(streamId: StreamID, tip: CID): void {
    this.executionQ.forDocument(streamId).add(async () => {
      const state$ = await this.fromMemoryOrStore(streamId);
      if (state$) await this.handleTip(state$, tip);
    });
  }

  /**
   * Applies commit to the existing state
   *
   * @param streamId - Document ID to update
   * @param commit - Commit data
   * @param opts - Document initialization options (request anchor, wait, etc.)
   */
  applyCommit(streamId: StreamID, commit: any, opts: CreateOpts | UpdateOpts): Promise<RunningState> {
    return this.executionQ.forDocument(streamId).run(async () => {
      const state$ = await this.load(streamId, opts)
      const cid = await this.dispatcher.storeCommit(commit);

      await this.handleTip(state$, cid);
      await this.applyOpts(state$, opts);
      return state$
    });
  }

  /**
   * Request anchor for the latest document state
   */
  anchor(state$: RunningState): Subscription {
    const anchorStatus$ = this.anchorService.requestAnchor(state$.id, state$.tip);
    const subscription = anchorStatus$
      .pipe(
        concatMap(async (asr) => {
          switch (asr.status) {
            case AnchorStatus.PENDING: {
              const next = {
                ...state$.value,
                anchorStatus: AnchorStatus.PENDING,
              };
              if (asr.anchorScheduledFor) next.anchorScheduledFor = asr.anchorScheduledFor;
              state$.next(next);
              await this.updateStateIfPinned(state$);
              return;
            }
            case AnchorStatus.PROCESSING: {
              state$.next({ ...state$.value, anchorStatus: AnchorStatus.PROCESSING });
              await this.updateStateIfPinned(state$);
              return;
            }
            case AnchorStatus.ANCHORED: {
              await this.handleTip(state$, asr.anchorRecord);
              this.publishTip(state$);
              subscription.unsubscribe();
              return;
            }
            case AnchorStatus.FAILED: {
              if (!asr.cid.equals(state$.tip)) {
                return;
              }
              state$.next({ ...state$.value, anchorStatus: AnchorStatus.FAILED });
              subscription.unsubscribe();
              return;
            }
            default:
              throw new UnreachableCaseError(asr, 'Unknown anchoring state');
          }
        }),
        catchError((error) => {
          this.logger.err(error);
          return empty();
        }),
      )
      .subscribe();
    state$.add(subscription);
    return subscription;
  }
}
