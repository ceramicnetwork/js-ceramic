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
      await BaseTestUtils.delay(100)
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
