import { jest } from '@jest/globals'
import { empty, fromEvent, merge } from 'rxjs'
import { IpfsApi, LoggerProvider, TestUtils } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import * as random from '@stablelib/random'
import { Pubsub } from '../pubsub.js'
import { MsgType, QueryMessage, serialize, UpdateMessage } from '../pubsub-message.js'
import { PubsubRateLimit } from '../pubsub-ratelimit.js'
import { chunks } from '../../__tests__/chunks.util.js'
import { whenSubscriptionDone } from '../../__tests__/when-subscription-done.util.js'

const TOPIC = 'test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)
const PEER_ID = 'PEER_ID'
const QUERIES_PER_SECOND = 5
const MAX_QUEUED_QUERIES = QUERIES_PER_SECOND * 10
const ONE_SECOND = 1000 // in ms

function randomQueryMessage(): QueryMessage {
  return {
    typ: MsgType.QUERY,
    id: random.randomString(16),
    stream: FAKE_STREAM_ID,
  }
}

/**
 * Wait till start of a second. Simplifies reasoning about timing in the tests below
 */
async function startOfASecond() {
  const now = Date.now()
  const start = Math.ceil(now / 1000) * 1000
  await new Promise((resolve) => setTimeout(resolve, start - now))
}

/**
 * Indicate if difference between `a` and `b` is less than `grace`.
 */
function areClose(a: number, b: number, grace: number): boolean {
  const difference = Math.abs(a - b)
  return difference <= grace
}

