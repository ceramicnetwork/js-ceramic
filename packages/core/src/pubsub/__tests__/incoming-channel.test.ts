import { jest } from '@jest/globals'
import { IpfsApi, LoggerProvider } from '@ceramicnetwork/common'
import { from, firstValueFrom, lastValueFrom } from 'rxjs'
import { StreamID } from '@ceramicnetwork/streamid'
import { createIPFS } from '../../__tests__/ipfs-util.js'
import { IncomingChannel, filterExternal, PubsubIncoming } from '../incoming-channel.js'
import { delay } from '../../__tests__/delay.js'
import { asIpfsMessage } from './as-ipfs-message.js'
import { MsgType } from '../pubsub-message.js'

const FAKE_STREAM_ID = StreamID.fromString(
  'kjzl6cwe1jw147dvq16zluojmraqvwdmbh61dx9e0c59i344lcrsgqfohexp60s'
)

const TOPIC = '/test'
const loggerProvider = new LoggerProvider()
const pubsubLogger = loggerProvider.makeServiceLogger('pubsub')
const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
const PEER_ID = 'PEER_ID'

describe('connection', () => {
  let ipfs: IpfsApi

  beforeEach(async () => {
    ipfs = await createIPFS()
  }, 10000)

  afterEach(async () => {
    await ipfs.stop()
  })

  test('subscribe and unsubscribe', async () => {
    const incoming$ = new IncomingChannel(ipfs, TOPIC, 30000, pubsubLogger, diagnosticsLogger)
    const subscribeSpy = jest.spyOn(ipfs.pubsub, 'subscribe')
    const unsubscribeSpy = jest.spyOn(ipfs.pubsub, 'unsubscribe')
    const subscription = incoming$.subscribe()
    await delay(200)
    // await incoming$.tasks.onIdle()
    expect(await ipfs.pubsub.ls()).toEqual([TOPIC])
    subscription.unsubscribe()
    await delay(200)
    expect(await ipfs.pubsub.ls()).toEqual([])
    expect(subscribeSpy).toBeCalledTimes(1)
    expect(unsubscribeSpy).toBeCalledTimes(1)
  })

  test('resubscribe', async () => {
    const resubscribePeriod = 200
    const incoming$ = new IncomingChannel(
      ipfs,
      TOPIC,
      resubscribePeriod,
      pubsubLogger,
      diagnosticsLogger
    )
    const subscribeSpy = jest.spyOn(ipfs.pubsub, 'subscribe')
    const unsubscribeSpy = jest.spyOn(ipfs.pubsub, 'unsubscribe')
    const subscription = incoming$.subscribe()
    await delay(200) // Wait till rxjs machinery is done
    expect(subscribeSpy).toBeCalledTimes(1) // Initial pubsub.subscribe
    expect(unsubscribeSpy).toBeCalledTimes(0)
    subscribeSpy.mock.calls[0][2].onError(new Error('fake error'))
    await delay(resubscribePeriod * 3)
    expect(subscribeSpy).toBeCalledTimes(2) // +1 on resubscribe
    expect(unsubscribeSpy).toBeCalledTimes(1)
    expect(await ipfs.pubsub.ls()).toEqual([TOPIC]) // And now we subscribed
    subscription.unsubscribe()
  }, 10000)
})

test('pass incoming message', async () => {
  const length = 10
  const messages = Array.from({ length }).map((_, index) => {
    return asIpfsMessage({
      typ: MsgType.QUERY,
      id: index.toString(),
      stream: FAKE_STREAM_ID,
    })
  })
  const feed$ = from(messages)
  const ipfs = {
    pubsub: {
      subscribe: async (_, handler) => {
        feed$.subscribe(handler)
      },
      unsubscribe: jest.fn(),
      ls: jest.fn(() => []),
    },
    id: async () => ({ id: PEER_ID }),
  } as unknown as IpfsApi
  const incoming$ = new IncomingChannel(ipfs, TOPIC, 30000, pubsubLogger, diagnosticsLogger)
  const result: any[] = []
  const subscription = incoming$.subscribe((message) => {
    result.push(message)
  })
  await delay(200) // Wait till rxjs machinery is done
  expect(result).toEqual(messages)
  subscription.unsubscribe()
})

