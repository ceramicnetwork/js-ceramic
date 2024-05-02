import { DiagnosticsLogger, EventType, StreamMetadata, StreamState } from '@ceramicnetwork/common'
import { CommitID, StreamID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '@ceramicnetwork/common'
import type { FeedAggregationStore, AggregationStoreEntry } from './store/feed-aggregation-store.js'

export class FeedDocument {
  constructor(
    readonly resumeToken: string,
    readonly commitId: CommitID,
    readonly content: any,
    readonly metadata: StreamMetadata,
    readonly eventType: EventType
  ) {}

  static fromStreamState(resumeToken: string, streamState: StreamState): FeedDocument {
    return new FeedDocument(
      resumeToken,
      StreamUtils.commitIdFromStreamState(streamState),
      streamState.next ? streamState.next.content : streamState.content,
      streamState.next ? streamState.next.metadata : streamState.metadata,
      streamState.log[streamState.log.length - 1].type
    )
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
    private readonly logger: DiagnosticsLogger,
    private readonly streamState: (streamId: StreamID) => Promise<StreamState | undefined>
  ) {}

  get aggregation() {
    return {
      documents: this.documents.bind(this),
    }
  }

  documents(after?: string): ReadableStream<FeedDocument> {
    const transformer = new StreamLoadTransformer(this.logger, this.streamState)
    return this.feedStore.streamIDs(after).pipeThrough(new TransformStream(transformer))
  }
}

export class StreamLoadTransformer implements Transformer<AggregationStoreEntry, FeedDocument> {
  constructor(
    private readonly logger: DiagnosticsLogger,
    private readonly streamState: (streamId: StreamID) => Promise<StreamState | undefined>
  ) {}

  async transform(
    entry: AggregationStoreEntry,
    controller: TransformStreamDefaultController<FeedDocument>
  ) {
    const found = await this.streamState(entry.streamID)
    if (found) {
      const feedDocument = FeedDocument.fromStreamState(entry.resumeToken, found)
      controller.enqueue(feedDocument)
    } else {
      this.logger.warn(`Can not send ${entry.streamID} to feed: not found in memory or store`)
    }
  }
}
