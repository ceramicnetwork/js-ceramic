/**
 * A class to encapsulate accessing the system clock.
 * By mocking out the 'now' method, unit tests can effectively control the flow
 * of time in the tests, so long as the objects being tested always go through the
 * ClockSource when accessing the system clock in any way.
 */
export class ClockSource {
  /**
   * Returns the current time from reading the system clock. Unit tests can override
   * this method to control the progression of time in the test.
   */
  now(): Date {
    return new Date()
  }

  /**
   * Sleeps until the ClockSource reports that the current time is at least the time given.
   * @param until - when to wait until
   */
  async waitUntil(until: Date): Promise<void> {
    const delay = async function (ms) {
      return new Promise<void>((resolve) => setTimeout(() => resolve(), ms))
    }

    let now = this.now()

    while (now < until) {
      await delay(until.getTime() - now.getTime())
      now = this.now()
    }
  }
}
