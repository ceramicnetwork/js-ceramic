import { BehaviorSubject } from 'rxjs'
import { StreamState } from './stream.js'
import { StreamUtils } from './utils/stream-utils.js'

/**
 * BehaviourSubject<StreamState> that emits only distinct values.
 */
export class StreamStateSubject extends BehaviorSubject<StreamState> {
  next(next: StreamState) {
    const current = this.value
    if (!StreamUtils.statesEqual(current, next)) {
      super.next(next)
    }
  }
}
