import { PubsubMessage, serialize } from '../pubsub-message';
import * as uint8arrays from 'uint8arrays';
import { IPFSPubsubMessage } from '../pubsub-incoming';
import * as random from '@stablelib/random';

export function asIpfsMessage(data: PubsubMessage): IPFSPubsubMessage {
  const asBytes = uint8arrays.fromString(serialize(data));
  return {
    from: 'outer-space',
    data: asBytes,
    topicIDs: ['topic'],
    seqno: random.randomBytes(10),
  };
}
