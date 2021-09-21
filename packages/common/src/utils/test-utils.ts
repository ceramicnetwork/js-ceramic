import { StreamState, Stream, StreamSnapshot } from '../stream'
import { take, filter } from 'rxjs/operators'
import { BehaviorSubject } from 'rxjs'
import { RunningStateLike } from '../running-state-like'
import { StreamID } from '@ceramicnetwork/streamid'

class FakeRunningState extends BehaviorSubject<StreamState> implements RunningStateLike {
  readonly id: StreamID
  readonly state: StreamState

  constructor(value: StreamState) {
    super(value)
    this.state = this.value
    this.id = new StreamID(this.state.type, this.state.log[0].cid)
  }
}

export class TestUtils {
  /**
   * Given a stream and a predicate that operates on the stream state, continuously waits for
   * changes to the stream until the predicate returns true.
   * @param stream
   * @param timeout - how long to wait for
   * @param predicate - function that takes the stream's StreamState as input and returns true when this function can stop waiting
   * @param onFailure - function called if we time out before the predicate becomes true
   */
  // TODO update comment
  static async waitForState(
    stream: Stream,
    timeout: number,
    predicate: (state: StreamSnapshot) => boolean,
    onFailure: () => void
  ): Promise<void> {
    if (predicate(stream.state)) return
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeout))
    const completionPromise = stream.updates$.pipe(filter((state) => predicate(state))).toPromise()
    await Promise.race([timeoutPromise, completionPromise])
    if (!predicate(stream.state)) {
      onFailure()
    }
  }

  static waitForContent

  static runningState(state: StreamState): RunningStateLike {
    return new FakeRunningState(state)
  }
}
