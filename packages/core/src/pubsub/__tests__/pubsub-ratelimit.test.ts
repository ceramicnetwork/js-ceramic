import { jest } from '@jest/globals'
import { empty, fromEvent, merge } from 'rxjs'
import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import * as random from '@stablelib/random'
import { Pubsub } from '../pubsub.js'
import { MsgType, QueryMessage, serialize, UpdateMessage } from '../pubsub-message.js'
import { PubsubRateLimit, whenSubscriptionDone } from '../pubsub-ratelimit.js'

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

/**
 * Split +array+ into chunks of certain +size+.
 */
function chunked<A>(array: Array<A>, size: number): Array<Array<A>> {
  const results: Array<Array<A>> = []
  for (let i = 0; i < array.length; i += size) {
    results.push(array.slice(i, i + size))
  }
  return results
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

  test('basic message publishing passes through', async () => {
    const message = {
      typ: MsgType.QUERY as MsgType.QUERY,
      id: random.randomString(32),
      stream: FAKE_STREAM_ID,
    }
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
    const messages = Array.from({ length: QUERIES_PER_SECOND * batches }).map<QueryMessage>(() => {
      return {
        typ: MsgType.QUERY,
        id: random.randomString(16),
        stream: FAKE_STREAM_ID,
      }
    })
    await Promise.all(messages.map((message) => whenSubscriptionDone(pubsub.next(message))))
    // Send all the messages using `this.pubsub.next`
    expect(times.length).toEqual(messages.length)
    expect(vanillaPubsub.next).toBeCalledTimes(messages.length)

    const perSecondChunks = chunked(times, QUERIES_PER_SECOND)
    // First elements should be more than a second away from each other
    const firstElements = perSecondChunks.map((chunk) => chunk[0])
    for (let i = 1; i < firstElements.length; i++) {
      const current = firstElements[i]
      const previous = firstElements[i - 1]
      const difference = current.valueOf() - previous.valueOf()
      expect(difference >= ONE_SECOND).toBeTruthy()
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

  test.skip('query messages are rate limited', async () => {
    const mockNow = jest.spyOn((pubsub as any)._clock, 'now')
    const numMessages = QUERIES_PER_SECOND * 2
    const messages = Array.from({ length: numMessages }).map<QueryMessage>(() => {
      return {
        typ: MsgType.QUERY,
        id: random.randomString(16),
        stream: FAKE_STREAM_ID,
      }
    })

    // Fix time so it doesn't progress
    const startTime = new Date()
    mockNow.mockReturnValueOnce(startTime)
    mockNow.mockReturnValueOnce(new Date(startTime.getTime() + 100))
    mockNow.mockReturnValueOnce(new Date(startTime.getTime() + 200))
    mockNow.mockReturnValueOnce(new Date(startTime.getTime() + 300))
    mockNow.mockReturnValueOnce(new Date(startTime.getTime() + 400))
    mockNow.mockReturnValue(new Date(startTime.getTime() + 500))

    let maxQueriesPerSecondPublished
    let maxQueriesPerSecondPlusOnePublished
    const allQueriesPublished = new Promise<void>((resolveAllQueriesPublished) => {
      maxQueriesPerSecondPublished = new Promise<void>((resolveQueriesPerSecondPublished) => {
        maxQueriesPerSecondPlusOnePublished = new Promise<void>(
          (resolveQueriesPerSecondPlusOnePublished) => {
            let i = 0
            messages.map((message) => {
              pubsub.next(message).add(() => {
                i++
                if (i == QUERIES_PER_SECOND) {
                  resolveQueriesPerSecondPublished()
                }
                if (i == QUERIES_PER_SECOND + 1) {
                  resolveQueriesPerSecondPlusOnePublished()
                }
                if (i == numMessages) {
                  resolveAllQueriesPublished()
                }
              })
            })
          }
        )
      })
    })

    // Without time moving forward, only QUERIES_PER_SECOND queries can be published
    await maxQueriesPerSecondPublished
    expect(ipfs.pubsub.publish).toBeCalledTimes(QUERIES_PER_SECOND)

    // Now move time forward enough to let one more message in
    mockNow.mockReturnValue(new Date(startTime.getTime() + 1000))
    await maxQueriesPerSecondPlusOnePublished
    expect(ipfs.pubsub.publish).toBeCalledTimes(QUERIES_PER_SECOND + 1)

    // Now let the remaining messages through
    mockNow.mockReturnValue(new Date(startTime.getTime() + 5000))
    await allQueriesPublished
    expect(ipfs.pubsub.publish).toBeCalledTimes(numMessages)

    mockNow.mockRestore()
  })

  test('max number of queued queries', async () => {
    const numMessages = MAX_QUEUED_QUERIES * 2
    console.log('numMessages', numMessages)
    const original = vanillaPubsub.next.bind(vanillaPubsub)
    vanillaPubsub.next = (message: QueryMessage) => {
      console.log('next', message.id, new Date())
      return original(message)
    }

    // Note how many messages are waiting in the queue at all times:
    // when a task is added, and after it finishes
    const queueSizes: Array<number> = []
    const eventsSubscription = merge(
      fromEvent(pubsub.queue, 'add'),
      fromEvent(pubsub.queue, 'next')
    ).subscribe(() => queueSizes.push(pubsub.queue.size))

    const messages = Array.from({ length: numMessages }).map<QueryMessage>((_, i) => {
      return {
        typ: MsgType.QUERY,
        id: String(i),
        stream: FAKE_STREAM_ID,
      }
    })

    // Wait until the messages are submitted
    // No errors expected
    await Promise.all(messages.map((message) => whenSubscriptionDone(pubsub.next(message))))

    eventsSubscription.unsubscribe()
    console.log('q', queueSizes)
    expect(queueSizes.every((s) => s <= MAX_QUEUED_QUERIES)).toBeTruthy()

    // Only up to MAX_QUEUED_QUERIES should actually make it to the underlying pubsub network.
    // expect(ipfs.pubsub.publish).toBeCalledTimes(MAX_QUEUED_QUERIES)
  })
})
