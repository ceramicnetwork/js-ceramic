import { EventEmitter } from 'events'

// TODO - remove dispatcher, its not needed once we have anchoring service
import type Dispatcher from './dispatcher'
import type { AnchorRecord, AnchorProof } from './document'

class AnchorService extends EventEmitter {

  constructor (private _dispatcher: Dispatcher, private _servicePolicy?: any) {
    super()
  }

  async requestAnchor(docId: string, head: string): Promise<void> {
    // TODO - make request to actual service
    // creates fake anchor record
    const proofData: AnchorProof = {
      chain: 'eip155:1',
      blockNumber: Date.now(),
      blockTimestamp: Date.now(),
      txHash: 'eth-cid',
      root: 'cid'
    }
    const proof = { '/': await this._dispatcher.storeRecord(proofData) }
    const record = { proof, path: 'ipld path for witness', next: { '/': head } }
    const cid = (await this._dispatcher.storeRecord(record)).toString()
    // TODO - poll for anchor inclusion on-chain
    this.emit(docId, cid)
    this.removeAllListeners(docId)
  }

  async validateChainInclusion (proof: AnchorProof): Promise<void> {
    // TODO - throw if invalid
    // validate that root CID is in tx,
    // blockNumber and blockTimestamp match the block
    // in which txHash was included
  }
}

export default AnchorService
