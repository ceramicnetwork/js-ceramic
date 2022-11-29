import { BehaviorSubject, lastValueFrom, firstValueFrom } from 'rxjs'
import { filter } from 'rxjs/operators'
import { CID } from 'multiformats/cid'
import * as uint8arrays from 'uint8arrays'
import * as random from '@stablelib/random'
import { StreamID } from '@ceramicnetwork/streamid'
import { decode as decodeMultiHash } from 'multiformats/hashes/digest'
import type { StreamState, Stream } from '../stream.js'
import { RunningStateLike } from '../running-state-like.js'
import { AnchorStatus } from '../stream.js'
import type { CeramicApi } from '../ceramic-api.js'
import first from 'it-first'

const SHA256_CODE = 0x12

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
    const iterator = await ceramic.pin.ls(streamId)
    return (await first(iterator)) == streamId.toString()
  }

  static randomCID(): CID {
    const body = uint8arrays.concat([
      uint8arrays.fromString('1220', 'base16'),
      random.randomBytes(32),
    ])
    return CID.create(1, SHA256_CODE, decodeMultiHash(body))
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
