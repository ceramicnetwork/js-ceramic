import type { StreamState, Stream } from '../stream.js'
import { filter } from 'rxjs/operators'
import { BehaviorSubject, lastValueFrom } from 'rxjs'
import { RunningStateLike } from '../running-state-like.js'
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
  static async waitForState(
    stream: Stream,
    timeout: number,
    predicate: (state: StreamState) => boolean,
    onFailure: () => void
  ): Promise<void> {
    if (predicate(stream.state)) return
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeout))
    // We do not expect this promise to return anything, so set `defaultValue` to `undefined`
    const completionPromise = lastValueFrom(stream.pipe(filter((state) => predicate(state))), {
      defaultValue: undefined,
    })
    await Promise.race([timeoutPromise, completionPromise])
    if (!predicate(stream.state)) {
      onFailure()
    }
  }

  static runningState(state: StreamState): RunningStateLike {
    return new FakeRunningState(state)
  }

  static async delay(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms)
    })
  }
}
