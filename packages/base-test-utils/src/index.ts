import type { CID } from 'multiformats/cid'
import { randomCID, StreamID } from '@ceramicnetwork/streamid'

export class BaseTestUtils {
  static randomCID(version: 0 | 1 = 1, codec = 0x71, hasher = 0x12): CID {
    return randomCID(version, codec, hasher)
  }

  static randomStreamID(): StreamID {
    return new StreamID(0, BaseTestUtils.randomCID())
  }

  /**
   * Wait up to 'timeoutMs' for the given predicate to return true.  Polls the given predicate once
   * every 100ms (plus however long it takes for the predicate itself to execute).
   * Throws an Error if the predicate does not become true within the timeout.
   * The error message in the thrown Error can be customized with the 'errMsgGenerator' arg.
   * @param predicate - function that returns a boolean. predicate function will be called multiple
   *   times, until either it returns true or the timeout passes.
   * @param timeoutMs - time limit for how long the predicate has to return true.
   * @param errMsgGenerator - customization for the message text in the thrown Error on timeout.
   *   Can be a single string, or a function that is called to generate a string, which can be
   *   useful when used with a closure over state in the test so that the error message can include
   *   additional information about current state.
   */
  static async waitForConditionOrTimeout(
    predicate: () => Promise<boolean>,
    timeoutMs = 1000 * 30,
    errMsgGenerator?: string | (() => string)
  ): Promise<void> {
    const startTime = new Date()
    const deadline = new Date(startTime.getTime() + timeoutMs)
    let now = startTime
    while (now < deadline) {
      await BaseTestUtils.delay(100)
      now = new Date()

      try {
        const res = await predicate()
        if (res) {
          return
        }
      } catch (err) {
        console.warn(err)
      }
    }

    const baseErrMsg = `timed out after ${timeoutMs}ms waiting for condition to be true`
    if (!errMsgGenerator) {
      throw new Error(baseErrMsg)
    }

    const customMsg = typeof errMsgGenerator == 'string' ? errMsgGenerator : errMsgGenerator()
    throw new Error(baseErrMsg + ': ' + customMsg)
  }

  static async delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => resolve(), ms)
      if (signal) {
        const handleAbort = () => {
          clearTimeout(timeout)
          signal.removeEventListener('abort', handleAbort)
          reject(signal.reason)
        }
        if (signal.aborted) handleAbort()
        signal.addEventListener('abort', handleAbort)
      }
    })
  }
}
