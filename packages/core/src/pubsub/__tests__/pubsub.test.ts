import { jest, test, expect } from '@jest/globals'
import { IpfsApi, LoggerProvider, TestUtils } from '@ceramicnetwork/common'
import { Pubsub } from '../pubsub.js'
import { MsgType, serialize } from '../pubsub-message.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { of } from 'rxjs'
import { bufferCount, concatMap, delay, map } from 'rxjs/operators'
import * as random from '@stablelib/random'
import { asIpfsMessage } from './as-ipfs-message.js'
import { from, first, firstValueFrom } from 'rxjs'
import { IPFSPubsubMessage } from '../incoming-channel.js'

const TOPIC = 'test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)
const OUTER_PEER_ID = 'OUTER_PEER_ID'
const PEER_ID = 'PEER_ID'

const LENGTH = 2
const MESSAGES = Array.from({ length: LENGTH }).map((_, index) => {
  return {
    typ: MsgType.QUERY as MsgType.QUERY,
    id: index.toString(),
    stream: FAKE_STREAM_ID,
  }
})
const OUTER_MESSAGES = MESSAGES.map((message) => asIpfsMessage(message, OUTER_PEER_ID))
const OUTER_GARBAGE = Array.from({ length: LENGTH }).map(() => {
  return {
    from: OUTER_PEER_ID,
    data: random.randomBytes(32),
    topicIDs: [TOPIC],
    seqno: random.randomBytes(10),
  }
})
const LATE_MESSAGE_AFTER = 1000

test('pass incoming messages, omit garbage', async () => {
  const feed$ = from(OUTER_GARBAGE.concat(OUTER_MESSAGES))
  const ipfs = {
    pubsub: {
      subscribe: async (_, handler) => {
        feed$.subscribe(handler)
      },
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
    },
    id: jest.fn(async () => ({ id: PEER_ID })),
  }
  const pubsub = new Pubsub(
    ipfs as unknown as IpfsApi,
    TOPIC,
    3000,
    LATE_MESSAGE_AFTER,
    pubsubLogger,
    diagnosticsLogger
  )
  // Even if garbage is first, we only receive well-formed messages
  const received = firstValueFrom(pubsub.pipe(bufferCount(LENGTH)))
  expect(await received).toEqual(MESSAGES)
  expect(ipfs.id).toBeCalledTimes(2) // One in Pubsub, another in IncomingChannel resubscribe
})

test('publish', async () => {
  const ipfs = {
    pubsub: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
      publish: jest.fn(),
    },
    id: jest.fn(async () => ({ id: PEER_ID })),
  }
  const pubsub = new Pubsub(
    ipfs as unknown as IpfsApi,
    TOPIC,
    3000,
    LATE_MESSAGE_AFTER,
    pubsubLogger,
    diagnosticsLogger
  )
  const message = {
    typ: MsgType.QUERY as MsgType.QUERY,
    id: random.randomString(32),
    stream: FAKE_STREAM_ID,
  }
  const subscription = pubsub.next(message)
  subscription.add(() => {
    // Can be replaced with delay, but this is faster.
    expect(ipfs.pubsub.publish).toBeCalledWith(TOPIC, serialize(message))
  })
  expect(ipfs.id).toBeCalledTimes(1)
})

function checkLog(func: (string) => void) {
  jest.spyOn(diagnosticsLogger, 'log').mockImplementation((_, content) => {
    func(content.toString())
  })
}
test('warn if no messages', async () => {
  const messages = [
    asIpfsMessage({
      typ: MsgType.QUERY,
      id: '1',
      stream: FAKE_STREAM_ID,
    }),
  ]
  const feed = from(messages)
  let sawLog = false
  checkLog((s) => {
    if (s.includes('please check your IPFS configuration.')) {
      sawLog = true
    }
  })
  const ipfs = {
    pubsub: {
      subscribe: async (_, handler) => {
        feed.subscribe(handler)
      },
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
      publish: jest.fn(),
    },
    id: jest.fn(async () => ({ id: PEER_ID })),
  }
  const pubsub = new Pubsub(
    ipfs as unknown as IpfsApi,
    TOPIC,
    3000,
    LATE_MESSAGE_AFTER,
    pubsubLogger,
    diagnosticsLogger
  )
  const result: any[] = []
  const subscription = pubsub.subscribe((message) => {
    result.push(message)
  })
  await TestUtils.delay(2000)
  expect(sawLog).toBeTruthy()
  expect(result.length).toEqual(messages.length)
  subscription.unsubscribe()
})

test('warn if no internal messages', async () => {
  const messages = [
    asIpfsMessage({
      typ: MsgType.QUERY,
      id: '1',
      stream: StreamID.fromString(
        'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60t'
      ),
    }),
  ]
  const feed = from(messages)
  let sawLog = false
  checkLog((s) => {
    if (s.includes('please check your IPFS configuration.')) {
      sawLog = true
    }
  })
  const ipfs = {
    pubsub: {
      subscribe: async (_, handler) => {
        feed.subscribe(handler)
      },
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
      publish: jest.fn(),
    },
    id: jest.fn(async () => ({ id: PEER_ID })),
  }
  const pubsub = new Pubsub(
    ipfs as unknown as IpfsApi,
    TOPIC,
    3000,
    LATE_MESSAGE_AFTER,
    pubsubLogger,
    diagnosticsLogger
  )
  const result: any[] = []
  const subscription = pubsub.subscribe((message) => {
    result.push(message)
  })
  await TestUtils.delay(2000)
  expect(sawLog).toBeTruthy()
  expect(result.length).toEqual(messages.length)
  subscription.unsubscribe()
})

type DelayedMessage = {
  delay: number
  message: IPFSPubsubMessage
}
test('continue even if a timeout occurs', async () => {
  const messages: Array<DelayedMessage> = [
    {
      delay: 0,
      message: asIpfsMessage({
        typ: MsgType.QUERY,
        id: '1',
        stream: FAKE_STREAM_ID,
      }),
    },
    {
      delay: 2000,
      message: asIpfsMessage({
        typ: MsgType.QUERY,
        id: '2',
        stream: FAKE_STREAM_ID,
      }),
    },
  ]
  const feed = from(messages).pipe(
    concatMap((msg) => {
      const d = msg.delay
      return of(msg.message).pipe(
        delay(msg.delay),
        map((msg) => {
          return msg
        })
      )
    })
  )
  let sawLog = false
  checkLog((s) => {
    if (s.includes('please check your IPFS configuration.')) {
      sawLog = true
    }
  })
  const ipfs = {
    pubsub: {
      subscribe: async (_, handler) => {
        feed.subscribe(handler)
      },
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
      publish: jest.fn(),
    },
    id: jest.fn(async () => ({ id: PEER_ID })),
  }
  const pubsub = new Pubsub(
    ipfs as unknown as IpfsApi,
    TOPIC,
    3000,
    LATE_MESSAGE_AFTER,
    pubsubLogger,
    diagnosticsLogger
  )
  const result: any[] = []
  const subscription = pubsub.subscribe((message) => {
    result.push(message)
  })
  await TestUtils.delay(2000)
  expect(sawLog).toBeTruthy()
  await TestUtils.delay(2000) //let rxjs finish
  expect(result.length).toEqual(messages.length)
  subscription.unsubscribe()
})
