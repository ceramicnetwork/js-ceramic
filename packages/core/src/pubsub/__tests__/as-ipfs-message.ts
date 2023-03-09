import { PubsubMessage, serialize } from '../pubsub-message.js'
import type { SignedMessage } from '@libp2p/interface-pubsub'
import type { PeerId } from '@libp2p/interface-peer-id'
import * as random from '@stablelib/random'
import { TestUtils } from '@ceramicnetwork/common'
import { peerIdFromCID } from '@libp2p/peer-id'

/**
 * Generate random PeerId.
 */
export function randomPeerId(): PeerId {
  return peerIdFromCID(TestUtils.randomCID(0, 0x70))
}

/**
 * PubsubMessage as raw IPFS pubsub message.
 *
 * @param data - PubsubMessage to transform into raw form.
 * @param from - Peer ID that ostensibly sent the message.
 */
export function asIpfsMessage(data: PubsubMessage, from: PeerId = randomPeerId()): SignedMessage {
  return {
    type: 'signed',
    from: from,
    topic: 'topic',
    data: serialize(data),
    sequenceNumber: BigInt(random.randomUint32()),
    signature: random.randomBytes(10),
    key: random.randomBytes(10),
  }
}
