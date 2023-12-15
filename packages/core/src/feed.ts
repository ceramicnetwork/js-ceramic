import { Subject, Observable, map } from 'rxjs'
import type { StreamMetadata, StreamState } from '@ceramicnetwork/common'
import { CommitID } from '@ceramicnetwork/streamid'
import type { AnchorStatus } from '@ceramicnetwork/common'

export type Document = {
  id: CommitID
  content: any
  anchorStatus: AnchorStatus
  metadata: StreamMetadata
}

class DocumentsSubject extends Observable<Document> {
  readonly subject: Subject<StreamState>
  constructor() {
    super((subscriber) => {
      const subscription = this.subject
        .pipe(
          // transform each incoming StreamState to a Document
          map((streamState: StreamState) => {
            const tipCID = streamState.log[streamState.log.length - 1].cid
            const genesisCID = streamState.log[0].cid
            const commitID = new CommitID(streamState.type, genesisCID, tipCID)
            return {
              id: commitID,
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
