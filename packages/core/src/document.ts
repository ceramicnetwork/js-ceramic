import Dispatcher from './dispatcher'
import CID from 'cids'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import cloneDeep from 'lodash.clonedeep'
import AnchorServiceResponse from './anchor/anchor-service-response'
import Utils from './utils'
import {
  AnchorProof,
  AnchorCommit,
  AnchorStatus,
  DocState,
  LogEntry,
  Doctype,
  DoctypeHandler,
  DocOpts,
  Context,
  DoctypeUtils,
  CeramicApi,
  DocMetadata,
  RootLogger,
  Logger,
} from '@ceramicnetwork/common'
import DocID from '@ceramicnetwork/docid'
import { PinStore } from './store/pin-store';

/**
 * Document handles the update logic of the Doctype instance
 */
class Document extends EventEmitter {
  private _genesisCid: CID
  private _applyQueue: PQueue

  private _doctype: Doctype
  private _doctypeHandler: DoctypeHandler<Doctype>

  public _context: Context

  public readonly id: DocID
  public readonly version: CID

  private _logger: Logger
  private _isProcessing: boolean

  constructor (id: DocID, public dispatcher: Dispatcher, public pinStore: PinStore, private _validate: boolean) {
    super()
    this.id = id
    this.version = id.version

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
    const genesis = await dispatcher.retrieveCommit(docId.cid)
    const doc = new Document(docId, dispatcher, pinStore, validate)

    doc._context = context
    doc._doctypeHandler = doctypeHandler

    doc._doctype = new doctypeHandler.doctype(null, context) as T
    doc._doctype.state = await doc._doctypeHandler.applyCommit(genesis, doc._genesisCid, context)

    if (validate) {
      const schema = await Document.loadSchema(context.api, doc._doctype)
      if (schema) {
        Utils.validate(doc._doctype.content, schema)
      }
    }

    await doc._updateStateIfPinned()

    if (typeof opts.applyOnly === 'undefined') {
      opts.applyOnly = false
    }

    await doc._register(opts)
    return doc
  }

  /**
   * Loads the Doctype by id
   * @param id - Document ID
   * @param findHandler - find handler fn
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
      validate = true
  ): Promise<Document> {
    const doc = new Document(id, dispatcher, pinStore, validate)
    doc._context = context

    if (typeof opts.applyOnly === 'undefined') {
      opts.applyOnly = true
    }

    const commit = await dispatcher.retrieveCommit(doc._genesisCid)

    let payload
    if (DoctypeUtils.isSignedCommit(commit)) {
      payload = await dispatcher.retrieveCommit(commit.link)
    } else {
      payload = commit
    }

    doc._doctypeHandler = handler
    doc._doctype = new doc._doctypeHandler.doctype(null, context) as T

    const isStored = await pinStore.stateStore.exists(id)
    if (isStored) {
      doc._doctype.state = await pinStore.stateStore.load(id)
    }

    if (doc._doctype.state == null) {
      // apply genesis commit if there's no state preserved
      doc._doctype.state = await doc._doctypeHandler.applyCommit(commit, doc._genesisCid, context)
    }

    if (validate) {
      const schema = await Document.loadSchema(context.api, doc._doctype)
      if (schema) {
        Utils.validate(doc._doctype.content, schema)
      }
    }

    await doc._register(opts)
    return doc
  }

  /**
   * Validate Doctype against schema
   */
  async validate(): Promise<void> {
    const schemaDocId = this.state?.metadata?.schema
    if (schemaDocId) {
      const schemaDoc = await this._context.api.loadDocument(schemaDocId)
      if (!schemaDoc) {
        throw new Error(`Schema not found for ${schemaDocId}`)
      }
      Utils.validate(this.content, schemaDoc.content)
    }
  }

  /**
   * Loads a specific version of the Doctype
   *
   * @param version - Document version
   */
  async loadVersion<T extends Doctype>(version: CID): Promise<T> {
    const doc = await Document.loadVersion<T>(this, version, this._validate)
    return doc.doctype as T
  }

  /**
   * Loads a specific version of the Doctype
   *
   * @param doc - Document instance
   * @param version - Document version
   * @param validate - Validate content against schema
   */
  static async loadVersion<T extends Doctype>(doc: Document, version: CID, validate = true): Promise<Document> {
    const { _context: context, dispatcher, pinStore, _doctypeHandler: doctypeHandler } = doc

    const isGenesis = version.equals(doc._genesisCid)

    if (!isGenesis) {
      const versionCommit = await dispatcher.retrieveCommit(version)
      if (versionCommit == null) {
        throw new Error(`No commit found for version ${version.toString()}`)
      }

      // check if it's not an anchor commit
      if (versionCommit.proof == null) {
        throw new Error(`No anchor commit for version ${version.toString()}`)
      }
    }

    const docid = DocID.fromBytes(doc.id.bytes, version)

    const document = new Document(docid, dispatcher, pinStore, validate)
    document._context = context
    document._doctypeHandler = doctypeHandler
    document._doctype = new doc._doctypeHandler.doctype(null, context)

    const genesisCommit = await document.dispatcher.retrieveCommit(doc._genesisCid)
    document._doctype.state = await doc._doctypeHandler.applyCommit(genesisCommit, doc._genesisCid, context)

    if (!isGenesis) {
      await document._handleTip(version) // sync version
      document._doctype = DoctypeUtils.makeReadOnly<T>(document.doctype as T)
    }
    return document
  }

