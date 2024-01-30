import type { StreamMetadata, StreamState } from '@ceramicnetwork/common'
import { Subject, type Observable } from 'rxjs'
import { CommitID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '@ceramicnetwork/common'

/**
 * Describes all event types
 */
export enum EventType {
  CREATION = 0,
  PIN = 1,
  ANCHOR = 2,//TODO should we have several of this? does this even triggers the feed?
  UPDATE = 3,
}

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
      eventType: 0//TODO set correct type
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
  }
}

export class Feed implements PublicFeed {
  readonly aggregation = {
    documents: new DocumentsSubject(),
  }
}
