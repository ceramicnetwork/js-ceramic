import { StreamState, Stream } from '../stream'
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
   * Returns a Promise that resolves when there is an update to the given stream's state.
   * @param stream
   */
  static registerChangeListener(stream: Stream): Promise<StreamState> {
    // TODO update this to only use public apis
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return stream.state$.pipe(take(1)).toPromise()
  }

  /**
   * Given a stream and a predicate that operates on the stream state, continuously waits for
   * changes to the stream until the predicate returns true.
   * @param stream
   * @param timeout - how long to wait for
   * @param predicate - function that takes the stream's StreamState as input and returns true when this function can stop waiting
   * @param onFailure - function called if we time out before the predicate becomes true
   */
  static async waitForState(
    stream: Stream,
    timeout: number,
    predicate: (state: StreamState) => boolean,
    onFailure: () => void
  ): Promise<void> {
    if (predicate(stream.state)) return
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeout))
    // TODO update this to only use public apis
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const completionPromise = stream.state$.pipe(filter((state) => predicate(state))).toPromise()
    await Promise.race([timeoutPromise, completionPromise])
    if (!predicate(stream.state)) {
      onFailure()
    }
  }

  static runningState(state: StreamState): RunningStateLike {
    return new FakeRunningState(state)
  }
}
