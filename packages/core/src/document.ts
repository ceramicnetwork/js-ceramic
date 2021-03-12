import { Dispatcher } from './dispatcher'
import CID from 'cids'
import {
  AnchorStatus,
  CommitType,
  DocState,
  Doctype,
  DoctypeHandler,
  DocOpts,
  Context,
  DoctypeUtils,
  DocStateHolder,
  UnreachableCaseError
} from '@ceramicnetwork/common'
import DocID, { CommitID } from '@ceramicnetwork/docid';
import { PinStore } from './store/pin-store';
import { SubscriptionSet } from "./subscription-set";
import { distinctUntilChanged, timeoutWith } from "rxjs/operators";
import { DiagnosticsLogger } from "@ceramicnetwork/logger";
import { validateState } from './validate-state';
import { Observable, of } from 'rxjs'
import { ConflictResolution } from './conflict-resolution';
import { RunningState } from './state-management/running-state';
import { TaskQueue } from './pubsub/task-queue';

// DocOpts defaults for document load operations
export const DEFAULT_LOAD_DOCOPTS = {anchor: false, publish: false, sync: true}
// DocOpts defaults for document write operations
export const DEFAULT_WRITE_DOCOPTS = {anchor: true, publish: true, sync: false}

/**
 * Document handles the update logic of the Doctype instance
 */
export class Document implements DocStateHolder {
  readonly id: DocID
  private tasks: TaskQueue
  private _doctype: Doctype
  private _logger: DiagnosticsLogger
  private readonly subscriptionSet = new SubscriptionSet();
  private readonly conflictResolution: ConflictResolution;

  constructor (readonly state$: RunningState,
               public dispatcher: Dispatcher,
               public pinStore: PinStore,
               private _validate: boolean,
               private _context: Context,
               private _doctypeHandler: DoctypeHandler<Doctype>,
               private isReadOnly = false) {
    const doctype = new _doctypeHandler.doctype(state$.value, _context)
    this._doctype = isReadOnly ? DoctypeUtils.makeReadOnly(doctype) : doctype
    this.state$.pipe(distinctUntilChanged()).subscribe(state => {
      this._doctype.state = state;
      this._doctype.emit('change');
    })

    this.id = state$.id

    this._logger = _context.loggerProvider.getDiagnosticsLogger()

    this.tasks = new TaskQueue(error => {
      this._logger.err(error)
    })
    this.conflictResolution = new ConflictResolution(_context, dispatcher, _doctypeHandler, _validate);
  }

  /**
   * Loads the Doctype by id
   * @param docId - Document ID
   * @param handler - find handler
   * @param dispatcher - Dispatcher instance
   * @param pinStore - PinStore instance
   * @param context - Ceramic context
   * @param opts - Initialization options
   * @param validate - Validate content against schema
   * @deprecated
   */
  static async load<T extends Doctype> (
      docId: DocID,
      handler: DoctypeHandler<T>,
      dispatcher: Dispatcher,
      pinStore: PinStore,
      context: Context,
      opts: DocOpts = {},
      validate = true): Promise<Document> {
    // Fill 'opts' with default values for any missing fields
    opts = {...DEFAULT_LOAD_DOCOPTS, ...opts}

    const genesis = await dispatcher.retrieveCommit(docId.cid)
    if (!genesis) {
      throw new Error(`No genesis commit found with CID ${docId.cid.toString()}`)
    }
    const state = await handler.applyCommit(genesis, docId.cid, context)
    const state$ = new RunningState(state)
    const doc = new Document(state$, dispatcher, pinStore, validate, context, handler)

    if (validate) {
      await validateState(doc.state, doc.doctype.content, context.api.loadDocument.bind(context.api))
    }
    const pinnedState = await pinStore.stateStore.load(docId)
    if (pinnedState) {
      doc.state$.next(pinnedState)
    }
    return doc._syncDocumentToCurrent(opts)
  }

  /**
   * Takes a document containing only the genesis commit and kicks off the process to load and apply
   * the most recent Tip to it.
   * @param opts
   * @private
   */
  async _syncDocumentToCurrent(opts: DocOpts): Promise<Document> {
    await this._applyOpts(opts)
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
    return new Document(state$, this.dispatcher, this.pinStore, this._validate, this._context, this._doctypeHandler, true)
  }

