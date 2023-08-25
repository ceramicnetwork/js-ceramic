import { IpfsInterface } from './ipfs_interface.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'

/**
 * Class for resolving a StreamID to the Tip (the CID of the most recent commit in the stream's
 * log), by querying the p2p network to discover any tips other Ceramic nodes on the network might
 * know about for this Stream.
 */
export class TipFetcher {
  constructor(readonly ipfs: IpfsInterface) {}

  async findTip(streamID: StreamID, syncTimeoutSecs: number): Promise<CID> {
    throw new Error(`Not yet implemented`)
  }
}
