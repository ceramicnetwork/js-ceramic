import { jest } from '@jest/globals'
import { LoggerProvider } from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import * as random from '@stablelib/random'
import { Pubsub } from '../pubsub.js'
import { MsgType, serialize } from '../pubsub-message.js'
import { PubsubRateLimit } from '../pubsub-ratelimit.js'

const TOPIC = 'test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)
const PEER_ID = 'PEER_ID'
const QUERIES_PER_SECOND = 5
const MAX_QUEUED_QUERIES = 10

describe('pubsub with queries rate limited', () => {
  let ipfs
  let pubsub

  beforeEach(() => {
    ipfs = {
      pubsub: {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        ls: jest.fn(() => []),
        publish: jest.fn(),
      },
      id: jest.fn(async () => ({ id: PEER_ID })),
    }
    const raw_pubsub = new Pubsub(ipfs, TOPIC, 3000, pubsubLogger, diagnosticsLogger)
    pubsub = new PubsubRateLimit(
      raw_pubsub,
      new LoggerProvider().getDiagnosticsLogger(),
      QUERIES_PER_SECOND,
      MAX_QUEUED_QUERIES
    )
  })

  test('basic message publishing passes through', async () => {
    const message = {
      typ: MsgType.QUERY as MsgType.QUERY,
      id: random.randomString(32),
      stream: FAKE_STREAM_ID,
    }
    const subscription = pubsub.next(message)
    const messagePublished = new Promise<void>((resolve) => {
      subscription.add(() => {
        // Can be replaced with delay, but this is faster.
        expect(ipfs.pubsub.publish).toBeCalledWith(TOPIC, serialize(message))
        resolve()
      })
    })
    await messagePublished
    expect(ipfs.pubsub.publish).toBeCalledTimes(1)
  })

  test('Can send many non-query messages without issue', async () => {
    const numMessages = MAX_QUEUED_QUERIES * 2
    const messages = [...new Array(numMessages)].map(() => {
      return {
        typ: MsgType.UPDATE as MsgType.UPDATE,
        stream: FAKE_STREAM_ID,
        tip: FAKE_STREAM_ID.cid,
      }
    })

    const allMessagesPublished = new Promise<void>((resolve, _) => {
      let i = 0
      messages.map((message) => {
        pubsub.next(message).add(() => {
          i++
          if (i >= numMessages) {
            resolve()
          }
        })
      })
    })
    await allMessagesPublished
    expect(ipfs.pubsub.publish).toBeCalledTimes(numMessages)
  })

  test('query messages are rate limited', async () => {
    const mockNow = jest.spyOn(pubsub._clock, 'now')
    const numMessages = QUERIES_PER_SECOND * 2
    const messages = [...new Array(numMessages).keys()].map((i) => {
      return {
        typ: MsgType.QUERY as MsgType.QUERY,
        id: i,
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
    const allQueriesPublished = new Promise<void>((resolveAllQueriesPublished, _) => {
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
    const messages = [...new Array(numMessages).keys()].map((i) => {
      return {
        typ: MsgType.QUERY as MsgType.QUERY,
        id: i,
        stream: FAKE_STREAM_ID,
      }
    })

    const allQueriesPublished = new Promise<void>((resolve, _) => {
      let i = 0
      messages.map((message, index) => {
        if (index < MAX_QUEUED_QUERIES) {
          pubsub.next(message).add(() => {
            i++
            if (i >= numMessages) {
              resolve()
            }
          })
        } else {
          expect(function () {
            i++
            if (i >= numMessages) {
              resolve()
            }
            pubsub.next(message)
          }).toThrow(/exceeded the maximum allowed rate/)
        }
      })
    })

    await allQueriesPublished
    expect(ipfs.pubsub.publish).toBeCalledTimes(MAX_QUEUED_QUERIES)
  })
})