  /**
   * Applies commit to the existing Doctype
   *
   * @param commit - Commit data
   * @param opts - Document initialization options (request anchor, wait, etc.)
   */
  async applyCommit (commit: any, opts: DocOpts = {}): Promise<void> {
    await this.tasks.run(async () => {
      // Fill 'opts' with default values for any missing fields
      opts = {...DEFAULT_WRITE_DOCOPTS, ...opts}

      const cid = await this.dispatcher.storeCommit(commit)

      await this._handleTip(cid)
      await this._updateStateIfPinned()
      await this._applyOpts(opts)
    })
  }

  /**
   * Apply initialization options
   *
   * @param opts - Initialization options (request anchor, wait, etc.)
   * @private
   */
  async _applyOpts(opts: DocOpts): Promise<void> {
    const anchor = opts.anchor ?? true
    const publish = opts.publish ?? true
    const sync = opts.sync ?? true
    if (anchor) {
      this.anchor();
    }
    if (publish) {
      this._publishTip()
    }
    const tip$ = this.dispatcher.messageBus.queryNetwork(this.id)
    if (sync) {
      await this._wait(tip$)
    } else {
      this.subscriptionSet.add(tip$.subscribe());
    }
  }

  /**
   * Updates document state if the document is pinned locally
   *
   * @private
   */
  async _updateStateIfPinned(): Promise<void> {
    const isPinned = Boolean(await this.pinStore.stateStore.load(this.id))
    if (isPinned) {
      await this.pinStore.add(this._doctype)
    }
  }

  /**
   * Handles update from the PubSub topic
   *
   * @param cid - Document Tip CID
   * @private
   */
  update(cid: CID): void {
    this.tasks.add(async () => {
      await this._handleTip(cid)
    })
  }

  /**
   * Handles Tip from the PubSub topic
   *
   * @param cid - Document Tip CID
   * @private
   */
  async _handleTip(cid: CID): Promise<void> {
    const next = await this.conflictResolution.applyTip(this.state$.value, cid);
    if (next) {
      this.state$.next(next);
    }
  }

  /**
   * Publishes Tip commit to the pub/sub
   *
   * @private
   */
  _publishTip (): void {
    this.dispatcher.publishTip(this.id, this.tip)
  }

  /**
   * Request anchor for the latest document state
   */
  anchor(): void {
    const anchorStatus$ = this._context.anchorService.requestAnchor(this.id.baseID, this.tip);
    const subscription = anchorStatus$.subscribe((asr) => {
      this.tasks.add(async () => {
        switch (asr.status) {
          case AnchorStatus.PENDING: {
            const next = {
              ...this.state$.value,
              anchorStatus: AnchorStatus.PENDING,
            };
            if (asr.anchorScheduledFor) next.anchorScheduledFor = asr.anchorScheduledFor;
            this.state$.next(next);
            await this._updateStateIfPinned();
            return;
          }
          case AnchorStatus.PROCESSING: {
            this.state$.next({ ...this.state$.value, anchorStatus: AnchorStatus.PROCESSING });
            await this._updateStateIfPinned();
            return;
          }
          case AnchorStatus.ANCHORED: {
            await this._handleTip(asr.anchorRecord);
            await this._updateStateIfPinned();
            this._publishTip();
            subscription.unsubscribe();
            return;
          }
          case AnchorStatus.FAILED: {
            if (!asr.cid.equals(this.tip)) {
              return;
            }
            this.state$.next({ ...this.state$.value, anchorStatus: AnchorStatus.FAILED });
            subscription.unsubscribe();
            return;
          }
          default:
            throw new UnreachableCaseError(asr, 'Unknown anchoring state');
        }
      });
    })
    this.subscriptionSet.add(subscription);
  }

  /**
   * Find the relevant AnchorCommit given a particular timestamp.
   * Will return an AnchorCommit whose timestamp is earlier to or
   * equal the requested timestamp.
   *
   * @param timestamp - unix timestamp
   */
  findCommitAt(timestamp: number): CommitID {
    let commitCid: CID = this.state.log[0].cid
    for (const entry of this.state.log) {
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
   * Gets document doctype name
   */
  get doctype (): Doctype {
    return this._doctype
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
  async _wait(tip$: Observable<CID | undefined>): Promise<void> {
    const tip = await tip$.pipe(timeoutWith(3000, of(undefined))).toPromise()
    if (tip) {
      await this._handleTip(tip)
    }
  }

  /**
   * Gracefully closes the document instance.
   */
  async close (): Promise<void> {
    this.subscriptionSet.close();
    await this.tasks.onIdle();
    if (!this.state$.closed) {
      this.state$.complete();
      this.state$.unsubscribe();
    }
  }

  /**
   * Serializes the document content
   */
  toString (): string {
    return JSON.stringify(this.state$.value)
  }
}