describe('pubsub with queries rate limited', () => {
  jest.setTimeout(ONE_SECOND * 30)

  let ipfs: IpfsApi
  let pubsub: PubsubRateLimit
  let vanillaPubsub: Pubsub

  beforeEach(() => {
    ipfs = {
      pubsub: {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        ls: jest.fn(() => []),
        publish: jest.fn(),
      },
      id: jest.fn(async () => ({ id: PEER_ID })),
    } as unknown as IpfsApi
    vanillaPubsub = new Pubsub(ipfs, TOPIC, 3000, pubsubLogger, diagnosticsLogger)
    pubsub = new PubsubRateLimit(
      vanillaPubsub,
      new LoggerProvider().getDiagnosticsLogger(),
      QUERIES_PER_SECOND
    )
  })

  test('maxQuerySize', () => {
    expect(pubsub.maxQueuedQueries).toEqual(MAX_QUEUED_QUERIES)
  })

  test('basic message publishing passes through', async () => {
    const message = randomQueryMessage()
    // Wait until the message is published
    await whenSubscriptionDone(pubsub.next(message))
    expect(ipfs.pubsub.publish).toBeCalledWith(TOPIC, serialize(message))
    expect(ipfs.pubsub.publish).toBeCalledTimes(1)
  })

  test('Can send many non-query messages without issue', async () => {
    const numMessages = MAX_QUEUED_QUERIES * 2
    const messages = Array.from({ length: numMessages }).map<UpdateMessage>(() => {
      return {
        typ: MsgType.UPDATE,
        stream: FAKE_STREAM_ID,
        tip: FAKE_STREAM_ID.cid,
      }
    })
    // Wait until the messages are published
    await Promise.all(messages.map((message) => whenSubscriptionDone(pubsub.next(message))))
    expect(ipfs.pubsub.publish).toBeCalledTimes(numMessages)
  })

  test('rate limiting', async () => {
    const batches = 3
    const times = []

    vanillaPubsub.next = jest.fn(() => {
      times.push(new Date())
      return empty().subscribe()
    })
    const messages = Array.from({ length: QUERIES_PER_SECOND * batches }).map(randomQueryMessage)

    await Promise.all(messages.map((message) => whenSubscriptionDone(pubsub.next(message))))
    // Send all the messages using `this.pubsub.next`
    expect(times.length).toEqual(messages.length)
    expect(vanillaPubsub.next).toBeCalledTimes(messages.length)

    // Each chunk length is `QUERIES_PER_SECOND`
    // Each chunk is expected to contain messages sent during one second
    const perSecondChunks = chunks(times, QUERIES_PER_SECOND)
    // First elements should be more than a second away from each other
    const firstElements = perSecondChunks.map((chunk) => chunk[0])
    for (let i = 1; i < firstElements.length; i++) {
      const current = firstElements[i]
      const previous = firstElements[i - 1]
      const difference = current.valueOf() - previous.valueOf()
      // because sleep intervals aren't perfectly reliable and can be off by a millisecond or two, we
      // give a 10 millisecond "buffer" to the time comparison to prevent the test from failing sporadically.
      expect(areClose(difference, ONE_SECOND, 10)).toBeTruthy()
    }
    for (const chunk of perSecondChunks) {
      // Each chunk contains at most QUERIES_PER_SECOND elements
      expect(chunk.length <= QUERIES_PER_SECOND).toBeTruthy()
      // Within each chunk all the elements are within a second
      const first = chunk[0]
      expect(
        chunk.slice(1).every((timestamp) => Math.floor(timestamp.valueOf() - first) < ONE_SECOND)
      ).toBeTruthy()
    }
  })

  test('max number of queued queries', async () => {
    await startOfASecond()
    const numMessages = MAX_QUEUED_QUERIES * 2

    // Note how many messages are waiting in the queue at all times:
    // when a task is added, and after it finishes
    const queueSizes: Array<number> = []
    const eventsSubscription = merge(
      fromEvent(pubsub.queue, 'add'),
      fromEvent(pubsub.queue, 'next')
    ).subscribe(() => queueSizes.push(pubsub.queue.size))

    const messages = Array.from({ length: numMessages }).map(randomQueryMessage)

    // Wait until the messages are submitted
    // No errors expected
    await Promise.all(messages.map((message) => whenSubscriptionDone(pubsub.next(message))))

    eventsSubscription.unsubscribe()
    expect(queueSizes.every((s) => s <= MAX_QUEUED_QUERIES)).toBeTruthy()
    // We send `numMessages = 100` messages. The limit is `MAX_QUEUED_QUERIES = 50`.
    // We allow `QUERIES_PER_SECOND = 5` messages per second.
    // The first `QUERIES_PER_SECOND` are processed immediately, as they are under quota.
    // Then we start to queue up the remaining messages, up to `MAX_QUEUED_QUERIES`.
    // After the queue is full, we drop the remaining messages.
    // In total `QUERIES_PER_SECOND + MAX_QUEUED_QUERIES` messages are sent:
    // the messages that are allowed to be sent this minute, and the queued ones.
    expect(ipfs.pubsub.publish).toBeCalledTimes(QUERIES_PER_SECOND + MAX_QUEUED_QUERIES)
  })

  describe('warning is exposed once per interval', () => {
    const messages = Array.from({ length: QUERIES_PER_SECOND * 3 }).map(randomQueryMessage)

    test('long interval', async () => {
      const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
      const pubsub = new PubsubRateLimit(
        vanillaPubsub,
        diagnosticsLogger,
        QUERIES_PER_SECOND,
        30 * 1000
      )
      const warnSpy = jest.spyOn(diagnosticsLogger, 'warn')
      await Promise.all(messages.map((message) => whenSubscriptionDone(pubsub.next(message))))
      expect(warnSpy).toBeCalledTimes(1)
    })
    test('short interval', async () => {
      // We want to prove that warnings are sent once every `rateLimitWarningsIntervalMs`.
      // The messages are rate-limited **per second**, and we can not change it for test purposes.
      // Below we first start to queue the messages by sending `QUERIES_PER_SECOND + 1` messages.
      // First `QUERIES_PER_SECOND` messages are sent this second. Additional one goes to the queue, triggering the warning.
      const rateLimitWarningsIntervalMs = 200
      const diagnosticsLogger = new LoggerProvider().getDiagnosticsLogger()
      const pubsub = new PubsubRateLimit(
        vanillaPubsub,
        diagnosticsLogger,
        QUERIES_PER_SECOND,
        rateLimitWarningsIntervalMs
      )

      const warnMock = jest.fn()
      diagnosticsLogger.warn = warnMock
      // For clarity of the test, we disable processing here.
      // If the queue is running, it is harder to reason about timing of message queueing.
      // Now with the queue paused, every message gets into the queue.
      // It simulates the case of sending speed > rate limit, which is what we need to trigger the warning.
      pubsub.queue.pause()

      await startOfASecond()
      // One warning here, because we start populating the queue.
      const subscriptions = messages
        .slice(0, QUERIES_PER_SECOND + 1)
        .map((message) => pubsub.next(message))
      expect(warnMock).toBeCalledTimes(1)
      warnMock.mockClear()

      await startOfASecond()
      // Scenario 1: Send a message after `rateLimitWarningsIntervalMs`.
      // The interval for the warning is over.
      // Every message now gets into the queue. It triggers the warning.
      const numMessagesSent = 10
      for (const message of messages.slice(0, numMessagesSent)) {
        await TestUtils.delay(rateLimitWarningsIntervalMs + 10)
        subscriptions.push(pubsub.next(message))
      }
      expect(warnMock).toBeCalledTimes(numMessagesSent)
      warnMock.mockClear()

      await startOfASecond()
      // Scenario 2: Send multiple messages during `rateLimitWarningsIntervalMs` interval.
      // We should expect only one warning per the interval.

      // This many messages are sent during the interval. Could be any number, 5 is simpler to reason about.
      const numMessagesPerInterval = 5
      // We wait `betweenMessages` ms between every message, so that `numMessagesPerInterval` are sent each interval.
      const betweenMessages = rateLimitWarningsIntervalMs / numMessagesPerInterval
      for (const message of messages.slice(0, numMessagesSent)) {
        await TestUtils.delay(betweenMessages)
        subscriptions.push(pubsub.next(message))
      }
      // It took us this number of intervals to send all the messages
      const intervalsElapsed = Math.floor(numMessagesSent / numMessagesPerInterval)
      // We should expect the warning to be triggered once per interval.
      expect(warnMock).toBeCalledTimes(intervalsElapsed)
      subscriptions.map((s) => s.unsubscribe())
    })
  })
})
