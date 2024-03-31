import { ObjectStore } from './object-store.js'
import { StreamID } from '@ceramicnetwork/streamid'

function serializeStreamID(streamID: StreamID): string {
  return streamID.toString()
}

function deserializeStreamID(input: string): StreamID {
  return StreamID.fromString(input)
}

/**
 * A storage for feed aggregation queue: key is a timestamp, value is StreamID.
 */
export class FeedAggregationStore extends ObjectStore<number, StreamID> {
  protected useCaseName = 'feed-aggregation'

  constructor() {
    super(String, serializeStreamID, deserializeStreamID)
  }
}
