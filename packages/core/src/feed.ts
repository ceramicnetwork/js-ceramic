import { EventType, StreamMetadata, StreamState } from '@ceramicnetwork/common'
import { Subject, type Observable } from 'rxjs'
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

class DocumentsSubject extends Subject<FeedDocument> {}

/**
 * Read-only version of `Feed`.
 */
export interface PublicFeed {
  aggregation: {
    documents: Observable<FeedDocument>
    documentsA: (gt?: string) => ReadableStream<FeedDocument>
  }
}

export class Feed implements PublicFeed {
  readonly documentsSubject = new DocumentsSubject()

  constructor(
    private readonly feedStore: FeedAggregationStore,
    private readonly fromMemoryOrStore: (streamId: StreamID) => Promise<StreamState | undefined>
  ) {}

  get aggregation() {
    return {
      documents: this.documentsSubject,
      documentsA: (gt?: string) => {
        return this.documentsA(gt)
      },
    }
  }

  documentsA(gt?: string): ReadableStream<FeedDocument> {
    const transformer = new StreamLoadTransformer(this.fromMemoryOrStore)
    return this.feedStore.streamIDs(gt).pipeThrough(new TransformStream(transformer))
  }
}

export class StreamLoadTransformer implements Transformer<StreamID, FeedDocument> {
  constructor(
    private readonly fromMemoryOrStore: (streamId: StreamID) => Promise<StreamState | undefined>
  ) {}

  async transform(streamId: StreamID, controller: TransformStreamDefaultController<FeedDocument>) {
    const found = await this.fromMemoryOrStore(streamId)
    if (found) {
      const feedDocument = FeedDocument.fromStreamState(found)
      controller.enqueue(feedDocument)
    }
  }
}
