import { jest } from '@jest/globals'
import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common';
import { Pubsub } from '../pubsub.js'
import { MsgType, serialize } from '../pubsub-message.js'
import { StreamID } from '@ceramicnetwork/streamid'
import { bufferCount } from 'rxjs/operators'
import * as random from '@stablelib/random'
import { asIpfsMessage } from './as-ipfs-message.js'
import { from, firstValueFrom } from 'rxjs'

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
  const pubsub = new Pubsub(ipfs as unknown as IpfsApi, TOPIC, 3000, pubsubLogger, diagnosticsLogger)
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
  const pubsub = new Pubsub(ipfs as unknown as IpfsApi, TOPIC, 3000, pubsubLogger, diagnosticsLogger)
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
