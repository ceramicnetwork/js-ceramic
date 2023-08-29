import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { Observable } from 'rxjs'

interface IPFSPubsubQuerier {
  queryNetwork(streamId: StreamID): Observable<CID>
}

/**
 * Class for resolving a StreamID to the Tip (the CID of the most recent commit in the stream's
 * log), by querying the p2p network to discover any tips other Ceramic nodes on the network might
 * know about for this Stream.
 */
export class TipFetcher {
  constructor(readonly pubsubQuerier: IPFSPubsubQuerier) {}

  async findTip(streamID: StreamID, syncTimeoutSecs: number): Promise<CID> {
    throw new Error(`Not yet implemented`)
  }
}
