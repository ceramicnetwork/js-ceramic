import type { CID } from 'multiformats/cid'
import { BehaviorSubject } from 'rxjs'
import { StreamID } from '@ceramicnetwork/streamid'
import type { StreamState, Stream } from '@ceramicnetwork/common'
import {
  AdminApi,
  AnchorStatus,
  EventType,
  RunningStateLike,
  SignatureStatus,
  StreamUtils,
} from '@ceramicnetwork/common'
import first from 'it-first'
import { BaseTestUtils } from '@ceramicnetwork/base-test-utils'

export const testIfV3 = process.env['CERAMIC_RECON_MODE'] ? test.skip : test

class FakeRunningState extends BehaviorSubject<StreamState> implements RunningStateLike {
  readonly id: StreamID
  readonly state: StreamState

  constructor(value: StreamState) {
    super(value)
    this.state = this.value
    this.id = new StreamID(this.state.type, this.state.log[0].cid)
  }
}

export class CommonTestUtils {
  static randomCID(version: 0 | 1 = 1, codec = 0x71, hasher = 0x12): CID {
    return BaseTestUtils.randomCID(version, codec, hasher)
  }

  static async waitForConditionOrTimeout(
    predicate: () => Promise<boolean>,
    timeoutMs = 1000 * 30
  ): Promise<boolean> {
    return BaseTestUtils.waitForConditionOrTimeout(predicate, timeoutMs)
  }

  static async delay(ms: number, signal?: AbortSignal): Promise<void> {
    return BaseTestUtils.delay(ms, signal)
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
    onFailure?: (state: StreamState) => void
  ): Promise<void> {
    let now = new Date()
    const expiration = new Date(now.getTime() + timeoutMs)

    while (now < expiration) {
      await stream.sync()
      if (predicate(stream.state)) {
        return
      }
      now = new Date()
      await CommonTestUtils.delay(100) // poll every 100ms
    }
    if (onFailure) {
      onFailure(stream.state)
    } else {
      throw new Error(
        `Timeout while waiting for desired state to be reached.  Current state: ${JSON.stringify(
          StreamUtils.serializeState(stream.state),
          null,
          2
        )}`
      )
    }
  }

  /**
   * Given a stream, continuously waits for
   * the streams anchor status to be changed to `status`
   * @param stream
   * @param status - AnchorStatus to wait for
   * @param timeout - how long to wait for
   */
  static expectAnchorStatus(stream: Stream, status: AnchorStatus, timeout = 1000) {
    return this.waitForState(
      stream,
      timeout,
      (s) => s.anchorStatus === status,
      (s) => {
        throw new Error(`Expected anchor status ${status} but found ${s.anchorStatus}`)
      }
    )
  }

  static runningState(state: StreamState): RunningStateLike {
    return new FakeRunningState(state)
  }

  static async isPinned(adminApi: AdminApi, streamId: StreamID): Promise<boolean> {
    const iterator = await adminApi.pin.ls(streamId)
    return (await first(iterator)) == streamId.toString()
  }

  static randomStreamID(): StreamID {
    return BaseTestUtils.randomStreamID()
  }

  static makeStreamState(): StreamState {
    const cid = CommonTestUtils.randomCID()
    return {
      type: 0,
      content: { num: 0 },
      metadata: {
        controllers: [''],
      },
      signature: SignatureStatus.GENESIS,
      anchorStatus: AnchorStatus.NOT_REQUESTED,
      log: [
        {
          type: EventType.INIT,
          cid,
        },
      ],
    }
  }
}
