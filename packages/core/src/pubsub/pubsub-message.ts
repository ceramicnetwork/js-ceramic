import { StreamID } from '@ceramicnetwork/streamid'
import { CID } from 'multiformats/cid'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import * as dagCBOR from '@ipld/dag-cbor'
import { create as createDigest } from 'multiformats/hashes/digest'
import * as sha256 from '@stablelib/sha256'
import * as uint8arrays from 'uint8arrays'
import { cidAsString, streamIdAsString } from '@ceramicnetwork/codecs'
import * as co from 'codeco'

class CIDAsStringMap extends co.Codec<Map<string, CID>, Record<string, string>> {
  constructor() {
    super('CIDAsStringMap')
  }
  is(input): input is Map<string, CID> {
    return input instanceof Map
  }
  encode(value: Map<string, CID>): Record<string, string> {
    const encoded: Record<string, string> = {}
    for (const [key, val] of value.entries()) {
      encoded[key] = cidAsString.encode(val)
    }
    return encoded
  }
  decode(input: unknown, context: co.Context): co.Validation<Map<string, CID>> {
    try {
      const decoded = new Map<string, CID>()
      for (const [key, val] of Object.entries(input)) {
        const valValidation = cidAsString.decode(val, context)
        if (co.isValid(valValidation)) {
          decoded.set(key, valValidation.right)
        } else {
          return valValidation
        }
      }
      return context.success(decoded)
    } catch (err) {
      return context.failure(err.message)
    }
  }
}
const cidAsStringMap = new CIDAsStringMap()

/**
 * Ceramic Pub/Sub message type.
 */
export enum MsgType {
  UPDATE,
  QUERY,
  RESPONSE,
  KEEPALIVE,
}

export const UpdateMessage = co.sparse(
  {
    typ: co.literal(MsgType.UPDATE),
    stream: streamIdAsString,
    tip: cidAsString,
    model: co.optional(streamIdAsString),
  },
  'UpdateMessage'
)
export type UpdateMessage = co.TypeOf<typeof UpdateMessage>

export const QueryMessage = co.strict(
  {
    typ: co.literal(MsgType.QUERY),
    id: co.string,
    stream: streamIdAsString,
  },
  'QueryMessage'
)
export type QueryMessage = co.TypeOf<typeof QueryMessage>

export const ResponseMessage = co.strict(
  {
    typ: co.literal(MsgType.RESPONSE),
    id: co.string,
    tips: cidAsStringMap,
  },
  'ResponseMessage'
)
export type ResponseMessage = co.TypeOf<typeof ResponseMessage>

// All nodes will always ignore this message
export const KeepaliveMessage = co.strict(
  {
    typ: co.literal(MsgType.KEEPALIVE),
    ts: co.number, // current time
    ver: co.string, // current ceramic version
  },
  'KeepaliveMessage'
)
export type KeepaliveMessage = co.TypeOf<typeof KeepaliveMessage>

export const PubsubMessage = co.union(
  [UpdateMessage, QueryMessage, ResponseMessage, KeepaliveMessage],
  'PubsubMessage'
)
export type PubsubMessage = co.TypeOf<typeof PubsubMessage>

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder('utf-8')

const PUBSUB_PUBLISHED = 'pubsub_published'
const PUBSUB_RECEIVED = 'pubsub_received'

function messageHash(message: any): string {
  // DAG-CBOR encoding
  const encoded = dagCBOR.encode(message)

  // SHA-256 hash
  const id = sha256.hash(encoded)

  // Multihash encoding
  return uint8arrays.toString(createDigest(0x12, id).bytes, 'base64url')
}

export function buildQueryMessage(streamId: StreamID): QueryMessage {
  const payload = {
    typ: MsgType.QUERY as MsgType.QUERY,
    stream: streamId,
  }
  const id = messageHash({ ...payload, stream: streamId.toString() })
  return {
    ...payload,
    id: id,
  }
}

export function serialize(message: PubsubMessage): Uint8Array {
  Metrics.count(PUBSUB_PUBLISHED, 1, { typ: message.typ }) // really attempted to publish...
  const payload = PubsubMessage.encode(message)
  return textEncoder.encode(JSON.stringify(payload))
}

export function deserialize(message: any): PubsubMessage {
  const asString = textDecoder.decode(message.data)
  const parsed = JSON.parse(asString)
  Metrics.count(PUBSUB_RECEIVED, 1, { typ: parsed.typ })
  return co.decode(PubsubMessage, parsed) as PubsubMessage
}
