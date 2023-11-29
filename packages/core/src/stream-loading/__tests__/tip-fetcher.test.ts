import { jest } from '@jest/globals'
import { Dispatcher } from '../../dispatcher.js'
import { createIPFS, swarmConnect } from '@ceramicnetwork/ipfs-daemon'
import { createDispatcher } from '../../__tests__/create-dispatcher.js'
import { IpfsApi, TestUtils } from '@ceramicnetwork/common'
import { deserialize, MsgType, PubsubMessage, serialize } from '../../pubsub/pubsub-message.js'
import type { SignedMessage } from '@libp2p/interface-pubsub'
import { TipFetcher } from '../tip-fetcher.js'
import { lastValueFrom } from 'rxjs'

const TOPIC = '/ceramic/test12345'

describe('TipFetcher test', () => {
  jest.setTimeout(1000 * 30)

  let dispatcher: Dispatcher
  let ipfsClient: IpfsApi

  beforeAll(async () => {
    ipfsClient = await createIPFS()

    dispatcher = await createDispatcher(ipfsClient, TOPIC)
  })

  afterAll(async () => {
    await dispatcher.close()
    // Wait for pubsub unsubscribe to be processed
    // TODO(1963): Remove this once dispatcher.close() won't resolve until the pubsub unsubscribe
    // has been processed
    await TestUtils.delay(5000)

    await ipfsClient.stop()
  })

  test('basic tip fetch', async () => {
    const streamID = TestUtils.randomStreamID()
    const tip = TestUtils.randomCID()

    const ipfs2 = await createIPFS()
    await swarmConnect(ipfsClient, ipfs2)

    await ipfs2.pubsub.subscribe(TOPIC, (rawMessage: SignedMessage) => {
      const message = deserialize(rawMessage)
      if (message.typ == MsgType.QUERY && message.stream.equals(streamID)) {
        const tipMap = new Map().set(streamID.toString(), tip)
        const response: PubsubMessage = { typ: MsgType.RESPONSE, id: message.id, tips: tipMap }
        ipfs2.pubsub.publish(TOPIC, serialize(response)).catch((error) => {
          // we want the test to fail if an error occurs thus we are rethrowing the error
          throw error
        })
      }
    })

    // Wait for peers to discover they are mutually interested in the same topic.
    await TestUtils.delay(500)

    const tipFetcher = new TipFetcher(dispatcher.messageBus)

    const foundTip = await lastValueFrom(tipFetcher.findPossibleTips(streamID, 5))
    expect(foundTip.toString()).toEqual(tip.toString())

    await ipfs2.stop()
  })

  test('no response timeout', async () => {
    const streamID = TestUtils.randomStreamID()

    const tipFetcher = new TipFetcher(dispatcher.messageBus)

    const foundTip = await lastValueFrom(tipFetcher.findPossibleTips(streamID, 1), {
      defaultValue: null,
    })
    expect(foundTip).toEqual(null)
  })
})
