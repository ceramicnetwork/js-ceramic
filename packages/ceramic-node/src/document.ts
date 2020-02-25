import Dispatcher from './dispatcher' // import only type ts 3.8
import jsonpatch from 'fast-json-patch'
import { EventEmitter } from 'events'
import PQueue from 'p-queue'

export enum SignatureStatus {
  UNSIGNED,
  PARTIAL,
  SIGNED
}

interface DocState {
  content: any;
  nextContent?: any;
  signature: SignatureStatus;
  anchored: number;
  log: Array<string>;
}

interface DocStatus {
  signature: SignatureStatus;
  anchored: number;
}

export interface InitOpts {
  onlyGenesis?: boolean;
  skipWait?: boolean;
}

const deepCopy = (obj): any => JSON.parse(JSON.stringify(obj))

class Document extends EventEmitter {
  private _applyQueue: PQueue
  private _genesisCid: string
  private _type: string
  private _state: DocState

  constructor (public id: string, public dispatcher: Dispatcher) {
    super()
    this._applyQueue = new PQueue({concurrency: 1})
    const split = this.id.split('/')
    this._genesisCid = split[3]
    this._type = split[2]
  }

  async _init (opts?: InitOpts): Promise<void> {
    const record = await this.dispatcher.getRecord(this._genesisCid)
    if (this._type !== record.doctype) throw new Error(`Expected type ${this._type}, but got ${record.doctype}`)
    this._state = await this._applyRecord(this._genesisCid)
    this.dispatcher.on(`${this.id}_update`, this._handleHead.bind(this))
    this.dispatcher.on(`${this.id}_headreq`, this._publishHead.bind(this))
    this.dispatcher.register(this.id)
    if (!opts.onlyGenesis) {
      await this.sign()
      await this.anchor()
      this._publishHead()
    } else if (!opts.skipWait) {
      // add response timeout for network change
      await new Promise(resolve => {
        let tid // eslint-disable-line prefer-const
        const clear = (): void => {
          clearTimeout(tid)
          this.off('change', clear)
          resolve()
        }
        tid = setTimeout(clear, 3000)
        this.on('change', clear)
      })
    }
  }

  static async create (genesis: any, doctype: string, dispatcher: Dispatcher, opts?: InitOpts = {}): Promise<Document> {
    const cid = await dispatcher.newRecord({ genesis, doctype })
    const id = ['/ceramic', doctype, cid.toString()].join('/')
    if (typeof opts.onlyGenesis === 'undefined') opts.onlyGenesis = false
    return Document.load(id, dispatcher, opts)
  }

  static async load (id: string, dispatcher: Dispatcher, opts?: InitOpts = {}): Promise<Document> {
    const doc = new Document(id, dispatcher)
    if (typeof opts.onlyGenesis === 'undefined') opts.onlyGenesis = true
    await doc._init(opts)
    return doc
  }

  get content (): any {
    return this._state.nextContent || this._state.content
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

  async _fetchLog (cid: string, log?: Array<string> = []): Promise<Array<string>> {
    if (this._state.log.includes(cid)) { // already processed
      return []
    }
    const record = await this.dispatcher.getRecord(cid)
    const nextCid = record.next?.toString()
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
    const record = await this.dispatcher.getRecord(cid)
    if (record.next.toString() === this.head) {
      // the new log starts where the previous one ended
      this._state = await this._applyLogToState(log, deepCopy(this._state))
      modified = true
    } else {
      // we have a conflict since next is in the log of the
      // local state, but isn't the head
      const conflictIdx = this._state.log.indexOf(record.next.toString()) + 1
      const canonicalLog = this._state.log.slice() // copy log
      const localLog = canonicalLog.splice(conflictIdx)
      // Compute state up till conflictIdx
      let state = {}
      state = await this._applyLogToState(canonicalLog)
      // Compute next transition in parallel
      const localState = await this._applyLogToState(localLog, deepCopy(state), true)
      const remoteState = await this._applyLogToState(log, deepCopy(state), true)
      if (remoteState.anchored < localState.anchored) {
        // if the remote state is anchored before the local,
        // apply the remote log to our local state. Otherwise
        // keep present state
        state = await this._applyLogToState(log, state)
        this._state = state
        modified = true
      }
    }
    return modified
  }

  async _applyLogToState (log: Array<string>, state: State, breakOnAnchor?: boolean): Promise<State> {
    const itr = log.entries()
    let entry = itr.next()
    while(!entry.done) {
      const cid = entry.value[1]
      state = await this._applyRecord(cid, state)
      if (breakOnAnchor && state.anchored) return state
      entry = itr.next()
    }
    if (state.signature === SignatureStatus.UNSIGNED) {
      // if the last record is not signed, don't add it to the state
      delete state.nextContent
      state.log.pop()
    }
    return state
  }

  async _applyRecord (cid: string, state?: DocState): Promise<DocState> {
    const record = await this.dispatcher.getRecord(cid)
    if (record.patch) {
      if (state.nextContent) throw new Error('Can not have more than one change at a time')
      state.log.push(cid)
      return {
        ...state,
        signature: SignatureStatus.UNSIGNED,
        anchored: 0,
        nextContent: jsonpatch.applyPatch(state.content, record.patch).newDocument
      }
    } else if (record.signature) {
      state.log.push(cid)
      return {
        ...state,
        signature: SignatureStatus.SIGNED
      }
    } else if (record.anchor) {
      state.log.push(cid)
      const content = state.nextContent
      delete state.nextContent
      return {
        ...state,
        content,
        anchored: record.anchor.height
      }
    } else if (record.genesis) {
      return {
        content: record.genesis,
        nextContent: record.genesis,
        signature: SignatureStatus.UNSIGNED,
        anchored: 0,
        log: [cid]
      }
    }
  }

  async _publishHead (): Promise<void> {
    await this.dispatcher.publishHead(this.id, this.head)
  }

  async change (newContent: any): Promise<boolean> {
    const patch = jsonpatch.compare(this._state.content, newContent)
    const rec = { patch, next: this.head }
    const cid = (await this.dispatcher.newRecord(rec, this.id)).toString()
    this._state = await this._applyRecord(cid, this._state)
    await this.sign()
    await this.anchor()
    this._publishHead()
    return true
  }

  async sign (): Promise<boolean> {
    // fake signature
    const signature = true
    const rec = { signature, next: this.head }
    const cid = (await this.dispatcher.newRecord(rec, this.id)).toString()
    this._state = await this._applyRecord(cid, this._state)
    return true
  }

  async anchor (): Promise<boolean> {
    // fake anchor
    const anchor = {
      chain: 'ethmainnet',
      height: Date.now(),
      txHash: 'eth-cid',
      root: 'cid',
      path: 'ipld path for witness'
    }
    const rec = { anchor, next: this.head }
    const cid = (await this.dispatcher.newRecord(rec, this.id)).toString()
    this._state = await this._applyRecord(cid, this._state)
    return true
  }

  status (): DocStatus {
    const signature = SignatureStatus[this._state.signature]
    const anchored = this._state.anchored
    return { signature, anchored }
  }

  toString (): string {
    return JSON.stringify(this._state.content)
  }

  close (): void {
    this.dispatcher.unregister(this.id)
  }
}

export default Document
