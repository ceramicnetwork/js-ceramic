import type Dispatcher from './dispatcher'
import CID from 'cids'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import cloneDeep from 'lodash.clonedeep'
import AnchorServiceResponse from "./anchor/anchor-service-response"
import StateStore from "./store/state-store"
import {
  AnchorProof, AnchorRecord, AnchorStatus, DocState, Doctype, DoctypeConstructor, DoctypeHandler, DoctypeUtils, InitOpts
} from "./doctype"
import { Context } from "./context"

class Document extends EventEmitter {
  private _applyQueue: PQueue
  private _genesisCid: CID

  private _doctype: Doctype
  private _doctypeHandler: DoctypeHandler<Doctype>

  public _context: Context

  public readonly id: string
  public readonly dispatcher: Dispatcher
  public readonly stateStore: StateStore

  constructor (id: string, dispatcher: Dispatcher, stateStore: StateStore) {
    super()
    this.id = id;

    this.dispatcher = dispatcher;
    this.stateStore = stateStore;

    this._applyQueue = new PQueue({ concurrency: 1 })
    const split = this.id.split('/')
    this._genesisCid = new CID(split[2])
  }

  static async create<T extends Doctype> (
      params: object,
      doctypeHandler: DoctypeHandler<Doctype>,
      dispatcher: Dispatcher,
      stateStore: StateStore,
      context: Context,
      opts: InitOpts = {}
  ): Promise<string> {
    const doctype = await doctypeHandler.create({ ... params }, context, opts)
    return ['/ceramic', doctype.head.toString()].join('/')
  }

  static async load<T extends Doctype> (
      id: string,
      findHandler: (genesisRecord: any) => DoctypeHandler<Doctype>,
      dispatcher: Dispatcher,
      stateStore: StateStore,
      context: Context,
      opts: InitOpts = {}
  ): Promise<Document> {
    const doc = new Document(id, dispatcher, stateStore)
    doc._context = context

    if (typeof opts.onlyGenesis === 'undefined') {
      opts.onlyGenesis = true
    }

    const record = await dispatcher.retrieveRecord(doc._genesisCid)
    doc._doctypeHandler = findHandler(record)

    const doctypeClass: DoctypeConstructor = doc._doctypeHandler.doctypeClass()
    doc._doctype = new doctypeClass(null)


    if (doc._doctype.state == null) {
      // apply genesis record if there's no state preserved
      doc._doctype.state = await doc._doctypeHandler.applyRecord(record, doc._genesisCid, context)
    }

    const isPinned = await stateStore.isDocPinned(id)
    if (isPinned) {
      // get last stored state
      doc._doctype.state = await stateStore.loadState(id)
    }

    await doc._register(opts)
    return doc
  }

  static async createFromGenesis<T extends Doctype>(
      genesis: any,
      findHandler: (genesisRecord: any) => DoctypeHandler<Doctype>,
      dispatcher: Dispatcher,
      stateStore: StateStore,
      context: Context,
      opts: InitOpts = {}
  ): Promise<Document> {
    const genesisCid = await dispatcher._ipfs.dag.put(genesis)
    const id = ['/ceramic', genesisCid.toString()].join('/')

    const doc = new Document(id, dispatcher, stateStore)

    doc._context = context
    doc._doctypeHandler = findHandler(genesis)

    const doctypeClass: DoctypeConstructor = doc._doctypeHandler.doctypeClass()
    doc._doctype = new doctypeClass(null)
    doc._doctype.state = await doc._doctypeHandler.applyRecord(genesis, doc._genesisCid, context)

    await doc._updateStateIfPinned()

    if (typeof opts.onlyGenesis === 'undefined') {
      opts.onlyGenesis = false
    }
    await doc._register(opts)
    return doc
  }

  async applyRecord (record: any, opts: InitOpts = {}): Promise<void> {
    const cid = await this.dispatcher.storeRecord(record)
    this._doctype.state = await this._doctypeHandler.applyRecord(record, cid, this._context, this.state)

    await this._updateStateIfPinned()

    if (!opts.onlyApply) {
      await this.anchor()
      this._publishHead()
    } else if (!opts.skipWait) {
      await Document.wait(this)
    }
  }

