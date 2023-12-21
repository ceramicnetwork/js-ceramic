import { Subject, Observable, map, NextObserver } from 'rxjs'
import { type StreamMetadata, type StreamState } from '@ceramicnetwork/common'
import { CommitID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '../../common/lib/utils/stream-utils.js' //TODO: once commitIdFromStreamState is part of the package remove this line, and update the @ceramicnetwork/common import

export type FeedDocument = {
  commitId: CommitID
  content: any
  metadata: StreamMetadata
}

class DocumentsSubject extends Observable<FeedDocument> implements NextObserver<StreamState> {
  readonly subject: Subject<StreamState>
  constructor() {
    super((subscriber) => {
      const subscription = this.subject
        .pipe(
          // transform each incoming StreamState to a FeedDocument
          map((streamState: StreamState) => {
            return {
              commitId: StreamUtils.commitIdFromStreamState(streamState),
              content: streamState.next ? streamState.next.content : streamState.content,
              metadata: streamState.next ? streamState.next.metadata : streamState.metadata,
            }
          })
        )
        .subscribe(subscriber)

      return () => {
        subscription.unsubscribe()
      }
    })

    this.subject = new Subject<StreamState>()
  }

  next(s: StreamState) {
    this.subject.next(s)
  }
}

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
