import { PubsubMessage, serialize } from '../pubsub-message'
import { IPFSPubsubMessage } from '../incoming-channel'
import * as random from '@stablelib/random'

/**
 * PubsubMessage as raw IPFS pubsub message.
 *
 * @param data - PubsubMessage to transform into raw form.
 * @param from - Peer ID that ostensibly sent the message.
 */
export function asIpfsMessage(data: PubsubMessage, from?: string): IPFSPubsubMessage {
  return {
    from: from || 'outer-space',
    data: serialize(data),
    topicIDs: ['topic'],
    seqno: random.randomBytes(10),
    signature: random.randomBytes(10),
    key: random.randomBytes(10),
  }
}
