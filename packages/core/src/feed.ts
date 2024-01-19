import type { StreamMetadata, StreamState } from '@ceramicnetwork/common'
import { Subject, type Observable } from 'rxjs'
import { CommitID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '@ceramicnetwork/common'

export class FeedDocument {
  constructor(
    readonly commitId: CommitID,
    readonly content: any,
    readonly metadata: StreamMetadata
  ) {}

  static fromStreamState(streamState: StreamState): FeedDocument {
    return {
      commitId: StreamUtils.commitIdFromStreamState(streamState),
      content: streamState.next ? streamState.next.content : streamState.content,
      metadata: streamState.next ? streamState.next.metadata : streamState.metadata,
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