  /**
   * Applies commit to the existing Doctype
   *
   * @param commit - Record data
   * @param opts - Document initialization options (request anchor, wait, etc.)
   */
  async applyCommit (commit: any, opts: DocOpts = {}): Promise<void> {
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
    this.on('tipreq', this._publishTip)

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
    if (!opts.applyOnly) {
      await this.anchor()
      this._publishTip()
    } else if (!opts.skipWait) {
      await Document.wait(this)
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
    const commit = await this.dispatcher.retrieveCommit(cid)
    let payload = commit
    if (DoctypeUtils.isSignedCommit(commit)) {
      payload = await this.dispatcher.retrieveCommit(commit.link)
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
   * Find index of the commit in the array. If the commit is signed, fetch the payload
   *
   * @param cid - CID value
   * @param log - Log array
   * @private
   */
  async _findIndex(cid: CID, log: Array<LogEntry>): Promise<number> {
    // const conflictIdx = this._doctype.state.log.findIndex(x => x.equals(commit.prev)) + 1
    for (let index = 0; index < log.length; index++) {
      const c = log[index].cid
      if (c.equals(cid)) {
        return index
      }
    }
    return -1
  }

  /**
   * Is CID included in the log. If the commit is signed, fetch the payload
   *
   * @param cid - CID value
   * @param log - Log array
   * @private
   */
  async _isCidIncluded(cid: CID, log: Array<LogEntry>): Promise<boolean> {
    return (await this._findIndex(cid, log)) !== -1
  }

  /**
   * Applies the log to the document.
   * Utilizes conflict resolution rules if log doesn't cleanly apply to current state.
   *
   * @param remoteLog - Log of commit CIDs
   * @returns - true if the remote log is applied, false if we stick with the current local log.
   * @private
   */
  async _applyLog (remoteLog: Array<CID>): Promise<boolean> {
    if (remoteLog[remoteLog.length - 1].equals(this.tip)) {
      // log already applied
      return false
    }
    const firstRemoteCommitCID = remoteLog[0]
    const firstRemoteCommit = await this.commitLoader.retrieveCommit(firstRemoteCommitCID)
    if (firstRemoteCommit.prev.equals(this.tip)) {
      // the new log starts where the previous one ended.  Apply the remote log cleanly on top
      // of our current local log.
      this.state = await this._applyLogToState(remoteLog, cloneDeep(this.state))
      return true
    }
    
    // We have a conflict. Before getting into this function we already confirmed that
    // the 'prev' pointer from the earliest commit in the remote log does point to some valid
    // commit in our local log.  But since it doesn't point to the *most recent* commit in our
    // local log, that means it represents a different branch of history for this stream.
    //
    // Since there is no way to merge histories currently, we will need to pick one branch of
    // history to survive, and discard the other branch - losing all writes from the discarded
    // branch.
    //
    // Example of conflict situation where the first two commits are the same, but the last two
    // commits diverge:
    //
    // [A] <- [B] <- [C] <- [D]          <= Our local log
    //          ^--- [E] <- [F]          <= The remote log.

    // Find the index where the logs begin to diverge
    const conflictIdx = await this._findIndex(firstRemoteCommit.prev, this.state.log) + 1

    // The part of the log that is shared between both histories
    const canonicalLog = this.state.log.map(({ cid }) => cid) // copy log

    // The extra part of our local log, after the conflict point
    const localLog = canonicalLog.splice(conflictIdx)

    // Compute state up till conflictIdx
    const canonicalState: DocState = await this._applyLogToState(canonicalLog)

    // Compute both localState (what we currently have) and remoteState
    // (what we would get from applying the log).
    const localState = await this._applyLogToState(localLog, cloneDeep(canonicalState), true)
    const remoteState = await this._applyLogToState(remoteLog, cloneDeep(canonicalState), true)

    const isLocalAnchored = localState.anchorStatus === AnchorStatus.ANCHORED
    const isRemoteAnchored = remoteState.anchorStatus === AnchorStatus.ANCHORED

    if (isLocalAnchored && isRemoteAnchored) {
      const { anchorProof: localProof } = localState
      const { anchorProof: remoteProof } = remoteState

      if (remoteProof.blockTimestamp < localProof.blockTimestamp) {
        this.state = await this._applyLogToState(remoteLog, cloneDeep(canonicalState))
        return true
      }
    }

    if (!isLocalAnchored && isRemoteAnchored) {
      this.state = await this._applyLogToState(remoteLog, cloneDeep(canonicalState))
      return true
    }

    if (!isLocalAnchored && !isRemoteAnchored) {
      this.state = await this._applyLogToState(remoteLog, cloneDeep(canonicalState))
      return true
    }

    return false
  }

  /**
   * Applies the log to the document and updates the state
   *
   * @param log - Log of commit CIDs
   * @param state - Document state
   * @param breakOnAnchor - Should break apply on anchor commit?
   * @private
   */
  async _applyLogToState (log: Array<CID>, state?: DocState, breakOnAnchor?: boolean): Promise<DocState> {
    const itr = log.entries()
    let entry = itr.next()
    while(!entry.done) {
      const cid = entry.value[1]
      const commit = await this.dispatcher.retrieveCommit(cid)
      // TODO - should catch potential thrown error here

      if (commit.proof) {
        // it's an anchor commit
        await this._verifyAnchorCommit(commit)
        state = await this._doctypeHandler.applyCommit(commit, cid, this._context, state)
      } else if (!commit.prev) {
        // it's a genesis commit
        if (this.validate) {
          const schemaId = commit.header?.schema
          if (schemaId) {
            const schema = await Document.loadSchemaById(this._context.api, schemaId)
            if (schema) {
              Utils.validate(commit.content, schema)
            }
          }
        }
        state = await this._doctypeHandler.applyCommit(commit, cid, this._context)
      } else {
        // it's a signed commit
        const tmpState = await this._doctypeHandler.applyCommit(commit, cid, this._context, state)
        if (this.validate) {
          const schemaId = commit.header?.schema
          if (schemaId) {
            const schema = await Document.loadSchemaById(this._context.api, schemaId)
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
   * Verifies anchor commit structure
   *
   * @param commit - Anchor commit
   * @private
   */
  async _verifyAnchorCommit (commit: AnchorCommit): Promise<AnchorProof> {
    const proofCommit =  await this.dispatcher.retrieveCommit(commit.proof)

    let prevRootPathCommit
    try {
      // optimize verification by using ipfs.dag.tree for fetching the nested CID
      if (commit.path.length === 0) {
        prevRootPathCommit = proofCommit.root
      } else {
        const subPath: string = '/root/' + commit.path.substr(0, commit.path.lastIndexOf('/'))
        const last: string = commit.path.substr(commit.path.lastIndexOf('/') + 1)

        prevRootPathCommit = await this.dispatcher.retrieveCommit(commit.proof.toString() + subPath)
        prevRootPathCommit = prevRootPathCommit[last]
      }
    } catch (e) {
      throw new Error(`The anchor commit couldn't be verified. Reason ${e.message}`)
    }

    if (commit.prev.toString() !== prevRootPathCommit.toString()) {
      throw new Error(`The anchor commit proof ${commit.proof.toString()} with path ${commit.path} points to invalid 'prev' commit`)
    }

    const proof: AnchorProof = await this.dispatcher.retrieveCommit(commit.proof)
    await this._context.anchorService.validateChainInclusion(proof)
    return proof
  }

  /**
   * Publishes Tip commit to the pub/sub
   *
   * @private
   */
  async _publishTip (): Promise<void> {
    await this.dispatcher.publishTip(this.id.toString(), this.tip, this.doctype.doctype)
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
          await this._handleTip(asr.anchorCommit)
          await this._updateStateIfPinned()
          this._publishTip()

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
   * @param ceramicApi - Ceramic API
   * @param doctype - Doctype instance
   */
  static async loadSchema<T extends Doctype>(ceramicApi: CeramicApi, doctype: Doctype): Promise<T> {
    return doctype.state?.metadata?.schema ? Document.loadSchemaById(ceramicApi, doctype.state.metadata.schema) : null
  }

  /**
   * Loads schema by ID
   *
   * @param ceramicApi - Ceramic API
   * @param schemaDocId - Schema document ID
   */
  static async loadSchemaById<T extends Doctype>(ceramicApi: CeramicApi, schemaDocId: string): Promise<T> {
    if (schemaDocId) {
      const schemaDocIdParsed = DocID.fromString(schemaDocId)
      if (!schemaDocIdParsed.version) {
        throw new Error("Version missing when loading schema document")
      }
      const schemaDoc = await ceramicApi.loadDocument(schemaDocId)
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
   * Alias the Dispatcher as "commitLoader" to make clear how it's used in this file.
   */
  get commitLoader(): Dispatcher {
    return this.dispatcher
  }

  /**
   * Gets document state
   */
  get state (): DocState {
    return this._doctype.state
  }

  /**
   * Set document state
   * @param newState
   */
  set state(newState: DocState) {
    this._doctype.state = newState
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

  get versionId(): DocID {
    return this._doctype.versionId
  }

  get allVersionIds(): Array<DocID> {
    return this._doctype.allVersionIds
  }

  /**
   * Waits for some time in order to propagate
   *
   * @param doc - Document instance
   */
  static async wait(doc: Document): Promise<void> {
    // add response timeout for network change
    return new Promise(resolve => {
      let tid: any // eslint-disable-line prefer-const
      const clear = (): void => {
        clearTimeout(tid)
        doc._doctype.off('change', clear)
        resolve()
      }
      tid = setTimeout(clear, 3000)
      doc._doctype.on('change', clear)
    })
  }

  /**
   * Gracefully closes the document instance.
   */
  async close (): Promise<void> {
    this.off('update', this._update)
    this.off('tipreq', this._publishTip)

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
