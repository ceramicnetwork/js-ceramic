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
    const genesis = await dispatcher.retrieveRecord(docId.cid)
    const doc = new Document(docId, dispatcher, pinStore, validate)

    doc._context = context
    doc._doctypeHandler = doctypeHandler

    doc._doctype = new doctypeHandler.doctype(null, context) as T
    doc._doctype.state = await doc._doctypeHandler.applyRecord(genesis, doc._genesisCid, context)

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

    const record = await dispatcher.retrieveRecord(doc._genesisCid)

    let payload
    if (DoctypeUtils.isSignedRecord(record)) {
      payload = await dispatcher.retrieveRecord(record.link)
    } else {
      payload = record
    }

    doc._doctypeHandler = handler
    doc._doctype = new doc._doctypeHandler.doctype(null, context) as T

    const isStored = await pinStore.stateStore.exists(id)
    if (isStored) {
      doc._doctype.state = await pinStore.stateStore.load(id)
    }

    if (doc._doctype.state == null) {
      // apply genesis record if there's no state preserved
      doc._doctype.state = await doc._doctypeHandler.applyRecord(record, doc._genesisCid, context)
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
   * Lists available versions
   */
  async listVersions(): Promise<CID[]> {
    if (this._doctype.state == null) {
      return []
    }

    const checkPromises: Promise<CID[]>[] = this._doctype.state.log.map(async (cid): Promise<CID[]> => {
      const record = await this.dispatcher.retrieveRecord(cid)
      return record.proof != null ? [cid] : []
    })
    return (await Promise.all(checkPromises)).reduce((acc, recs) => acc.concat(...recs), [])
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
      const versionRecord = await dispatcher.retrieveRecord(version)
      if (versionRecord == null) {
        throw new Error(`No record found for version ${version.toString()}`)
      }

      // check if it's not an anchor record
      if (versionRecord.proof == null) {
        throw new Error(`No anchor record for version ${version.toString()}`)
      }
    }

    const docid = DocID.fromBytes(doc.id.bytes, version)

    const document = new Document(docid, dispatcher, pinStore, validate)
    document._context = context
    document._doctypeHandler = doctypeHandler
    document._doctype = new doc._doctypeHandler.doctype(null, context)

    const genesisRecord = await document.dispatcher.retrieveRecord(doc._genesisCid)
    document._doctype.state = await doc._doctypeHandler.applyRecord(genesisRecord, doc._genesisCid, context)

    if (!isGenesis) {
      await document._handleTip(version) // sync version
      document._doctype = DoctypeUtils.makeReadOnly<T>(document.doctype as T)
    }
    return document
  }

  /**
   * Applies record to the existing Doctype
   *
   * @param record - Record data
   * @param opts - Document initialization options (request anchor, wait, etc.)
   */
  async applyRecord (record: any, opts: DocOpts = {}): Promise<void> {
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
  async _findIndex(cid: CID, log: Array<CID>): Promise<number> {
    // const conflictIdx = this._doctype.state.log.findIndex(x => x.equals(record.prev)) + 1
    for (let index = 0; index < log.length; index++) {
      const c = log[index]
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
  async _isCidIncluded(cid: CID, log: Array<CID>): Promise<boolean> {
    return (await this._findIndex(cid, log)) !== -1
  }

  /**
   * Given two different DocStates representing two different conflicting histories of the same
   * document, pick which version to accept, in accordance with our conflict resolution strategy
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

      if (proof1.chainId == proof2.chainId) {
        // The logs are anchored in the same blockchain, compare block heights to decide which to take
        if (proof1.blockNumber < proof2.blockNumber) {
          return false
        } else if (proof2.blockNumber < proof1.blockNumber) {
          return true
        }
        // If they have the same block number fall through to fallback mechanism
      } else {
        // The logs are anchored in different blockchains, compare block timestamps to decide which to take
        if (proof1.blockTimestamp < proof2.blockTimestamp) {
          return false
        } else if (proof2.blockTimestamp < proof1.blockTimestamp) {
          return true
        }
        // If they have the same block timestamp fall through to fallback mechanism
      }
    }

    // The anchor status is the same between both logs.  If either log has a 'nonce' that means
    // multiple updates have been squashed into a single anchor window, so prefer the log with the
    // higher nonce (which indicates it has had more writes).
    const nonce1 = (state1.next?.metadata.nonce ?? state1.metadata.nonce) || 0
    const nonce2 = (state2.next?.metadata.nonce ?? state2.metadata.nonce) || 0
    if (nonce1 < nonce2) {
      return true
    } else if (nonce2 < nonce1) {
      return false
    }

    // If we got this far, that means that we don't have sufficient information to make a good
    // decision about which log to choose.  The most common way this can happen is that neither log
    // is anchored, although it can also happen if both are anchored but in the same blockNumber or
    // blockTimestamp. At this point, the decision of which log to take is arbitrary, but we want it
    // to still be deterministic. Therefore, we take the log whose first entry has the lowest CID.
    return state1.log[0] > state2.log[0] // TODO Is it safe to compare raw CIDs? Do I need to call toString() on them?
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
    const canonicalLog = this._doctype.state.log.slice() // copy log
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
        if (this.validate) {
          const schemaId = payload.header?.schema
          if (schemaId) {
            const schema = await Document.loadSchemaById(this._context.api, schemaId)
            if (schema) {
              Utils.validate(payload.content, schema)
            }
          }
        }
        state = await this._doctypeHandler.applyRecord(record, cid, this._context)
      } else {
        // it's a signed record
        const tmpState = await this._doctypeHandler.applyRecord(record, cid, this._context, state)
        if (this.validate) {
          const schemaId = payload.header?.schema
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
          await this._handleTip(asr.anchorRecord)
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

  get currentVersionDocID(): DocID {
    return this._doctype.currentVersionDocID
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
