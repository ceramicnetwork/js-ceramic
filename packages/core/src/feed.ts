import { Subject, Observable, map, NextObserver } from 'rxjs'
import { type StreamMetadata, type StreamState } from '@ceramicnetwork/common'
import { CommitID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '../../common/lib/utils/stream-utils.js' //TODO: once commitIdFromStreamState is part of the package remove this line, and update the @ceramicnetwork/common import
import type { AnchorStatus } from '@ceramicnetwork/common'

export type Document = {
  commitId: CommitID
  content: any
  anchorStatus: AnchorStatus
  metadata: StreamMetadata
}

class DocumentsSubject extends Observable<Document> implements NextObserver<StreamState> {
  readonly subject: Subject<StreamState>
  constructor() {
    super((subscriber) => {
      const subscription = this.subject
        .pipe(
          // transform each incoming StreamState to a Document
          map((streamState: StreamState) => {
            return {
              commitId: StreamUtils.commitIdFromStreamState(streamState),
              content: streamState.next ? streamState.next.content : streamState.content,
              anchorStatus: streamState.anchorStatus,
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
    documents: Observable<Document>
  }
}

export class Feed implements PublicFeed {
  readonly aggregation = {
    documents: new DocumentsSubject(),
  }
}
