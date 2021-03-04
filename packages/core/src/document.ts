import { Dispatcher } from './dispatcher'
import CID from 'cids'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import {
  AnchorStatus,
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
import { concatMap, distinctUntilChanged } from "rxjs/operators";
import { DiagnosticsLogger } from "@ceramicnetwork/logger";
import { validateState } from './validate-state';
import { BehaviorSubject } from 'rxjs'
import { ConflictResolution } from './conflict-resolution';

// DocOpts defaults for document load operations
const DEFAULT_LOAD_DOCOPTS = {anchor: false, publish: false, sync: true}
// DocOpts defaults for document write operations
const DEFAULT_WRITE_DOCOPTS = {anchor: true, publish: true, sync: false}

/**
 * Document handles the update logic of the Doctype instance
 */
export class Document extends EventEmitter implements DocStateHolder {
  readonly id: DocID
  private _applyQueue: PQueue
  private readonly state$: BehaviorSubject<DocState>
  private _doctype: Doctype
  private _logger: DiagnosticsLogger
  private readonly subscriptionSet = new SubscriptionSet();
  private readonly conflictResolution: ConflictResolution;

  constructor (initialState: DocState,
               public dispatcher: Dispatcher,
               public pinStore: PinStore,
               private _validate: boolean,
               private _context: Context,
               private _doctypeHandler: DoctypeHandler<Doctype>,
               private isReadOnly = false) {
    super()
    this.state$ = new BehaviorSubject(initialState)
    const doctype = new _doctypeHandler.doctype(initialState, _context)
    this._doctype = isReadOnly ? DoctypeUtils.makeReadOnly(doctype) : doctype
    this.state$.pipe(distinctUntilChanged()).subscribe(state => {
      this._doctype.state = state;
      this._doctype.emit('change');
    })

    this.id = new DocID(initialState.doctype, initialState.log[0].cid)

    this._logger = _context.loggerProvider.getDiagnosticsLogger()

    this._applyQueue = new PQueue({ concurrency: 1 })
    this.conflictResolution = new ConflictResolution(_context, dispatcher, _doctypeHandler, _validate);
  }

  /**
   * Creates new Doctype with params
   * @param docId - Document ID
   * @param doctypeHandler - DoctypeHandler instance
   * @param dispatcher - Dispatcher instance
   * @param pinStore - PinStore instance
   * @param context - Ceramic context
   * @param opts - Initialization options
   * @param validate - Validate content against schema
   */
  static async create<T extends Doctype> (
      docId: DocID,
      doctypeHandler: DoctypeHandler<Doctype>,
      dispatcher: Dispatcher,
      pinStore: PinStore,
      context: Context,
      opts: DocOpts = {},
      validate = true,
  ): Promise<Document> {
    // Fill 'opts' with default values for any missing fields
    opts = {...DEFAULT_WRITE_DOCOPTS, ...opts}

    const genesis = await dispatcher.retrieveCommit(docId.cid)
    const state = await doctypeHandler.applyCommit(genesis, docId.cid, context)
    const doc = new Document(state, dispatcher, pinStore, validate, context, doctypeHandler)

    if (validate) {
      await validateState(doc.state, doc.doctype.content, context.api.loadDocument.bind(context.api))
    }

    return Document._syncDocumentToCurrent(doc, pinStore, opts)
  }

  /**
   * Loads the Doctype by id
   * @param id - Document ID
   * @param handler - find handler
   * @param dispatcher - Dispatcher instance
   * @param pinStore - PinStore instance
   * @param context - Ceramic context
   * @param opts - Initialization options
   * @param validate - Validate content against schema
   */
  static async load<T extends Doctype> (
      id: DocID,
      handler: DoctypeHandler<T>,
      dispatcher: Dispatcher,
      pinStore: PinStore,
      context: Context,
      opts: DocOpts = {},
      validate = true): Promise<Document> {
    // Fill 'opts' with default values for any missing fields
    opts = {...DEFAULT_LOAD_DOCOPTS, ...opts}

    const doc = await Document._loadGenesis(id, handler, dispatcher, pinStore, context, validate)
    return await Document._syncDocumentToCurrent(doc, pinStore, opts)
  }

  /**
   * Takes a document containing only the genesis commit and kicks off the process to load and apply
   * the most recent Tip to it.
   * @param doc - Document containing only the genesis commit
   * @param pinStore
   * @param opts
   * @private
   */
  static async _syncDocumentToCurrent(doc: Document, pinStore: PinStore, opts: DocOpts): Promise<Document> {
    // TODO: Assert that doc contains only the genesis commit
    const id = doc.id

    // Update document state to cached state if any
    const pinnedState = await pinStore.stateStore.load(id)
    if (pinnedState) {
      doc._doctype.state = pinnedState
    }

    // Request current tip from pub/sub system and register for future updates
    await doc._register(opts)
    return doc
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
    return new Document(resetState, this.dispatcher, this.pinStore, this._validate, this._context, this._doctypeHandler, true)
  }

  /**
   * Loads the genesis commit and builds a Document object off it, but does not register for updates
   * or apply any additional commits past the genesis commit.
   * @param id - Document id
   * @param handler
   * @param dispatcher
   * @param pinStore
   * @param context
   * @param validate
   * @private
   */
  private static async _loadGenesis<T extends Doctype>(
      id: DocID,
      handler: DoctypeHandler<T>,
      dispatcher: Dispatcher,
      pinStore: PinStore,
      context: Context,
      validate: boolean) {
    const commit = await dispatcher.retrieveCommit(id.cid)
    if (commit == null) {
      throw new Error(`No genesis commit found with CID ${id.cid.toString()}`)
    }
    const state = await handler.applyCommit(commit, id.cid, context)
    const doc = new Document(state, dispatcher, pinStore, validate, context, handler)

    if (validate) {
      await validateState(doc.state, doc.doctype.content, context.api.loadDocument.bind(context.api))
    }

    return doc
  }

  /**
   * Applies commit to the existing Doctype
   *
   * @param commit - Commit data
   * @param opts - Document initialization options (request anchor, wait, etc.)
   */
  async applyCommit (commit: any, opts: DocOpts = {}): Promise<void> {
    // Fill 'opts' with default values for any missing fields
    opts = {...DEFAULT_WRITE_DOCOPTS, ...opts}

    const cid = await this.dispatcher.storeCommit(commit)

    await this._handleTip(cid)
    await this._updateStateIfPinned()
    await this._applyOpts(opts)
  }

  /**
   * Register document to the Dispatcher
   *
   * @param opts - Document initialization options (request anchor, wait, etc.)
   * @private
   */
  async _register (opts: DocOpts): Promise<void> {
    this.on('update', this._update)

    await this.dispatcher.register(this)

    await this._applyOpts(opts)
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
    if (sync) {
      await this._wait()
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
  async _update(cid: CID): Promise<void> {
    try {
      await this._handleTip(cid)
    } catch (e) {
      this._logger.err(e)
    }
  }

  /**
   * Handles Tip from the PubSub topic
   *
   * @param cid - Document Tip CID
   * @private
   */
  async _handleTip(cid: CID): Promise<void> {
    await this._applyQueue.add(async () => {
      const next = await this.conflictResolution.applyTip(this.state$.value, cid);
      if (next) {
        this.state$.next(next);
      }
    });
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
    const subscription = anchorStatus$
        .pipe(
            concatMap(async (asr) => {
              switch (asr.status) {
                case AnchorStatus.PENDING: {
                  const next = {
                    ...this.state$.value,
                    anchorStatus: AnchorStatus.PENDING,
                  }
                  if (asr.anchorScheduledFor) next.anchorScheduledFor = asr.anchorScheduledFor
                  this.state$.next(next)
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
                  this.state$.next({ ...this.state$.value, anchorStatus: AnchorStatus.FAILED })
                  subscription.unsubscribe();
                  return;
                }
                default:
                  throw new UnreachableCaseError(asr, 'Unknown anchoring state')
              }
            })
        )
        .subscribe();
    this.subscriptionSet.add(subscription);
  }

  /**
   * Gets document state
   */
  get state (): DocState {
    return this._doctype.state
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
  async _wait(): Promise<void> {
    // add response timeout for network change
    return new Promise(resolve => {
      let tid: any // eslint-disable-line prefer-const
      const clear = async (): Promise<void> => {
        clearTimeout(tid)
        this._doctype.off('change', clear)
        await this._applyQueue.onEmpty()
        resolve()
      }
      tid = setTimeout(clear, 3000)
      this._doctype.on('change', clear)
    })
  }

  /**
   * Gracefully closes the document instance.
   */
  async close (): Promise<void> {
    this.subscriptionSet.close();
    this.off('update', this._update)

    this.dispatcher.unregister(this.id)

    await this._applyQueue.onIdle()
    this.state$.complete();
  }

  /**
   * Serializes the document content
   */
  toString (): string {
    return JSON.stringify(this.state$.value.content)
  }
}
