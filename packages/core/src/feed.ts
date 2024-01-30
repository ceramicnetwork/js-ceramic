import { CommitType, LogEntry, StreamMetadata, StreamState } from '@ceramicnetwork/common'
import { Subject, type Observable } from 'rxjs'
import { CommitID } from '@ceramicnetwork/streamid'
import { StreamUtils } from '@ceramicnetwork/common'

/**
 * Describes all event types
 */
export enum EventType {
  CREATE = 0,
  ANCHOR = 1,
  UPDATE = 2,
}

/**
 * Checks last log in stream state and categorizes the event accordingly
 * @param log
 * @returns EventType
 */
function parseCommitType(log: LogEntry[]): EventType {
  const length = log.length

  if (length == 1) return EventType.CREATE

  switch (log[length - 1].type) {
    case CommitType.ANCHOR:
      return EventType.ANCHOR
    case CommitType.GENESIS:
      return EventType.CREATE
    case CommitType.SIGNED:
      return EventType.UPDATE
    default:
      return EventType.UPDATE
  }
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
      eventType: parseCommitType(streamState.log),
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
