import Dispatcher from './dispatcher'
import CID from 'cids'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import cloneDeep from 'lodash.clonedeep'
import AnchorServiceResponse from './anchor/anchor-service-response'
import Utils from './utils'
import {
  AnchorProof,
  AnchorRecord,
  AnchorStatus,
  DocState,
  LogEntry,
  Doctype,
  DoctypeHandler,
  DocOpts,
  Context,
  DoctypeUtils,
  DocMetadata,
  RootLogger,
  Logger,
} from '@ceramicnetwork/common'
import DocID from '@ceramicnetwork/docid'
import { PinStore } from './store/pin-store';

// DocOpts defaults for document load operations
const DEFAULT_LOAD_DOCOPTS = {anchor: false, publish: false, sync: true}
// DocOpts defaults for document write operations
const DEFAULT_WRITE_DOCOPTS = {anchor: true, publish: true, sync: false}

/**
 * Document handles the update logic of the Doctype instance
 */
class Document extends EventEmitter {
  private _genesisCid: CID
  private _applyQueue: PQueue

  public readonly commit: CID

  private _logger: Logger
  private _isProcessing: boolean

  constructor (public readonly id: DocID,
               public dispatcher: Dispatcher,
               public pinStore: PinStore,
               private _validate: boolean,
               private _context: Context,
               private _doctypeHandler: DoctypeHandler<Doctype>,
               private _doctype: Doctype) {
    super()
    this.commit = id.commit

    this._logger = RootLogger.getLogger(Document.name)

    this._applyQueue = new PQueue({ concurrency: 1 })
    this._genesisCid = id.cid
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

    const doctype = new doctypeHandler.doctype(null, context) as T
    const doc = new Document(docId, dispatcher, pinStore, validate, context, doctypeHandler, doctype)

    const genesis = await dispatcher.retrieveRecord(docId.cid)
    doc._doctype.state = await doc._doctypeHandler.applyRecord(genesis, doc._genesisCid, context)

    if (validate) {
      const schema = await Document.loadSchema(context, doc._doctype)
      if (schema) {
        Utils.validate(doc._doctype.content, schema)
      }
    }

    await doc._updateStateIfPinned()
    await doc._register(opts)
    return doc
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

    if (!id.commit) {
      // No commit requested, so we should load the most current commit we can find.
      return await Document._syncDocumentToCurrent(doc, pinStore, opts)
    } else {
      // Requested document at a specific commit
      return await Document._syncDocumentToCommit(doc, id.commit, dispatcher)
    }
  }

  /**
   * Takes a document containing only the genesis record and kicks off the process to load and apply
   * the most recent Tip to it.
   * @param doc - Document containing only the genesis record
   * @param pinStore
   * @param opts
   */
  static async _syncDocumentToCurrent(doc: Document, pinStore: PinStore, opts: DocOpts): Promise<Document> {
    // TODO: Assert that doc contains only the genesis record
    const id = doc.id

    // Update document state to cached state if any
    const isStored = await pinStore.stateStore.exists(id)
    if (isStored) {
      doc._doctype.state = await pinStore.stateStore.load(id)
    }

    // Request current tip from pub/sub system and register for future updates
    await doc._register(opts)
    return doc
  }

  /**
   * Takes a document containing only the genesis record and syncs the document to the state as
   * of the specific commit requested.  Intentionally does not register the document so that it
   * does not get notifications about newer commits, since we want a specific commit here.
   * @param doc - Document containing only the genesis record
   * @param tip - CID of the Tip record that we want to load the document at
   * @param dispatcher
   */
  static async _syncDocumentToCommit<T extends Doctype> (
      doc: Document,
      tip: CID,
      dispatcher: Dispatcher): Promise<Document> {
    // TODO: Assert that doc contains only the genesis record

    if (tip.equals(doc.id.cid)) {
      // The commit is the same as the genesis record CID, so nothing more to do after loading
      // the genesis commit of the document.
      doc._doctype = DoctypeUtils.makeReadOnly<T>(doc.doctype as T)
      return doc
    }

    // Load the requested commit record
    const commitRecord = await dispatcher.retrieveRecord(tip)
    if (commitRecord == null) {
      throw new Error(`No record found for CID ${tip.toString()}`)
    }

    await doc._handleTip(tip) // sync document to the requested tip

    doc._doctype = DoctypeUtils.makeReadOnly<T>(doc.doctype as T)
    return doc
  }

