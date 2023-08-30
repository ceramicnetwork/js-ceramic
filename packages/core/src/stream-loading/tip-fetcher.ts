import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { lastValueFrom, Observable, timer, takeUntil } from 'rxjs'

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
   * Queries pubsub for the current tip for the given StreamID.  If no response messages come
   * back within 'syncTimeoutSecs', returns null.  Note that there's no guarantee that the CID
   * that comes back from this is *actually* a valid tip for this stream, that validation needs to
   * happen later.
   * @param streamID
   * @param syncTimeoutSecs
   */
  async findTip(streamID: StreamID, syncTimeoutSecs: number): Promise<CID | null> {
    const tipSource$ = this.pubsubQuerier.queryNetwork(streamID)
    const timeoutMillis = syncTimeoutSecs * 1000
    return lastValueFrom(tipSource$.pipe(takeUntil(timer(timeoutMillis))), {
      defaultValue: null,
    })
  }
}