  async _register (opts: InitOpts): Promise<void> {
    this.on('update', this._handleHead.bind(this))
    this.on('headreq', this._publishHead.bind(this))

    await this.dispatcher.register(this)

    if (opts.skipWait == null) {
      // skip wait by default
      opts.skipWait = true
    }

    if (!opts.onlyGenesis) {
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
    const isPinned = await this.stateStore.isDocPinned(this.id)
    if (isPinned) {
      await this.stateStore.pin(this, false)
    }
  }

  async _handleHead (cid: CID): Promise<void> {
    const log = await this._fetchLog(cid)
    if (log.length) {
      // create a queue in case we get multiple conflicting records at once
      let applyPromise
      this._applyQueue.add(async () => {
        applyPromise = this._applyLog(log)
        const updated = await applyPromise
        if (updated) {
          this._doctype.emit('change')
        }
      })
      if (applyPromise) {
        await applyPromise
      }
    }
  }

  async _fetchLog (cid: CID, log: Array<CID> = []): Promise<Array<CID>> {
    if (this._doctype.state.log.some(x => x.equals(cid))) { // already processed
      return []
    }
    const record = await this.dispatcher.retrieveRecord(cid)
    const prevCid: CID = record.prev
    if (!prevCid) { // this is a fake log
      return []
    }
    log.unshift(cid)
    if (this._doctype.state.log.some(x => x.equals(prevCid))) {
      // we found the connection to the canonical log
      return log
    }
    return this._fetchLog(prevCid, log)
  }

  async _applyLog (log: Array<CID>): Promise<boolean> {
    let modified = false
    if (log[log.length - 1].equals(this.head)) return // log already applied
    const cid = log[0]
    const record = await this.dispatcher.retrieveRecord(cid)
    if (record.prev.equals(this.head)) {
      // the new log starts where the previous one ended
      this._doctype.state = await this._applyLogToState(log, cloneDeep(this._doctype.state))
      modified = true
    } else {
      // we have a conflict since prev is in the log of the
      // local state, but isn't the head
      const conflictIdx = this._doctype.state.log.findIndex(x => x.equals(record.prev)) + 1
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
      if (!record.prev) {
        state = await this._doctypeHandler.applyRecord(record, cid, this._context)
      } else if (record.proof) {
        // it's an anchor record
        await this._verifyAnchorRecord(record)
        state = await this._doctypeHandler.applyRecord(record, cid, this._context, state)
      } else {
        state = await this._doctypeHandler.applyRecord(record, cid, this._context, state)
      }
      if (breakOnAnchor && AnchorStatus.ANCHORED === state.anchorStatus) return state
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
    await this.dispatcher.publishHead(this.id, this.head)
  }

  async anchor (): Promise<void> {
    this._context.anchorService.on(this.id, async (asr: AnchorServiceResponse): Promise<void> => {
      switch (asr.status) {
        case 'PENDING': {
          this._doctype.state.anchorScheduledFor = asr.anchorScheduledFor
          await this._updateStateIfPinned()
          return
        }
        case 'PROCESSING': {
          this._doctype.state.anchorStatus = AnchorStatus.PROCESSING
          await this._updateStateIfPinned()
          return
        }
        case 'COMPLETED': {
          this._doctype.state.anchorStatus = AnchorStatus.ANCHORED
          await this._handleHead(asr.anchorRecord)
          await this._updateStateIfPinned()
          this._publishHead()

          this._context.anchorService.removeAllListeners(this.id)
          return
        }
        case 'FAILED': {
          this._doctype.state.anchorStatus = AnchorStatus.FAILED
          this._context.anchorService.removeAllListeners(this.id)
          return
        }
      }
    })
    await this._context.anchorService.requestAnchor(this.id, this.head)
    this._doctype.state.anchorStatus = AnchorStatus.PENDING
  }

  get content (): any {
    return this._doctype.state.nextContent || this._doctype.state.content
  }

  get state (): DocState {
    return cloneDeep(this._doctype.state)
  }

  get doctype (): string {
    return this.state.doctype
  }

  get head (): CID {
    const log = this._doctype.state.log
    return log[log.length - 1]
  }

  get owners (): string[] {
    return this._doctype.state.owners
  }

  toDoctype<T extends Doctype>(): T {
    return DoctypeUtils.docStateToDoctype(this.id, this.state)
  }

  static async wait<T extends Doctype>(doc: Document): Promise<void> {
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
    this.off('update', this._handleHead.bind(this))
    this.off('headreq', this._publishHead.bind(this))
    this.dispatcher.unregister(this.id)
  }

  toString (): string {
    return JSON.stringify(this._doctype.state.content)
  }
}

export default Document