  /**
   * Loads the genesis record and builds a Document object off it, but does not register for updates
   * or apply any additional records past the genesis record.
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
    const doctype = new handler.doctype(null, context) as T
    const doc = new Document(id, dispatcher, pinStore, validate, context, handler, doctype)

    const record = await dispatcher.retrieveRecord(doc._genesisCid)
    doc._doctype.state = await doc._doctypeHandler.applyRecord(record, doc._genesisCid, context)

    if (validate) {
      const schema = await Document.loadSchema(context, doc._doctype)
      if (schema) {
        Utils.validate(doc._doctype.content, schema)
      }
    }

    return doc
  }

  /**
   * Applies record to the existing Doctype
   *
   * @param record - Record data
   * @param opts - Document initialization options (request anchor, wait, etc.)
   */
  async applyRecord (record: any, opts: DocOpts = {}): Promise<void> {
    // Fill 'opts' with default values for any missing fields
    opts = {...DEFAULT_WRITE_DOCOPTS, ...opts}

    const cid = await this.dispatcher.storeRecord(record)

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
      await this.anchor()
    }
    if (publish) {
      await this._publishTip()
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
    const isPinned = await this.pinStore.stateStore.exists(this.id)
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
      this._logger.error(e)
    } finally {
      this._isProcessing = false
    }
  }

  /**
   * Handles Tip from the PubSub topic
   *
   * @param cid - Document Tip CID
   * @private
   */
  async _handleTip(cid: CID): Promise<void> {
    try {
      this._isProcessing = true
      await this._applyQueue.add(async () => {
        const log = await this._fetchLog(cid)
        if (log.length) {
          const updated = await this._applyLog(log)
          if (updated) {
            this._doctype.emit('change')
          }
        }
      })
    } finally {
      this._isProcessing = false
    }
  }

  /**
   * Fetch log to find a connection for the given CID
   *
   * @param cid - Record CID
   * @param log - Found log so far
   * @private
   */
  async _fetchLog (cid: CID, log: Array<CID> = []): Promise<Array<CID>> {
    if (await this._isCidIncluded(cid, this._doctype.state.log)) { // already processed
      return []
    }
    const record = await this.dispatcher.retrieveRecord(cid)
    let payload = record
    if (DoctypeUtils.isSignedRecord(record)) {
      payload = await this.dispatcher.retrieveRecord(record.link)
    }
    const prevCid: CID = payload.prev
    if (!prevCid) { // this is a fake log
      return []
    }
    log.unshift(cid)
    if (await this._isCidIncluded(prevCid, this._doctype.state.log)) {
      // we found the connection to the canonical log
      return log
    }
    return this._fetchLog(prevCid, log)
  }

  /**
   * Find index of the record in the array. If the record is signed, fetch the payload
   *
   * @param cid - CID value
   * @param log - Log array
   * @private
   */
  async _findIndex(cid: CID, log: Array<LogEntry>): Promise<number> {
    // const conflictIdx = this._doctype.state.log.findIndex(x => x.equals(record.prev)) + 1
    for (let index = 0; index < log.length; index++) {
      const c = log[index].cid
      if (c.equals(cid)) {
        return index
      }
      const record = await this.dispatcher.retrieveRecord(c)
      if (DoctypeUtils.isSignedRecord(record) && record.link.equals(cid)) {
        return index
      }
    }
    return -1
  }

  /**
   * Is CID included in the log. If the record is signed, fetch the payload
   *
   * @param cid - CID value
   * @param log - Log array
   * @private
   */
  async _isCidIncluded(cid: CID, log: Array<LogEntry>): Promise<boolean> {
    return (await this._findIndex(cid, log)) !== -1
  }

  /**
   * Given two different DocStates representing two different conflicting histories of the same
   * document, pick which commit to accept, in accordance with our conflict resolution strategy
   * @param state1 - first log's state
   * @param state2 - second log's state
   * @returns true if state2's log should be taken, or false if state1's log should be taken
   * @private
   */
  static async _pickLogToAccept(state1: DocState, state2: DocState): Promise<boolean> {
    const isState1Anchored = state1.anchorStatus === AnchorStatus.ANCHORED
    const isState2Anchored = state2.anchorStatus === AnchorStatus.ANCHORED

    if (isState1Anchored != isState2Anchored) {
      // When one of the logs is anchored but not the other, take the one that is anchored
      return isState2Anchored
    }

    if (isState1Anchored && isState2Anchored) {
      // compare anchor proofs if both states are anchored
      const { anchorProof: proof1 } = state1
      const { anchorProof: proof2 } = state2

      if (proof1.chainId != proof2.chainId) {
        // TODO: Add logic to handle conflicting updates anchored on different chains
        throw new Error("Conflicting logs on the same document are anchored on different chains. Chain1: " +
            proof1.chainId + ", chain2: " + proof2.chainId)
      }

      // Compare block heights to decide which to take
      if (proof1.blockNumber < proof2.blockNumber) {
        return false
      } else if (proof2.blockNumber < proof1.blockNumber) {
        return true
      }
      // If they have the same block number fall through to fallback mechanism
    }

    // The anchor states are the same for both logs. Compare log lengths and choose the one with longer length.
    if (state1.log.length > state2.log.length) {
      return true
    } else if (state1.log.length < state2.log.length) {
      return false
    }

    // If we got this far, that means that we don't have sufficient information to make a good
    // decision about which log to choose.  The most common way this can happen is that neither log
    // is anchored, although it can also happen if both are anchored but in the same blockNumber or
    // blockTimestamp. At this point, the decision of which log to take is arbitrary, but we want it
    // to still be deterministic. Therefore, we take the log whose first entry has the lowest CID.
    return state1.log[0].cid.bytes > state2.log[0].cid.bytes
  }

  /**
   * Applies the log to the document
   *
   * @param log - Log of record CIDs
   * @return true if the log resulted in an update to this document's state, false if not
   * @private
   */
  async _applyLog (log: Array<CID>): Promise<boolean> {
    if (log[log.length - 1].equals(this.tip)) {
      // log already applied
      return false
    }
    const cid = log[0]
    const record = await this.dispatcher.retrieveRecord(cid)
    let payload = record
    if (DoctypeUtils.isSignedRecord(record)) {
      payload = await this.dispatcher.retrieveRecord(record.link)
    }
    if (payload.prev.equals(this.tip)) {
      // the new log starts where the previous one ended
      this._doctype.state = await this._applyLogToState(log, cloneDeep(this._doctype.state))
      return true
    }

    // we have a conflict since prev is in the log of the local state, but isn't the tip
    // BEGIN CONFLICT RESOLUTION
    const conflictIdx = await this._findIndex(payload.prev, this._doctype.state.log) + 1
    const canonicalLog = this._doctype.state.log.map(({cid}) => cid) // copy log
    const localLog = canonicalLog.splice(conflictIdx)
    // Compute state up till conflictIdx
    let state: DocState = await this._applyLogToState(canonicalLog)
    // Compute next transition in parallel
    const localState = await this._applyLogToState(localLog, cloneDeep(state), true)
    const remoteState = await this._applyLogToState(log, cloneDeep(state), true)

    const applyRemoteLog = await Document._pickLogToAccept(localState, remoteState)
    if (!applyRemoteLog) {
      return false
    }

    state = await this._applyLogToState(log, cloneDeep(state))
    this._doctype.state = state
    return true
  }

  /**
   * Applies the log to the document and updates the state
   *
   * @param log - Log of record CIDs
   * @param state - Document state
   * @param breakOnAnchor - Should break apply on anchor record?
   * @private
   */
  async _applyLogToState (log: Array<CID>, state?: DocState, breakOnAnchor?: boolean): Promise<DocState> {
    const itr = log.entries()
    let entry = itr.next()
    while(!entry.done) {
      const cid = entry.value[1]
      const record = await this.dispatcher.retrieveRecord(cid)
      // TODO - should catch potential thrown error here

      let payload = record
      if (DoctypeUtils.isSignedRecord(record)) {
        payload = await this.dispatcher.retrieveRecord(record.link)
      }

      if (payload.proof) {
        // it's an anchor record
        await this._verifyAnchorRecord(record)
        state = await this._doctypeHandler.applyRecord(record, cid, this._context, state)
      } else if (!payload.prev) {
        // it's a genesis record
        if (this._validate) {
          const schemaId = payload.header?.schema
          if (schemaId) {
            const schema = await Document.loadSchemaById(this._context, schemaId)
            if (schema) {
              Utils.validate(payload.content, schema)
            }
          }
        }
        state = await this._doctypeHandler.applyRecord(record, cid, this._context)
      } else {
        // it's a signed record
        const tmpState = await this._doctypeHandler.applyRecord(record, cid, this._context, state)
        if (this._validate) {
          const schemaId = payload.header?.schema
          if (schemaId) {
            const schema = await Document.loadSchemaById(this._context, schemaId)
            if (schema) {
              Utils.validate(tmpState.next.content, schema)
            }
          }
        }
        state = tmpState // if validation is successful
      }

      if (breakOnAnchor && AnchorStatus.ANCHORED === state.anchorStatus) {
        return state
      }
      entry = itr.next()
    }
    return state
  }

  /**
   * Verifies anchor record structure
   *
   * @param record - Anchor record
   * @private
   */
  async _verifyAnchorRecord (record: AnchorRecord): Promise<AnchorProof> {
    const proofRecord =  await this.dispatcher.retrieveRecord(record.proof)

    let prevRootPathRecord
    try {
      // optimize verification by using ipfs.dag.tree for fetching the nested CID
      if (record.path.length === 0) {
        prevRootPathRecord = proofRecord.root
      } else {
        const subPath: string = '/root/' + record.path.substr(0, record.path.lastIndexOf('/'))
        const last: string = record.path.substr(record.path.lastIndexOf('/') + 1)

        prevRootPathRecord = await this.dispatcher.retrieveRecord(record.proof.toString() + subPath)
        prevRootPathRecord = prevRootPathRecord[last]
      }
    } catch (e) {
      throw new Error(`The anchor record couldn't be verified. Reason ${e.message}`)
    }

    if (record.prev.toString() !== prevRootPathRecord.toString()) {
      throw new Error(`The anchor record proof ${record.proof.toString()} with path ${record.path} points to invalid 'prev' record`)
    }

    const proof: AnchorProof = await this.dispatcher.retrieveRecord(record.proof)
    await this._context.anchorService.validateChainInclusion(proof)
    return proof
  }

  /**
   * Publishes Tip record to the pub/sub
   *
   * @private
   */
  async _publishTip (): Promise<void> {
    await this.dispatcher.publishTip(this.id, this.tip)
  }

  /**
   * Request anchor for the latest document state
   */
  async anchor (): Promise<void> {
    this._context.anchorService.on(this.id.toString(), async (asr: AnchorServiceResponse): Promise<void> => {
      switch (asr.status) {
        case 'PENDING': {
          const state = this._doctype.state
          state.anchorScheduledFor = asr.anchorScheduledFor
          this._doctype.state = state
          await this._updateStateIfPinned()
          return
        }
        case 'PROCESSING': {
          const state = this._doctype.state
          state.anchorStatus = AnchorStatus.PROCESSING
          this._doctype.state = state
          await this._updateStateIfPinned()
          return
        }
        case 'COMPLETED': {
          const state = this._doctype.state
          state.anchorStatus = AnchorStatus.ANCHORED
          this._doctype.state = state
          await this._handleTip(asr.anchorRecord)
          await this._updateStateIfPinned()
          await this._publishTip()

          this._context.anchorService.removeAllListeners(this.id.toString())
          return
        }
        case 'FAILED': {
          const state = this._doctype.state
          state.anchorStatus = AnchorStatus.FAILED
          this._doctype.state = state
          this._context.anchorService.removeAllListeners(this.id.toString())
          return
        }
      }
    })
    await this._context.anchorService.requestAnchor(this.id.toString(), this.tip)
    const state = this._doctype.state
    state.anchorStatus = AnchorStatus.PENDING
    this._doctype.state = state
  }

  /**
   * Loads schema for the Doctype
   *
   * @param context - Ceramic context
   * @param doctype - Doctype instance
   */
  static async loadSchema<T extends Doctype>(context: Context, doctype: Doctype): Promise<T> {
    return doctype.state?.metadata?.schema ? Document.loadSchemaById(context, doctype.state.metadata.schema) : null
  }

  /**
   * Loads schema by ID
   *
   * @param context - Ceramic context
   * @param schemaDocId - Schema document ID
   */
  static async loadSchemaById<T extends Doctype>(context: Context, schemaDocId: string): Promise<T> {
    if (schemaDocId) {
      const schemaDocIdParsed = DocID.fromString(schemaDocId)
      if (!schemaDocIdParsed.commit) {
        throw new Error("Commit missing when loading schema document")
      }
      const schemaDoc = await context.api.loadDocument(schemaDocId)
      return schemaDoc.content
    }
    return null
  }

  /**
   * Gets document content
   */
  get content (): any {
    const { next, content } = this._doctype.state
    return next?.content ?? content
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
   * Gets document Tip record CID
   */
  get tip (): CID {
    return this._doctype.tip
  }

  /**
   * Gets document controllers
   */
  get controllers (): string[] {
    return this._doctype.controllers
  }

  /**
   * Gets document metadata
   */
  get metadata (): DocMetadata {
    return this._doctype.metadata
  }

  get commitId(): DocID {
    return this._doctype.commitId
  }

  get allCommitIds(): Array<DocID> {
    return this._doctype.allCommitIds
  }

  get anchorCommitIds(): Array<DocID> {
    return this._doctype.anchorCommitIds
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
      const clear = (): void => {
        clearTimeout(tid)
        this._doctype.off('change', clear)
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
    this.off('update', this._update)

    this.dispatcher.unregister(this.id.toString())

    await this._applyQueue.onEmpty()

    this._context.anchorService.removeAllListeners(this.id.toString())
    await Utils.awaitCondition(() => this._isProcessing, () => false, 500)
  }

  /**
   * Serializes the document content
   */
  toString (): string {
    return JSON.stringify(this._doctype.state.content)
  }
}

export default Document