describe('filterOuter', () => {
  const OUTER_PEER_ID = 'OUTER_PEER_ID'

  test('pass only outer messages', async () => {
    const length = 2
    const outerMessages = Array.from({ length }).map((_, index) => {
      return asIpfsMessage(
        {
          typ: MsgType.QUERY,
          id: index.toString(),
          stream: FAKE_STREAM_ID,
        },
        OUTER_PEER_ID
      )
    })
    const innerMessages = Array.from({ length }).map((_, index) => {
      return asIpfsMessage(
        {
          typ: MsgType.QUERY,
          id: index.toString(),
          stream: FAKE_STREAM_ID,
        },
        PEER_ID
      )
    })
    const messages = innerMessages.concat(outerMessages)
    const feed$ = from(messages)
    const ipfs = {
      pubsub: {
        subscribe: async (_, handler) => {
          feed$.subscribe(handler)
        },
        unsubscribe: jest.fn(),
        ls: jest.fn(() => []),
      },
      id: async () => ({ id: PEER_ID }),
    } as unknown as IpfsApi
    const incoming$ = new IncomingChannel(ipfs, TOPIC, 30000, pubsubLogger, diagnosticsLogger)
    const result: any[] = []
    const peerId$ = from(ipfs.id().then((_) => _.id))
    const subscription = incoming$.pipe(filterExternal(peerId$)).subscribe((message) => {
      result.push(message)
    })
    await delay(200) // Wait till rxjs machinery is done
    expect(result).toEqual(outerMessages)
    subscription.unsubscribe()
  })
})

describe('PubsubIncoming', () => {
  test('subscribe and unsubscribe', async () => {
    const fauxIpfs = {
      id: jest.fn(async () => ({ id: 'peer-id' })),
      pubsub: {
        subscribe: jest.fn(async () => void {}),
        unsubscribe: jest.fn(async () => void {}),
      },
    }
    const incoming$ = new PubsubIncoming(fauxIpfs as unknown as IpfsApi, TOPIC, pubsubLogger)
    const subscription = incoming$.subscribe()
    await delay(200) // Wait till rxjs machinery is done
    expect(fauxIpfs.pubsub.subscribe).toBeCalledTimes(1)
    expect(fauxIpfs.pubsub.unsubscribe).toBeCalledTimes(0)
    subscription.unsubscribe()
    await delay(200) // Wait till rxjs machinery is done
    expect(fauxIpfs.pubsub.subscribe).toBeCalledTimes(1)
    expect(fauxIpfs.pubsub.unsubscribe).toBeCalledTimes(1)
  })

  test('when error during subscribe', async () => {
    const error = new Error(`During Subscription`)
    const fauxIpfs = {
      id: jest.fn(async () => ({ id: 'peer-id' })),
      pubsub: {
        subscribe: jest.fn(async () => {
          throw error
        }),
        unsubscribe: jest.fn(async () => void {}),
      },
    }
    const incoming$ = new PubsubIncoming(fauxIpfs as unknown as IpfsApi, TOPIC, pubsubLogger)
    await expect(firstValueFrom(incoming$)).rejects.toEqual(error)
  })

  test('when error during usual work', async () => {
    const error = new Error(`During Subscription`)
    const fauxIpfs = {
      id: jest.fn(async () => ({ id: 'peer-id' })),
      pubsub: {
        subscribe: jest.fn(async () => void {}),
        unsubscribe: jest.fn(async () => void {}),
      },
    }
    const incoming$ = new PubsubIncoming(fauxIpfs as unknown as IpfsApi, TOPIC, pubsubLogger)
    const lastValue = lastValueFrom(incoming$)
    await delay(200) // Wait till rxjs machinery is done
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    fauxIpfs.pubsub.subscribe.mock.calls[0][2].onError(error)
    await expect(lastValue).rejects.toEqual(error)
  })
})
