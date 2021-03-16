import { Dispatcher } from './dispatcher'
import CID from 'cids'
import {
  AnchorStatus,
  CommitType,
  DocState,
  DocOpts,
  UnreachableCaseError,
  AnchorService,
} from '@ceramicnetwork/common';
import DocID, { CommitID } from '@ceramicnetwork/docid';
import { PinStore } from './store/pin-store';
import { timeoutWith } from "rxjs/operators";
import { Observable, of, Subscription } from 'rxjs'
import { ConflictResolution } from './conflict-resolution';
import { RunningState, RunningStateLike } from './state-management/running-state';
import { ExecLike } from './state-management/execution-queue';

// DocOpts defaults for document load operations
export const DEFAULT_LOAD_DOCOPTS = {anchor: false, publish: false, sync: true}
// DocOpts defaults for document write operations
export const DEFAULT_WRITE_DOCOPTS = {anchor: true, publish: true, sync: false}

/**
 * Document handles the update logic of the Doctype instance
 */
export class Document extends Observable<DocState> implements RunningStateLike {
  readonly id: DocID

  constructor (readonly state$: RunningState,
               private readonly dispatcher: Dispatcher,
               private readonly pinStore: PinStore,
               private readonly tasks: ExecLike,
               private readonly anchorService: AnchorService,
               private readonly conflictResolution: ConflictResolution,
               readonly isReadOnly = false,
               ) {
    super(subscriber => {
      this.state$.subscribe(subscriber)
    })
    this.id = state$.id
  }

  get value() {
    return this.state$.value
  }

  /**
   * Takes a document containing only the genesis commit and kicks off the process to load and apply
   * the most recent Tip to it.
   * @param state$
   * @param opts
   * @private
   */
  async _syncDocumentToCurrent(state$: RunningState, opts: DocOpts): Promise<Document> {
    await this._applyOpts(state$, opts)
    return this
  }

  /**
   * Takes the most recent known-about version of a document and a specific commit and returns a new
   * Document instance representing the same document but set to the state of the document at the
   * requested commit.  If the requested commit is for a branch of history that conflicts with the
   * known current version of the document, throws an error. Intentionally does not register the new
   * document so that it does not get notifications about newer commits, since we want it tied to a
   * specific commit.
   * @param commitId - DocID of the document including the requested commit
   */
  async rewind(commitId: CommitID): Promise<Document> {
    const resetState = await this.conflictResolution.rewind(this.state$.value, commitId)
    const state$ = new RunningState(resetState)
    return new Document(state$, this.dispatcher, this.pinStore, this.tasks, this.anchorService, this.conflictResolution, true)
  }

  /**
   * Applies commit to the existing Doctype
   *
   * @param commit - Commit data
   * @param opts - Document initialization options (request anchor, wait, etc.)
   */
  async applyCommit (commit: any, opts: DocOpts = {}): Promise<void> {
    await this.tasks.runE(async (state$) => {
      // Fill 'opts' with default values for any missing fields
      opts = {...DEFAULT_WRITE_DOCOPTS, ...opts}

      const cid = await this.dispatcher.storeCommit(commit)

      await this._handleTip(state$, cid)
      await this._applyOpts(state$, opts)
    })
  }

  /**
   * Apply initialization options
   *
   * @param state$ - Running State
   * @param opts - Initialization options (request anchor, wait, etc.)
   * @private
   */
  async _applyOpts(state$: RunningState, opts: DocOpts): Promise<void> {
    const anchor = opts.anchor ?? true
    const publish = opts.publish ?? true
    const sync = opts.sync ?? true
    if (anchor) {
      this.anchor(state$);
    }
    if (publish) {
      this._publishTip(state$)
    }
    const tip$ = this.dispatcher.messageBus.queryNetwork(state$.id)
    if (sync) {
      await this._wait(state$, tip$)
    } else {
      state$.add(tip$.subscribe())
    }
  }

