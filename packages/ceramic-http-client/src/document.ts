import CID from 'cids'
import { EventEmitter } from 'events'
import cloneDeep from 'lodash.clonedeep'
import { fetchJson } from './utils'

export enum SignatureStatus {
  UNSIGNED,
  PARTIAL,
  SIGNED
}

export enum AnchorStatus {
  NOT_REQUESTED,
  PENDING,
  PROCESSING,
  ANCHORED,
  FAILED
}

export interface AnchorProof {
  chainId: string;
  blockNumber: number;
  blockTimestamp: number;
  txHash: CID;
  root: CID;
}

export interface DocState {
  doctype: string;
  owners: Array<string>;
  nextOwners?: Array<string>;
  content: any;
  nextContent?: any;
  signature: SignatureStatus;
  anchorStatus: AnchorStatus;
  anchorScheduledFor?: number;
  anchorProof?: AnchorProof;
  log: Array<CID>;
}

export interface InitOpts {
  onlyGenesis?: boolean;
  skipWait?: boolean;
  owners?: Array<string>;
}

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

  constructor (public id: string, private _state: any, private _apiUrl: string) {
    super()
  }

  static async create (genesis: any, doctype: string, apiUrl: string, opts: InitOpts = {}): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/create', { genesis, doctype, onlyGenesis: opts.onlyGenesis, owners: opts.owners })
    const doc = new Document(docId, deserializeState(state), apiUrl)
    return doc
  }

  static async load (id: string, apiUrl: string): Promise<Document> {
    const { docId, state } = await fetchJson(apiUrl + '/state' + id)
    const doc = new Document(docId, deserializeState(state), apiUrl)
    return doc
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
    const { state } = await fetchJson(this._apiUrl + '/change' + this.id, { content: newContent, owners: newOwners })
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
