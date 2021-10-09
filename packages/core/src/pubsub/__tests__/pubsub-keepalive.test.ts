import { LoggerProvider } from '@ceramicnetwork/common'
import { Pubsub } from '../pubsub'
import { deserialize, MsgType, serialize } from '../pubsub-message'
import { StreamID } from '@ceramicnetwork/streamid'
import { bufferCount, first } from 'rxjs/operators'
import * as random from '@stablelib/random'
import { asIpfsMessage } from './as-ipfs-message'
import { from } from 'rxjs'
import { delay } from '../../__tests__/delay'
import { PubsubKeepalive } from '../pubsub-keepalive'

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

test('publish keepalive', async () => {
  const ipfs = {
    pubsub: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
      publish: jest.fn(),
    },
    id: jest.fn(async () => ({ id: PEER_ID })),
  }
  const keepaliveInterval = 100
  const pubsub = new Pubsub(ipfs, TOPIC, 3000, pubsubLogger, diagnosticsLogger)
  const pubsubWithKeepalive = new PubsubKeepalive(pubsub, keepaliveInterval)
  const subscription = pubsubWithKeepalive.subscribe()

  await delay(keepaliveInterval * 5)

  expect(ipfs.pubsub.publish.mock.calls.length).toBeGreaterThan(4)
  for (const call of ipfs.pubsub.publish.mock.calls) {
    expect(call[0]).toEqual(TOPIC)
    const message = deserialize({ data: call[1] })
    expect(message.typ).toEqual(MsgType.KEEPALIVE)
  }

  subscription.unsubscribe()
})
