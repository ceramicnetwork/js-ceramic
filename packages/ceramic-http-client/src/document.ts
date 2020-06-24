import CID from 'cids'
import { EventEmitter } from 'events'
import cloneDeep from 'lodash.clonedeep'
import { fetchJson } from './utils'
import { AnchorStatus, DocState, Doctype, InitOpts } from "@ceramicnetwork/ceramic-common/lib/doctype"

function deserializeState (state: any): DocState {
  state.log = state.log.map((cidStr: string): CID => new CID(cidStr))
  if (state.anchorProof) {
    state.anchorProof.txHash = new CID(state.anchorProof.txHash);
    state.anchorProof.root = new CID(state.anchorProof.root);
  }

  let showScheduledFor = true;
  if (state.anchorStatus) {
    state.anchorStatus = AnchorStatus[state.anchorStatus];
    showScheduledFor = state.anchorStatus !== AnchorStatus.FAILED && state.anchorStatus !== AnchorStatus.ANCHORED
  }
  if (state.anchorScheduledFor) {
    if (showScheduledFor) {
      state.anchorScheduledFor = Date.parse(state.anchorScheduledFor); // ISO format of the UTC time
    } else {
      state.anchorScheduledFor = null;
    }
  }
  return state
}

class Document extends EventEmitter {

  public doctype: Doctype

  constructor (public id: string, private _state: any, private _apiUrl: string) {
    super()
  }

  static async create (apiUrl: string, doctype: string, params: object, opts?: InitOpts): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/create', {
      params,
      doctype,
      onlyGenesis: opts.onlyGenesis,
      owners: opts.owners,
      isUnique: opts.isUnique
    })
    return new Document(docId, deserializeState(state), apiUrl)
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/state' + id)
    return new Document(docId, deserializeState(state), apiUrl)
  }

  get content (): any {
    return this._state.nextContent || this._state.content
  }

  get state (): DocState {
    return cloneDeep(this._state)
  }

  get head (): string {
    const log = this._state.log
    return log[log.length - 1]
  }

  async change (newContent: any, newOwners?: Array<string>): Promise<boolean> {
    const { state } = await fetchJson(this._apiUrl + '/change' + this.id, {
      params: {
        content: newContent,
        owners: newOwners
      }
    })
    this._state = deserializeState(state)
    return true
  }

  async sign (): Promise<boolean> {
    return false
  }

  async anchor (): Promise<boolean> {
    return false
  }

  async _syncState (): Promise<void> {
    let { state } = await fetchJson(this._apiUrl + '/state' + this.id)
    state = deserializeState(state)
    if (JSON.stringify(this._state) !== JSON.stringify(state)) {
      this._state = state
      this.emit('change')
    }
  }
}

export default Document
