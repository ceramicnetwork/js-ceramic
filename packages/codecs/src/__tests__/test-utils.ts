import { randomBytes } from 'node:crypto'
import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { create } from 'multiformats/hashes/digest'

/**
 * Create random DAG-CBOR CID.
 */
export function randomCID(): CID {
  // 113 is DAG-CBOR codec identifier
  return CID.create(1, 113, create(0x12, new Uint8Array(randomBytes(32))))
}

/**
 * Create random StreamID.
 *
 * @param type - type of StreamID, "tile" by default.
 */
export function randomStreamID(type: string | number = 'tile'): StreamID {
  return new StreamID(type, randomCID())
}
