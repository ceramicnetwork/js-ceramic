import Dispatcher from './dispatcher'
import CID from 'cids'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import cloneDeep from 'lodash.clonedeep'
import AnchorServiceResponse from "./anchor/anchor-service-response"
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
} from "@ceramicnetwork/ceramic-common"
import {PinStore} from "./store/pin-store";

class Document extends EventEmitter {
  private _applyQueue: PQueue
  private _genesisCid: CID

  private _doctype: Doctype
  private _doctypeHandler: DoctypeHandler<Doctype>

  public _context: Context

  public readonly id: string
  public readonly version: CID

  private logger: Logger

  constructor (id: string, public dispatcher: Dispatcher, public pinStore: PinStore) {
    super()
    const normalized = DoctypeUtils.normalizeDocId(id)
    this.id = DoctypeUtils.getBaseDocId(normalized);
    this.version = DoctypeUtils.getVersionId(normalized)
    this.logger = RootLogger.getLogger(Document.name)

    this._applyQueue = new PQueue({ concurrency: 1 })
    this._applyQueue.start()
    this._genesisCid = new CID(DoctypeUtils.getGenesis(this.id))
  }

  /**
   * Creates new Doctype with params
   * @param genesisCid - Genesis CID
   * @param doctypeHandler - DoctypeHandler instance
   * @param dispatcher - Dispatcher instance
   * @param pinStore - PinStore instance
   * @param context - Ceramic context
   * @param opts - Initialization options
   * @param validate - Validate content against schema
   */
  static async create<T extends Doctype> (
      genesisCid: CID,
      doctypeHandler: DoctypeHandler<Doctype>,
      dispatcher: Dispatcher,
      pinStore: PinStore,
      context: Context,
      opts: DocOpts = {},
      validate = true,
  ): Promise<Document> {
    const genesis = await dispatcher.retrieveRecord(genesisCid)
    const id = DoctypeUtils.createDocIdFromGenesis(genesisCid)

    const doc = new Document(id, dispatcher, pinStore)

    doc._context = context
    doc._doctypeHandler = doctypeHandler

    doc._doctype = new doctypeHandler.doctype(null, context)
    doc._doctype.state = await doc._doctypeHandler.applyRecord(genesis, doc._genesisCid, context)

    if (validate) {
      const schema = await Document.loadSchema(context.api, doc._doctype)
      if (schema) {
        DoctypeUtils.validate(doc._doctype.content, schema)
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
   */
  static async load<T extends Doctype> (
      id: string,
      findHandler: (genesisRecord: any) => DoctypeHandler<Doctype>,
      dispatcher: Dispatcher,
      pinStore: PinStore,
      context: Context,
      opts: DocOpts = {}
  ): Promise<Document> {
    const doc = new Document(id, dispatcher, pinStore)
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

    doc._doctypeHandler = findHandler(payload)

    doc._doctype = new doc._doctypeHandler.doctype(null, context)

    if (doc._doctype.state == null) {
      // apply genesis record if there's no state preserved
      doc._doctype.state = await doc._doctypeHandler.applyRecord(record, doc._genesisCid, context)
    }

    const isPresent = await pinStore.stateStore.exists(id)
    if (isPresent) {
      // get last stored state
      doc._doctype.state = await pinStore.stateStore.load(id)
    }

    await doc._register(opts)
    return doc
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
  async getVersion<T extends Doctype>(version: CID): Promise<T> {
    const doc = await Document.getVersion<T>(this, version)
    return doc.doctype as T
  }

  /**
   * Loads a specific version of the Doctype
   *
   * @param doc - Document instance
   * @param version - Document version
   */
  static async getVersion<T extends Doctype>(doc: Document, version: CID): Promise<Document> {
    const { _context: context, dispatcher, pinStore, _doctypeHandler: doctypeHandler } = doc

    const versionRecord = await dispatcher.retrieveRecord(version)
    if (versionRecord == null) {
      throw new Error(`No record found for version ${version.toString()}`)
    }

    // check if it's not an anchor record
    if (versionRecord.proof == null) {
      throw new Error(`No anchor record for version ${version.toString()}`)
    }

    const document = new Document(DoctypeUtils.createDocIdFromBase(doc.id, version), dispatcher, pinStore)
    document._context = context
    document._doctypeHandler = doctypeHandler
    document._doctype = new doc._doctypeHandler.doctype(null, context)

    const genesisRecord = await document.dispatcher.retrieveRecord(doc._genesisCid)
    document._doctype.state = await doc._doctypeHandler.applyRecord(genesisRecord, doc._genesisCid, context)

    await document._handleHead(version) // sync version
    document._doctype = DoctypeUtils.makeReadOnly<T>(document.doctype as T)
    return document
  }

  async applyRecord (record: any, opts: DocOpts = {}, validate = true): Promise<void> {
    const cid = await this.dispatcher.storeRecord(record)

    const retrievedRec = await this.dispatcher.retrieveRecord(cid)
    const state = await this._doctypeHandler.applyRecord(retrievedRec, cid, this._context, this.state)

    let payload
    if (retrievedRec.payload && retrievedRec.signatures) {
      payload = (await this._context.ipfs.dag.get(retrievedRec.link)).value
    } else {
      payload = retrievedRec
    }

    if (payload.header) {
      // override properties
      Object.assign(state.metadata, payload.header)
    }

    if (validate) {
      const schema = await Document.loadSchemaById(this._context.api, state.metadata.schema)
      if (schema) {
        DoctypeUtils.validate(state.content, schema)
      }
    }

    this._doctype.state = state

    await this._updateStateIfPinned()
    await this._applyOpts(opts)
  }

  async _register (opts: DocOpts): Promise<void> {
    this.on('update', this._handleHead.bind(this))
    this.on('headreq', this._publishHead.bind(this))

    await this.dispatcher.register(this)

    await this._applyOpts(opts)
  }

  /**
   * Apply initialization options
   * @param opts - Initialization options
   * @private
   */
  async _applyOpts(opts: DocOpts): Promise<void> {
    if (!opts.applyOnly) {
      await this.anchor()
      this._publishHead()
    } else if (!opts.skipWait) {
      await Document.wait(this)
    }
  }

  /**
   * Updates document state if the document is pinned locally
   * @private
   */
  async _updateStateIfPinned(): Promise<void> {
    const isPinned = await this.pinStore.stateStore.exists(this.id)
    if (isPinned) {
      await this.pinStore.add(this._doctype)
    }
  }

  /**
   * Handles HEAD from the PubSub topic
   * @param cid - HEAD CID
   * @private
   */
  _handleHead(cid: CID): void {
    return this._applyQueue.add(async () => {
      const log = await this._fetchLog(cid)
      if (log.length) {
        const updated = await this._applyLog(log)
        if (updated) {
          this._doctype.emit('change')
        }
      }
      console.log('working....')
    })
  }

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
   * @param cid - CID value
   * @param log - Log array
   * @private
   */
  async _isCidIncluded(cid: CID, log: Array<CID>): Promise<boolean> {
    return (await this._findIndex(cid, log)) !== -1
  }

  async _applyLog (log: Array<CID>): Promise<boolean> {
    let modified = false
    if (log[log.length - 1].equals(this.head)) {
      // log already applied
      return
    }
    const cid = log[0]
    const record = await this.dispatcher.retrieveRecord(cid)
    let payload = record
    if (DoctypeUtils.isSignedRecord(record)) {
      payload = await this.dispatcher.retrieveRecord(record.link)
    }
    if (payload.prev.equals(this.head)) {
      // the new log starts where the previous one ended
      this._doctype.state = await this._applyLogToState(log, cloneDeep(this._doctype.state))
      modified = true
    } else {
      // we have a conflict since prev is in the log of the
      // local state, but isn't the head
      const conflictIdx = await this._findIndex(payload.prev, this._doctype.state.log) + 1
      const canonicalLog = this._doctype.state.log.slice() // copy log
      const localLog = canonicalLog.splice(conflictIdx)
      // Compute state up till conflictIdx
      let state: DocState = await this._applyLogToState(canonicalLog)
      // Compute next transition in parallel
      const localState = await this._applyLogToState(localLog, cloneDeep(state), true)
      const remoteState = await this._applyLogToState(log, cloneDeep(state), true)

      if (AnchorStatus.ANCHORED === remoteState.anchorStatus &&
          remoteState.anchorProof.blockTimestamp < localState.anchorProof.blockTimestamp) {
        // if the remote state is anchored before the local,
        // apply the remote log to our local state. Otherwise
        // keep present state
        state = await this._applyLogToState(log, cloneDeep(state))
        this._doctype.state = state
        modified = true
      }
    }
    return modified
  }

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

      if (!payload.prev) {
        state = await this._doctypeHandler.applyRecord(record, cid, this._context)
      } else if (payload.proof) {
        // it's an anchor record
        await this._verifyAnchorRecord(record)
        state = await this._doctypeHandler.applyRecord(record, cid, this._context, state)
      } else {
        state = await this._doctypeHandler.applyRecord(record, cid, this._context, state)
      }
      if (breakOnAnchor && AnchorStatus.ANCHORED === state.anchorStatus) {
        return state
      }
      entry = itr.next()
    }
    return state
  }

  async _verifyAnchorRecord (record: AnchorRecord): Promise<AnchorProof> {
    const proofRecord = await this.dispatcher.retrieveRecord(record.proof)

    let prevRootPathRecord
    try {
      // optimize verification by using ipfs.dag.tree for fetching the nested CID
      if (record.path.length === 0) {
        prevRootPathRecord = proofRecord.root
      } else {
        const subPath: string = '/root/' + record.path.substr(0, record.path.lastIndexOf('/'))
        const last: string = record.path.substr(record.path.lastIndexOf('/')+1)

        prevRootPathRecord = await this.dispatcher.retrieveRecordByPath(record.proof, subPath)
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

  async _publishHead (): Promise<void> {
    await this.dispatcher.publishHead(this.id, this.head, this.doctype.doctype)
  }

  async anchor (): Promise<void> {
    this._context.anchorService.on(this.id, async (asr: AnchorServiceResponse): Promise<void> => {
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
          await this._handleHead(asr.anchorRecord)
          await this._updateStateIfPinned()
          this._publishHead()

          this._context.anchorService.removeAllListeners(this.id)
          return
        }
        case 'FAILED': {
          const state = this._doctype.state
          state.anchorStatus = AnchorStatus.FAILED
          this._doctype.state = state
          this._context.anchorService.removeAllListeners(this.id)
          return
        }
      }
    })
    await this._context.anchorService.requestAnchor(this.id, this.head)
    const state = this._doctype.state
    state.anchorStatus = AnchorStatus.PENDING
    this._doctype.state = state
  }

  /**
   * Loads schema for the Doctype
   * @param ceramicApi - Ceramic API
   * @param doctype - Doctype instance
   */
  static async loadSchema<T extends Doctype>(ceramicApi: CeramicApi, doctype: Doctype): Promise<T> {
    return doctype.state?.metadata?.schema ? Document.loadSchemaById(ceramicApi, doctype.state.metadata.schema) : null
  }

  /**
   * Loads schema by ID
   * @param ceramicApi - Ceramic API
   * @param schemaDocId - Schema document ID
   */
  static async loadSchemaById<T extends Doctype>(ceramicApi: CeramicApi, schemaDocId: string): Promise<T> {
    if (schemaDocId) {
      const schemaDoc = await ceramicApi.loadDocument(schemaDocId)
      return schemaDoc.content
    }
    return null
  }

  get content (): any {
    const { next, content } = this._doctype.state
    return next?.content ?? content
  }

  get state (): DocState {
    return this._doctype.state
  }

  get doctype (): Doctype {
    return this._doctype
  }

  get head (): CID {
    return this._doctype.head
  }

  get owners (): string[] {
    return this._doctype.owners
  }

  get metadata (): DocMetadata {
    return this._doctype.metadata
  }

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

  close (): void {
    this.dispatcher.unregister(this.id)
    this.off('update', this._handleHead.bind(this))
    this.off('headreq', this._publishHead.bind(this))
    this._applyQueue.clear()
  }

  toString (): string {
    return JSON.stringify(this._doctype.state.content)
  }
}

export default Document