  /**
   * Updates document state if the document is pinned locally
   *
   * @private
   */
  async _updateStateIfPinned(state$: RunningState): Promise<void> {
    const isPinned = Boolean(await this.pinStore.stateStore.load(state$.id))
    if (isPinned) {
      await this.pinStore.add(state$)
    }
  }

  /**
   * Handles update from the PubSub topic
   *
   * @param cid - Document Tip CID
   * @private
   */
  update(cid: CID): void {
    this.tasks.addE(async (state$) => {
      await this._handleTip(state$, cid)
    })
  }

  /**
   * Handles Tip from the PubSub topic
   *
   * @param state$ - Running State
   * @param cid - Document Tip CID
   * @private
   */
  async _handleTip(state$: RunningState, cid: CID): Promise<void> {
    const next = await this.conflictResolution.applyTip(state$.value, cid);
    if (next) {
      state$.next(next);
      await this._updateStateIfPinned(state$);
    }
  }

  /**
   * Publishes Tip commit to the pub/sub
   *
   * @private
   */
  _publishTip (state$: RunningState): void {
    this.dispatcher.publishTip(state$.id, state$.tip)
  }

  /**
   * Request anchor for the latest document state
   */
  anchor(state$: RunningState): Subscription {
    const anchorStatus$ = this.anchorService.requestAnchor(this.id.baseID, this.tip);
    const subscription = anchorStatus$.subscribe((asr) => {
      this.tasks.addE(async (state$) => {
        switch (asr.status) {
          case AnchorStatus.PENDING: {
            const next = {
              ...state$.value,
              anchorStatus: AnchorStatus.PENDING,
            };
            if (asr.anchorScheduledFor) next.anchorScheduledFor = asr.anchorScheduledFor;
            state$.next(next);
            await this._updateStateIfPinned(state$);
            return;
          }
          case AnchorStatus.PROCESSING: {
            state$.next({ ...state$.value, anchorStatus: AnchorStatus.PROCESSING });
            await this._updateStateIfPinned(state$);
            return;
          }
          case AnchorStatus.ANCHORED: {
            await this._handleTip(state$, asr.anchorRecord);
            this._publishTip(state$);
            subscription.unsubscribe();
            return;
          }
          case AnchorStatus.FAILED: {
            if (!asr.cid.equals(this.tip)) {
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
    })
    state$.add(subscription);
    return subscription;
  }

  /**
   * Find the relevant AnchorCommit given a particular timestamp.
   * Will return an AnchorCommit whose timestamp is earlier to or
   * equal the requested timestamp.
   *
   * @param state$
   * @param timestamp - unix timestamp
   */
  findCommitAt(state$: RunningState, timestamp: number): CommitID {
    let commitCid: CID = state$.value.log[0].cid
    for (const entry of state$.value.log) {
      if (entry.type === CommitType.ANCHOR) {
        if (entry.timestamp <= timestamp) {
          commitCid = entry.cid
        } else {
          break
        }
      }
    }
    return this.id.atCommit(commitCid)
  }

  /**
   * Gets document content
   */
  get content (): any {
    const { next, content } = this.state
    return next?.content ?? content
  }

  /**
   * Gets document state
   */
  get state (): DocState {
    return this.state$.value
  }

  /**
   * Gets document Tip commit CID
   */
  get tip (): CID {
    const log = this.state$.value.log
    return log[log.length - 1].cid
  }

  /**
   * Waits for some time in order to propagate
   *
   * @private
   */
  async _wait(state$: RunningState, tip$: Observable<CID | undefined>): Promise<void> {
    const tip = await tip$.pipe(timeoutWith(3000, of(undefined))).toPromise()
    if (tip) {
      await this._handleTip(state$, tip)
    }
  }

  /**
   * Gracefully closes the document instance.
   */
  close (): void {
    this.state$.complete()
  }

  /**
   * Serializes the document content
   */
  toString (): string {
    return JSON.stringify(this.state$.value)
  }
}
