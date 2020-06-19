import CID from 'cids'

// TODO - remove dispatcher, its not needed once we have anchoring service
import type Dispatcher from '../../dispatcher'
import AnchorService from "ceramic-common/lib/anchor-service"
import { AnchorProof } from "ceramic-common/lib/doctype"

class MockAnchorService extends AnchorService {

  constructor (private _dispatcher: Dispatcher, private _servicePolicy?: any) {
    super()
  }

  async requestAnchor(docId: string, head: CID): Promise<void> {
    // creates fake anchor record
    const proofData: AnchorProof = {
      chainId: 'eip155:1',
      blockNumber: Date.now(),
      blockTimestamp: Date.now(),
      txHash: new CID('bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova'),
      root: head,
    };
    const proof = await this._dispatcher.storeRecord(proofData)
    const record = { proof, path: '', prev: head }
    const cid = await this._dispatcher.storeRecord(record)

    this.emit(docId, { status: 'COMPLETED', message: 'CID successfully anchored.', anchorRecord: cid});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateChainInclusion (proof: AnchorProof): Promise<void> {
    // always valid
  }
}

export default MockAnchorService
