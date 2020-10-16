import CID from 'cids'

import type Dispatcher from '../../../dispatcher'
import { AnchorProof, AnchorService, CeramicApi } from "@ceramicnetwork/ceramic-common"
import Ceramic, { CeramicConfig } from "../../../ceramic"

class EthereumAnchorService extends AnchorService {
  private _ceramic: Ceramic
  private _dispatcher: Dispatcher

  private readonly _anchorDelay = 0

  constructor (private _config: CeramicConfig) {
    super()

    if (this._config) {
      this._anchorDelay = _config['anchorDelay']? _config['anchorDelay'] : 0
    }
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    this._ceramic = ceramic as Ceramic
    this._dispatcher = this._ceramic.dispatcher
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

    const handle = setTimeout(() => {
      this.emit(docId, { status: 'COMPLETED', message: 'CID successfully anchored.', anchorRecord: cid});
      clearTimeout(handle)
    }, this._anchorDelay)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateChainInclusion (proof: AnchorProof): Promise<void> {
    // always valid
  }
}

export default EthereumAnchorService
