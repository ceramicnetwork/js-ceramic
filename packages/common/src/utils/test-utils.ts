import { BehaviorSubject, lastValueFrom, firstValueFrom } from 'rxjs'
import { filter } from 'rxjs/operators'
import { CID } from 'multiformats/cid'
import * as random from '@stablelib/random'
import { StreamID } from '@ceramicnetwork/streamid'
import type { StreamState, Stream } from '../stream.js'
import { RunningStateLike } from '../running-state-like.js'
import { AnchorStatus } from '@ceramicnetwork/common'
import type { CeramicApi } from '../ceramic-api.js'
import first from 'it-first'
import { create } from 'multiformats/hashes/digest'

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
   * Wait up to 'timeoutMs' for the given predicate to return true.  Polls the given predicate once
   * every 100ms (plus however long it takes for the predicate itself to execute).
   * Returns true if the predicate eventually returned true, or false if it timed out
   * without ever becoming true.
   *
   * This test doesn't throw when it times out as that would wind up throwing a fairly uninformative
   * "timeout" error message.  So instead, test code using this should make sure to re-check the
   * condition that is being waited for, in case this actually did time out without the condition
   * ever being satisfied.  That will allow tests to throw more useful errors indicating what
   * condition actually failed.
   */
  static async waitForConditionOrTimeout(
    predicate: () => Promise<boolean>,
    timeoutMs = 1000 * 30
  ): Promise<boolean> {
    const startTime = new Date()
    const deadline = new Date(startTime.getTime() + timeoutMs)
    let now = startTime
    while (now < deadline) {
      await TestUtils.delay(100)
      now = new Date()

      try {
        const res = await predicate()
        if (res) {
          return res
        }
      } catch (err) {
        console.warn(err)
      }
    }

    console.warn(`timed out after ${timeoutMs}ms waiting for condition to be true`)
    return false
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
    timeoutMs: number,
    predicate: (state: StreamState) => boolean,
    onFailure: (state: StreamState) => void
  ): Promise<void> {
    if (predicate(stream.state)) return
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs))
    // We do not expect this promise to return anything, so set `defaultValue` to `undefined`
    const completionPromise = lastValueFrom(stream.pipe(filter((state) => predicate(state))), {
      defaultValue: undefined,
    })
    await Promise.race([timeoutPromise, completionPromise])
    if (!predicate(stream.state)) {
      onFailure(stream.state)
    }
  }

  /**
   * Given a stream, continuously waits for
   * the streams anchor status to be changed to ANCHORED
   * @param stream
   * @param timeout - how long to wait for
   */
  static waitForAnchor(stream: Stream, timeout: number): Promise<void> {
    return this.waitForState(
      stream,
      timeout,
      (s) => s.anchorStatus === AnchorStatus.ANCHORED,
      () => {
        throw new Error(`Expect anchored`)
      }
    )
  }

  static runningState(state: StreamState): RunningStateLike {
    return new FakeRunningState(state)
  }

  static async delay(ms: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms)
    })
  }

  static async isPinned(ceramic: CeramicApi, streamId: StreamID): Promise<boolean> {
    const iterator = await ceramic.admin.pin.ls(streamId)
    return (await first(iterator)) == streamId.toString()
  }

  static randomCID(version: 0 | 1 = 1, codec = 0x71, hasher = 0x12): CID {
    // 0x71 is DAG-CBOR codec identifier
    // 0x12 is SHA-256 hashing algorithm
    return CID.create(version, codec, create(hasher, random.randomBytes(32)))
  }

  /**
   * Trigger anchor for a stream. WARNING: can only work on Ceramic Core.
   * @param ceramic Ceramic Core instance.
   * @param stream Stream to trigger anchor on.
   */
  static async anchorUpdate(ceramic: CeramicApi, stream: Stream): Promise<void> {
    const anchorService = ceramic.context.anchorService as any
    if ('anchor' in anchorService) {
      const tillAnchored = firstValueFrom(
        stream.pipe(
          filter((state) =>
            [AnchorStatus.ANCHORED, AnchorStatus.FAILED].includes(state.anchorStatus)
          )
        )
      )
      await anchorService.anchor()
      await tillAnchored
    }
  }
}
