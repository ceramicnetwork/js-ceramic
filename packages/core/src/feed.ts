import { Subject, type Observable } from 'rxjs'
import type { StreamState } from '@ceramicnetwork/common'

/**
 * Read-only version of `Feed`.
 */
export interface PublicFeed {
  aggregation: {
    streamStates: Observable<StreamState>
  }
}

export class Feed implements PublicFeed {
  readonly aggregation = {
    streamStates: new Subject<StreamState>(),
  }
}
