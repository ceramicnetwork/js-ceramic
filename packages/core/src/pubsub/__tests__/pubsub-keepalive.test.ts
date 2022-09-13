import { jest } from '@jest/globals'
import { IpfsApi, LoggerProvider, TestUtils } from '@ceramicnetwork/common'
import { Pubsub } from '../pubsub.js'
import { deserialize, KeepaliveMessage, MsgType } from '../pubsub-message.js'
import { PubsubKeepalive } from '../pubsub-keepalive.js'
import { version } from '../../version.js'

const TOPIC = 'test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()

const PEER_ID = 'PEER_ID'

describe('pubsub keepalive', () => {
  test('sends keepalive if no messages over a period of time', async () => {
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
      pubsubLogger,
      diagnosticsLogger
    )
    const maxPubsubIntervalTime = 100
    const maxKeepaliveIntervalTime = 500
    const pubsubWithKeepalive = new PubsubKeepalive(
      pubsub,
      maxPubsubIntervalTime,
      maxKeepaliveIntervalTime
    )
    const subscription = pubsubWithKeepalive.subscribe()
    await TestUtils.delay(maxPubsubIntervalTime * 5)
    expect(ipfs.pubsub.publish.mock.calls.length).toBeGreaterThanOrEqual(4)
    for (const call of ipfs.pubsub.publish.mock.calls) {
      expect(call[0]).toEqual(TOPIC)
      const message = deserialize({ data: call[1] }) as KeepaliveMessage
      expect(message.typ).toEqual(MsgType.KEEPALIVE)
      expect(message.ver).toEqual(version)
    }

    subscription.unsubscribe()
  })
  test('sends keepalive if no keepalive messages over a period of time', async () => {
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
      pubsubLogger,
      diagnosticsLogger
    )
    const maxPubsubIntervalTime = 1000
    const maxKeepaliveIntervalTime = 100
    const pubsubWithKeepalive = new PubsubKeepalive(
      pubsub,
      maxPubsubIntervalTime,
      maxKeepaliveIntervalTime
    )
    const subscription = pubsubWithKeepalive.subscribe()
    await TestUtils.delay(maxKeepaliveIntervalTime * 10)
    expect(ipfs.pubsub.publish.mock.calls.length).toBeGreaterThanOrEqual(5)
    expect(ipfs.pubsub.publish.mock.calls.length).toBeLessThanOrEqual(10)
    for (const call of ipfs.pubsub.publish.mock.calls) {
      expect(call[0]).toEqual(TOPIC)
      const message = deserialize({ data: call[1] }) as KeepaliveMessage
      expect(message.typ).toEqual(MsgType.KEEPALIVE)
      expect(message.ver).toEqual(version)
    }

    subscription.unsubscribe()
  })
  test('does not send additional keepalives if had keepalive within a period of time', async () => {
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
      pubsubLogger,
      diagnosticsLogger
    )
    const maxPubsubIntervalTime = 1000
    const maxKeepaliveIntervalTime = 1000
    const pubsubWithKeepalive = new PubsubKeepalive(
      pubsub,
      maxPubsubIntervalTime,
      maxKeepaliveIntervalTime
    )
    const subscription = pubsubWithKeepalive.subscribe()
    await TestUtils.delay(250)
    expect(ipfs.pubsub.publish.mock.calls.length).toEqual(0)
    subscription.unsubscribe()
  })
})
