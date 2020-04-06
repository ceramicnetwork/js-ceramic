import type Dispatcher from './dispatcher'
import type AnchorService from './anchor-service'
import type DoctypeHandler from './doctypes/doctypeHandler'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'

export enum SignatureStatus {
  GENESIS,
  PARTIAL,
  SIGNED
}

export interface DocState {
  doctype: string;
  owners: Array<string>;
  content: any;
  nextContent?: any;
  signature: SignatureStatus;
  anchored: number;
  log: Array<string>;
}

export interface InitOpts {
  owners?: Array<string>;
  onlyGenesis?: boolean;
  skipWait?: boolean;
}

export interface AnchorRecord {
  next: any; // should be CID type
  proof: any; // should be CID type
  path: string;
}

export interface AnchorProof {
  chain: string;
  blockNumber: number;
  blockTimestamp: number;
  txHash: string; // potentially a CID
  root: any; // should be CID type
}

const deepCopy = (obj: any): any => JSON.parse(JSON.stringify(obj))

const waitForChange = async (doc: Document): Promise<void> => {
  // add response timeout for network change
  return new Promise(resolve => {
    let tid: any // eslint-disable-line prefer-const
    const clear = (): void => {
      clearTimeout(tid)
      doc.off('change', clear)
      resolve()
    }
    tid = setTimeout(clear, 3000)
    doc.on('change', clear)
  })
}

class Document extends EventEmitter {
  private _applyQueue: PQueue
  private _genesisCid: string
  private _state: DocState
  private _doctypeHandler: DoctypeHandler
  private _anchorService: AnchorService

  constructor (public id: string, public dispatcher: Dispatcher) {
    super()
    this._applyQueue = new PQueue({concurrency: 1})
    const split = this.id.split('/')
    this._genesisCid = split[2]
  }

  async _init (
    doctypeHandlers: Record<string, DoctypeHandler>,
    anchorService: AnchorService,
    opts: InitOpts
  ): Promise<void> {
    const record = await this.dispatcher.retrieveRecord(this._genesisCid)
    this._doctypeHandler = doctypeHandlers[record.doctype]
    this._anchorService = anchorService
    this._state = await this._doctypeHandler.applyGenesis(record, this._genesisCid)
    this.dispatcher.on(`${this.id}_update`, this._handleHead.bind(this))
    this.dispatcher.on(`${this.id}_headreq`, this._publishHead.bind(this))
    this.dispatcher.register(this.id)
    if (!opts.onlyGenesis) {
      await this.anchor()
      this._publishHead()
    } else if (!opts.skipWait) {
      await waitForChange(this)
    }
  }

  static async create (
    content: any,
    doctypeHandler: DoctypeHandler,
    anchorService: AnchorService,
    dispatcher: Dispatcher,
    opts: InitOpts = {}
  ): Promise<Document> {
    const genesisRecord = await doctypeHandler.makeGenesis(content, opts.owners)
    const cid = await dispatcher.storeRecord(genesisRecord)
    const id = ['/ceramic', cid.toString()].join('/')
    if (typeof opts.onlyGenesis === 'undefined') opts.onlyGenesis = false
    const doctypeHandlers: Record<string, DoctypeHandler> = {}
    doctypeHandlers[doctypeHandler.doctype] = doctypeHandler
    return Document.load(id, doctypeHandlers, anchorService, dispatcher, opts)
  }

  static async load (
    id: string,
    doctypeHandlers: Record<string, DoctypeHandler>,
    anchorService: AnchorService,
    dispatcher: Dispatcher,
    opts: InitOpts = {}
  ): Promise<Document> {
    const doc = new Document(id, dispatcher)
    if (typeof opts.onlyGenesis === 'undefined') opts.onlyGenesis = true
    await doc._init(doctypeHandlers, anchorService, opts)
    return doc
  }

  get content (): any {
    return this._state.nextContent || this._state.content
  }

  get state (): DocState {
    return this._state
  }

  get doctype (): string {
    return this._doctypeHandler.doctype
  }

  get head (): string {
    const log = this._state.log
    return log[log.length - 1]
  }

