import StreamID from '@ceramicnetwork/streamid';
import CID from 'cids';
import { UnreachableCaseError } from '@ceramicnetwork/common';
import dagCBOR from 'ipld-dag-cbor';
import * as multihashes from 'multihashes';
import * as sha256 from '@stablelib/sha256';
import { TextDecoder } from 'util';
import * as uint8arrays from 'uint8arrays';

/**
 * Ceramic Pub/Sub message type.
 */
export enum MsgType {
  UPDATE,
  QUERY,
  RESPONSE,
}

export type UpdateMessage = {
  typ: MsgType.UPDATE;
  stream: StreamID;
  tip: CID;
};

export type QueryMessage = {
  typ: MsgType.QUERY;
  id: string;
  stream: StreamID;
};

export type ResponseMessage = {
  typ: MsgType.RESPONSE;
  id: string;
  tips: Map<string, CID>;
};

export type PubsubMessage = UpdateMessage | QueryMessage | ResponseMessage;

function messageHash(message: any): string {
  // DAG-CBOR encoding
  const encoded = dagCBOR.util.serialize(message);

  // SHA-256 hash
  const id = sha256.hash(encoded);

  // Multihash encoding
  return uint8arrays.toString(multihashes.encode(id, 'sha2-256'), 'base64url');
}

export function buildQueryMessage(streamId: StreamID): QueryMessage {
  const payload = {
    typ: MsgType.QUERY as MsgType.QUERY,
    stream: streamId,
  };
  const id = messageHash({...payload, stream: streamId.toString()});
  return {
    ...payload,
    id: id,
  };
}

export function serialize(message: PubsubMessage): string {
  switch (message.typ) {
    case MsgType.QUERY: {
      return JSON.stringify({
        ...message,
        doc: message.stream.toString(), // todo remove once we no longer support interop with nodes older than v1.0.0
        stream: message.stream.toString(),
      });
    }
    case MsgType.RESPONSE: {
      const tips = {};
      message.tips.forEach((value, key) => (tips[key] = value.toString()));
      const payload = {
        ...message,
        tips: tips,
      };
      return JSON.stringify(payload);
    }
    case MsgType.UPDATE: {
      // todo remove 'doc' once we no longer support interop with nodes older than v1.0.0
      const payload = { typ: MsgType.UPDATE, doc: message.stream.toString(), stream: message.stream.toString(), tip: message.tip.toString() };
      return JSON.stringify(payload);
    }
    default:
      throw new UnreachableCaseError(message, 'Unknown message type');
  }
}

export function deserialize(message: any): PubsubMessage {
  const asString = new TextDecoder('utf-8').decode(message.data);
  const parsed = JSON.parse(asString);

  const typ = parsed.typ as MsgType;
  switch (typ) {
    case MsgType.UPDATE: {
      // TODO don't take streamid from 'doc' once we no longer interop with nodes older than v1.0.0
      const stream = StreamID.fromString(parsed.stream || parsed.doc)
      return {
        typ: MsgType.UPDATE,
        stream,
        tip: new CID(parsed.tip),
      };
    }
    case MsgType.RESPONSE: {
      const tips: Map<string, CID> = new Map();
      Object.entries<string>(parsed.tips).forEach(([key, value]) => tips.set(key, new CID(value)));
      return {
        typ: MsgType.RESPONSE,
        id: parsed.id,
        tips: tips,
      };
    }
    case MsgType.QUERY: {
      // TODO don't take streamid from 'doc' once we no longer interop with nodes older than v1.0.0
      const stream = StreamID.fromString(parsed.stream || parsed.doc)
      return {
        typ: MsgType.QUERY,
        id: parsed.id,
        stream,
      };
    }
    default:
      throw new UnreachableCaseError(typ, 'Unknown message type');
  }
}
