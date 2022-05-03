import { BehaviorSubject } from 'rxjs'
import { StreamState } from './stream.js'
import { StreamUtils } from './utils/stream-utils.js'
//import { tracer } from './setup-instrumentation.js'
//const { trace }  = require("@opentelemetry/api");
/**
 * BehaviourSubject<StreamState> that emits only distinct values.
 */
export class StreamStateSubject extends BehaviorSubject<StreamState> {
  next(next: StreamState) {
    const otSpan = tracer.startSpan('streamstate_test');
    const current = this.value

    if (!StreamUtils.statesEqual(current, next)) {
      super.next(next)
    }
    otSpan.end()
  }
}
