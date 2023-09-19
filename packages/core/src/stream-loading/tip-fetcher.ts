import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { Observable, timer, takeUntil } from 'rxjs'

interface IPFSPubsubQuerier {
  queryNetwork(streamId: StreamID): Observable<CID>
}

/**
 * Class for resolving a StreamID to the Tip (the CID of the most recent commit in the stream's
 * log), by querying the p2p network to discover any tips other Ceramic nodes on the network might
 * know about for this Stream.
 */
export class TipFetcher {
  constructor(private readonly pubsubQuerier: IPFSPubsubQuerier) {}

  /**
   * Queries pubsub for the current tip for the given StreamID.  Returns an Observable that emits
   * all tip responses until `syncTimeoutSeconds` seconds pass.
   * Note that there's no guarantee that the CIDs emitted from this are *actually* valid tips for
   * this stream, that validation needs to happen later.
   * @param streamID
   * @param syncTimeoutSecs
   */
  findPossibleTips(streamID: StreamID, syncTimeoutSecs: number): Observable<CID> {
    const tipSource$ = this.pubsubQuerier.queryNetwork(streamID)
    const timeoutMillis = syncTimeoutSecs * 1000
    return tipSource$.pipe(takeUntil(timer(timeoutMillis)))
  }
}
