import { EventEmitter } from 'events'
import CID from 'cids'

// TODO - remove dispatcher, its not needed once we have anchoring service
import type Dispatcher from './dispatcher'
import type { AnchorRecord, AnchorProof } from './document'

const FAKE_CID = new CID('bafybeig6xv5nwphfmvcnektpnojts33jqcuam7bmye2pb54adnrtccjlsu')

class AnchorService extends EventEmitter {

  constructor (private _dispatcher: Dispatcher, private _servicePolicy?: any) {
    super()
  }

  async requestAnchor(docId: string, head: CID): Promise<void> {
    // TODO - make request to actual service
    // creates fake anchor record
    const proofData: AnchorProof = {
      chain: 'eip155:1',
      blockNumber: Date.now(),
      blockTimestamp: Date.now(),
      txHash: 'eth-cid',
      root: FAKE_CID
    }
    const proof = await this._dispatcher.storeRecord(proofData)
    const record = { proof, path: 'ipld path for witness', prev: head }
    const cid = await this._dispatcher.storeRecord(record)
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
