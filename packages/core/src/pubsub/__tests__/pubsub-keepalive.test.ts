import { expect, jest } from '@jest/globals'
import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common'
import { CommonTestUtils as TestUtils } from '@ceramicnetwork/common-test-utils'
import { Pubsub } from '../pubsub.js'
import { deserialize, KeepaliveMessage, MsgType } from '../pubsub-message.js'
import { PubsubKeepalive } from '../pubsub-keepalive.js'
import { version } from '../../version.js'

const TOPIC = 'test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()

const PEER_ID = 'PEER_ID'
const LATE_MESSAGE_AFTER = 1000
const FAKE_IPFS_VERSION = '0.0.0-fake'

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
      version: () => Promise.resolve({ version: FAKE_IPFS_VERSION }),
    }
    const pubsub = new Pubsub(
      ipfs as unknown as IpfsApi,
      TOPIC,
      3000,
      LATE_MESSAGE_AFTER,
      pubsubLogger,
      diagnosticsLogger
    )
    const maxPubsubIntervalTime = 100
    const maxKeepaliveIntervalTime = 500
    const pubsubWithKeepalive = new PubsubKeepalive(
      pubsub,
      ipfs as unknown as IpfsApi,
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
      expect(message.ipfsVer).toEqual(FAKE_IPFS_VERSION)
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
      version: () => Promise.resolve({ version: '0.0.0-fake' }),
    }
    const pubsub = new Pubsub(
      ipfs as unknown as IpfsApi,
      TOPIC,
      3000,
      LATE_MESSAGE_AFTER,
      pubsubLogger,
      diagnosticsLogger
    )
    const maxPubsubIntervalTime = 1000
    const maxKeepaliveIntervalTime = 100
    const pubsubWithKeepalive = new PubsubKeepalive(
      pubsub,
      ipfs as unknown as IpfsApi,
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
      expect(message.ipfsVer).toEqual(FAKE_IPFS_VERSION)
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
      version: () => Promise.resolve({ version: '0.0.0-fake' }),
    }
    const pubsub = new Pubsub(
      ipfs as unknown as IpfsApi,
      TOPIC,
      3000,
      LATE_MESSAGE_AFTER,
      pubsubLogger,
      diagnosticsLogger
    )
    const maxPubsubIntervalTime = 1000
    const maxKeepaliveIntervalTime = 1000
    const pubsubWithKeepalive = new PubsubKeepalive(
      pubsub,
      ipfs as unknown as IpfsApi,
      maxPubsubIntervalTime,
      maxKeepaliveIntervalTime
    )
    const subscription = pubsubWithKeepalive.subscribe()
    await TestUtils.delay(250)
    expect(ipfs.pubsub.publish.mock.calls.length).toEqual(0)
    subscription.unsubscribe()
  })
})
