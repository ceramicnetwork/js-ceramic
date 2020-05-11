import type Dispatcher from './dispatcher'
import type AnchorService from './anchor/anchor-service'
import type DoctypeHandler from './doctypes/doctypeHandler'
import CID from 'cids'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import cloneDeep from 'lodash.clonedeep'
import AnchorServiceResponse from "./anchor/anchor-service-response"

export enum SignatureStatus {
  GENESIS,
  PARTIAL,
  SIGNED
}

export enum AnchorStatus {
  NOT_REQUESTED,
  PENDING,
  PROCESSING,
  ANCHORED
}

export interface DocState {
  doctype: string;
  owners: Array<string>;
  nextOwners?: Array<string>;
  content: any;
  nextContent?: any;
  signature: SignatureStatus;
  anchorStatus: AnchorStatus;
  anchorScheduledFor?: number; // only present when anchor status is pending
  anchorProof?: AnchorProof; // the anchor proof of the latest anchor, only present when anchor status is anchored
  log: Array<CID>;
}

export interface InitOpts {
  owners?: Array<string>;
  onlyGenesis?: boolean;
  skipWait?: boolean;
}

export interface AnchorRecord {
  prev: CID; // should be CID type
  proof: CID; // should be CID type
  path: string;
}

export interface AnchorProof {
  chainId: string;
  blockNumber: number;
  blockTimestamp: number;
  txHash: CID;
  root: CID;
}

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
  private _genesisCid: CID
  private _state: DocState
  private _doctypeHandler: DoctypeHandler
  private _anchorService: AnchorService

  constructor (public id: string, public dispatcher: Dispatcher) {
    super()
    this._applyQueue = new PQueue({concurrency: 1})
    const split = this.id.split('/')
    this._genesisCid = new CID(split[2])
  }

  async _init (
    getHandlerFromGenesis: (genesisRecord: any) => DoctypeHandler,
    anchorService: AnchorService,
    opts: InitOpts
  ): Promise<void> {
    const record = await this.dispatcher.retrieveRecord(this._genesisCid)
    this._doctypeHandler = getHandlerFromGenesis(record)
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
    return Document.load(id, () => doctypeHandler, anchorService, dispatcher, opts)
  }

  static async load (
    id: string,
    getHandlerFromGenesis: (genesisRecord: any) => DoctypeHandler,
    anchorService: AnchorService,
    dispatcher: Dispatcher,
    opts: InitOpts = {}
  ): Promise<Document> {
    const doc = new Document(id, dispatcher)
    if (typeof opts.onlyGenesis === 'undefined') opts.onlyGenesis = true
    await doc._init(getHandlerFromGenesis, anchorService, opts)
    return doc
  }

  get content (): any {
    return this._state.nextContent || this._state.content
  }

  get state (): DocState {
    return cloneDeep(this._state)
  }

  get doctype (): string {
    return this._doctypeHandler.doctype
  }

  get head (): CID {
    const log = this._state.log
    return log[log.length - 1]
  }

  async _handleHead (cid: CID): Promise<void> {
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

  async _fetchLog (cid: CID, log: Array<CID> = []): Promise<Array<CID>> {
    if (this._state.log.some(x => x.equals(cid))) { // already processed
      return []
    }
    const record = await this.dispatcher.retrieveRecord(cid)
    const prevCid: CID = record.prev
    if (!prevCid) { // this is a fake log
      return []
    }
    log.unshift(cid)
    if (this._state.log.some(x => x.equals(prevCid))) {
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
      this._state = await this._applyLogToState(log, cloneDeep(this._state))
      modified = true
    } else {
      // we have a conflict since prev is in the log of the
      // local state, but isn't the head
      const conflictIdx = this._state.log.findIndex(x => x.equals(record.prev)) + 1
      const canonicalLog = this._state.log.slice() // copy log
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
        this._state = state
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
        state = await this._doctypeHandler.applyGenesis(record, cid)
      } else if (record.proof) {
        // it's an anchor record
        const proof = await this._verifyAnchorRecord(record)
        state = await this._doctypeHandler.applyAnchor(record, proof, cid, state)
      } else {
        state = await this._doctypeHandler.applySigned(record, cid, state)
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
    await this._anchorService.validateChainInclusion(proof)
    return proof
  }

  async _publishHead (): Promise<void> {
    await this.dispatcher.publishHead(this.id, this.head)
  }

  async change (newContent: any, newOwners?: Array<string>): Promise<boolean> {
    const record = await this._doctypeHandler.makeRecord(this._state, newContent, newOwners)
    const cid = await this.dispatcher.storeRecord(record)
    this._state = await this._doctypeHandler.applySigned(record, cid, this._state)
    await this.anchor()
    this._publishHead()
    return true
  }

  async anchor (): Promise<void> {
    this._anchorService.on(this.id, async (asr: AnchorServiceResponse): Promise<void> => {
      switch (asr.status) {
        case 'PENDING': {
          this._state.anchorScheduledFor = asr.anchorScheduledFor
          return
        }
        case 'PROCESSING': {
          this._state.anchorStatus = AnchorStatus.PROCESSING
          return
        }
        case 'COMPLETED': {
          await this._handleHead(asr.anchorRecord)
          this._publishHead()

          this._anchorService.removeAllListeners(this.id)
          return
        }
        case 'FAILED': {
          // TODO handle failed status
          this._anchorService.removeAllListeners(this.id)
          return
        }
      }
    })
    await this._anchorService.requestAnchor(this.id, this.head)
    this._state.anchorStatus = AnchorStatus.PENDING
  }

  toString (): string {
    return JSON.stringify(this._state.content)
  }

  close (): void {
    this.dispatcher.off(`${this.id}_update`, this._handleHead.bind(this))
    this.dispatcher.off(`${this.id}_headreq`, this._publishHead.bind(this))
    this.dispatcher.unregister(this.id)
  }
}

export default Document
