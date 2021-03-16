import { Dispatcher } from '../dispatcher';
import { PinStore } from '../store/pin-store';
import { ExecutionQueue } from './execution-queue';
import { commitAtTime, ConflictResolution } from '../conflict-resolution';
import { AnchorService, AnchorStatus, DocOpts, UnreachableCaseError } from '@ceramicnetwork/common';
import { RunningState, RunningStateLike } from './running-state';
import CID from 'cids';
import { timeoutWith } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { SnapshotState } from './snapshot-state';
import { CommitID } from '@ceramicnetwork/docid';
import { DEFAULT_WRITE_DOCOPTS } from '../document';

export class StateManager {
  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly pinStore: PinStore,
    private readonly executionQ: ExecutionQueue,
    private readonly anchorService: AnchorService,
    private readonly conflictResolution: ConflictResolution,
  ) {}

  /**
   * Takes a document containing only the genesis commit and kicks off the process to load and apply
   * the most recent Tip to it.
   * @param state$
   * @param opts
   */
  syncGenesis(state$: RunningState, opts: DocOpts): Promise<void> {
    return this.applyOpts(state$, opts);
  }

  async rewind(state$: RunningStateLike, commitId: CommitID): Promise<SnapshotState> {
    const snapshot = await this.conflictResolution.rewind(state$.value, commitId);
    return new SnapshotState(snapshot);
  }

  atTime(state$: RunningStateLike, timestamp: number): Promise<SnapshotState> {
    const commitId = commitAtTime(state$, timestamp);
    return this.rewind(state$, commitId);
  }

  private async applyOpts(state$: RunningState, opts: DocOpts) {
    const anchor = opts.anchor ?? true;
    const publish = opts.publish ?? true;
    const sync = opts.sync ?? true;
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

  update(state$: RunningState, tip: CID) {
    this.executionQ.forDocument(state$.id).addE(async (state$) => {
      await this.handleTip(state$, tip);
    });
  }

  applyCommit(state$: RunningState, commit: any, opts: DocOpts = {}) {
    return this.executionQ.forDocument(state$.id).runE(async (state$) => {
      // Fill 'opts' with default values for any missing fields
      opts = { ...DEFAULT_WRITE_DOCOPTS, ...opts };

      const cid = await this.dispatcher.storeCommit(commit);

      await this.handleTip(state$, cid);
      await this.applyOpts(state$, opts);
    });
  }

  anchor(state$: RunningState): Subscription {
    const anchorStatus$ = this.anchorService.requestAnchor(state$.id, state$.tip);
    const tasks = this.executionQ.forDocument(state$.id);
    const subscription = anchorStatus$.subscribe((asr) => {
      tasks.addE(async (state$) => {
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
      });
    });
    state$.add(subscription);
    return subscription;
  }
}
