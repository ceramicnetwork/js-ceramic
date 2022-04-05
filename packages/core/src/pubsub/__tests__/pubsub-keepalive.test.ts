import { jest } from '@jest/globals'
import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common'
import { Pubsub } from '../pubsub.js'
import { deserialize, KeepaliveMessage, MsgType } from '../pubsub-message.js'
import { delay } from '../../__tests__/delay.js'
import { PubsubKeepalive } from '../pubsub-keepalive.js'
import { version } from '../../version.js'

const TOPIC = 'test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()

const PEER_ID = 'PEER_ID'

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
  const pubsub = new Pubsub(
    ipfs as unknown as IpfsApi,
    TOPIC,
    3000,
    pubsubLogger,
    diagnosticsLogger
  )
  const maxIntervalWithoutKeepalive = 50
  const pubsubWithKeepalive = new PubsubKeepalive(
    pubsub,
    keepaliveInterval,
    maxIntervalWithoutKeepalive
  )
  const subscription = pubsubWithKeepalive.subscribe()

  await delay(keepaliveInterval * 5)

  expect(ipfs.pubsub.publish.mock.calls.length).toBeGreaterThanOrEqual(8)
  for (const call of ipfs.pubsub.publish.mock.calls) {
    expect(call[0]).toEqual(TOPIC)
    const message = deserialize({ data: call[1] }) as KeepaliveMessage
    expect(message.typ).toEqual(MsgType.KEEPALIVE)
    expect(message.ver).toEqual(version)
  }

  subscription.unsubscribe()
})