  async _handleHead (cid: string): Promise<void> {
    const log = await this._fetchLog(cid)
    if (log.length) {
      // create a queue in case we get multiple conflicting records at once
      let applyPromise
      this._applyQueue.add(async () => {
        applyPromise = this._applyLog(log)
        const updated = await applyPromise
        if (updated) this.emit('change')
      })
      await applyPromise
    }
  }

  async _fetchLog (cid: string, log: Array<string> = []): Promise<Array<string>> {
    if (this._state.log.includes(cid)) { // already processed
      return []
    }
    const record = await this.dispatcher.retrieveRecord(cid)
    const nextCid = record.next ? record.next['/'].toString() : null
    if (!nextCid) { // this is a fake log
      return []
    }
    log.unshift(cid)
    if (this._state.log.includes(nextCid)) {
      // we found the connection to the canonical log
      return log
    }
    return this._fetchLog(nextCid, log)
  }

  async _applyLog (log: Array<string>): Promise<boolean> {
    let modified = false
    if (log[log.length - 1] === this.head) return // log already applied
    const cid = log[0]
    const record = await this.dispatcher.retrieveRecord(cid)
    if (record.next['/'].toString() === this.head) {
      // the new log starts where the previous one ended
      this._state = await this._applyLogToState(log, deepCopy(this._state))
      modified = true
    } else {
      // we have a conflict since next is in the log of the
      // local state, but isn't the head
      const conflictIdx = this._state.log.indexOf(record.next['/'].toString()) + 1
      const canonicalLog = this._state.log.slice() // copy log
      const localLog = canonicalLog.splice(conflictIdx)
      // Compute state up till conflictIdx
      let state: DocState = await this._applyLogToState(canonicalLog)
      // Compute next transition in parallel
      const localState = await this._applyLogToState(localLog, deepCopy(state), true)
      const remoteState = await this._applyLogToState(log, deepCopy(state), true)
      if (remoteState.anchored !== 0 && remoteState.anchored < localState.anchored) {
        // if the remote state is anchored before the local,
        // apply the remote log to our local state. Otherwise
        // keep present state
        state = await this._applyLogToState(log, deepCopy(state))
        this._state = state
        modified = true
      }
    }
    return modified
  }

  async _applyLogToState (log: Array<string>, state?: DocState, breakOnAnchor?: boolean): Promise<DocState> {
    const itr = log.entries()
    let entry = itr.next()
    while(!entry.done) {
      const cid = entry.value[1]
      const record = await this.dispatcher.retrieveRecord(cid)
      // TODO - should catch potential thrown error here
      if (!record.next) {
        state = await this._doctypeHandler.applyGenesis(record, cid)
      } else if (record.proof) {
        const proof = await this._verifyAnchorRecord(record)
        state = await this._doctypeHandler.applyAnchor(record, proof, cid, state)
      } else {
        state = await this._doctypeHandler.applySigned(record, cid, state)
      }
      if (breakOnAnchor && state.anchored) return state
      entry = itr.next()
    }
    return state
  }

  async _verifyAnchorRecord (record: AnchorRecord): Promise<AnchorProof> {
    //const nextRecordA = await this.dispatcher.retrieveRecord(record.next)
    //const nextRecordB = await this.dispatcher.retrieveRecord(record.proof + '/root' + record.path)
    // assert A == B
    const proof: AnchorProof = await this.dispatcher.retrieveRecord(record.proof['/'])
    await this._anchorService.validateChainInclusion(proof)
    return proof
  }

  async _publishHead (): Promise<void> {
    await this.dispatcher.publishHead(this.id, this.head)
  }

  async change (newContent: any): Promise<boolean> {
    const record = await this._doctypeHandler.makeRecord(this._state, newContent)
    const cid = (await this.dispatcher.storeRecord(record)).toString()
    this._state = await this._doctypeHandler.applySigned(record, cid, this._state)
    await this.anchor()
    this._publishHead()
    return true
  }

  async anchor (): Promise<void> {
    this._anchorService.on(this.id, async (cid): Promise<void> => {
      await this._handleHead(cid)
      this._publishHead()
    })
    await this._anchorService.requestAnchor(this.id, this.head)
  }

  toString (): string {
    return JSON.stringify(this._state.content)
  }

  close (): void {
    this.dispatcher.unregister(this.id)
  }
}

export default Document
