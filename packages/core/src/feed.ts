import { EventType, StreamMetadata, StreamState } from '@ceramicnetwork/common'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '@ceramicnetwork/common'
import type { FeedAggregationStore } from './store/feed-aggregation-store.js'

export class FeedDocument {
  constructor(
    readonly commitId: CommitID,
    readonly content: any,
    readonly metadata: StreamMetadata,
    readonly eventType: EventType
  ) {}

  static fromStreamState(streamState: StreamState): FeedDocument {
    return {
      commitId: StreamUtils.commitIdFromStreamState(streamState),
      content: streamState.next ? streamState.next.content : streamState.content,
      metadata: streamState.next ? streamState.next.metadata : streamState.metadata,
      eventType: streamState.log[streamState.log.length - 1].type,
    }
  }
}

/**
 * Read-only version of `Feed`.
 */
export interface PublicFeed {
  aggregation: {
    documents: (after?: string) => ReadableStream<FeedDocument>
  }
}

export class Feed implements PublicFeed {
  constructor(
    private readonly feedStore: FeedAggregationStore,
    private readonly streamState: (streamId: StreamID) => Promise<StreamState | undefined>
  ) {}

  get aggregation() {
    return {
      documents: this.documents.bind(this),
    }
  }

  documents(after?: string): ReadableStream<FeedDocument> {
    const transformer = new StreamLoadTransformer(this.streamState)
    return this.feedStore.streamIDs(after).pipeThrough(new TransformStream(transformer))
  }
}

export class StreamLoadTransformer implements Transformer<StreamID, FeedDocument> {
  constructor(
    private readonly streamState: (streamId: StreamID) => Promise<StreamState | undefined>
  ) {}

  async transform(streamId: StreamID, controller: TransformStreamDefaultController<FeedDocument>) {
    const found = await this.streamState(streamId)
    if (found) {
      const feedDocument = FeedDocument.fromStreamState(found)
      controller.enqueue(feedDocument)
    }
  }
}
