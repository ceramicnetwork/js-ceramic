import DocID from '@ceramicnetwork/docid';
import CID from 'cids';
import { UnreachableCaseError } from '@ceramicnetwork/common';
import dagCBOR from 'ipld-dag-cbor';
import * as multihashes from 'multihashes';
import * as sha256 from '@stablelib/sha256';
import { TextDecoder } from 'util';
import { ServiceLogger } from '@ceramicnetwork/logger';
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
  doc: DocID;
  tip: CID;
};

export type QueryMessage = {
  typ: MsgType.QUERY;
  id: string;
  doc: DocID;
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

export function buildQueryMessage(docId: DocID): QueryMessage {
  const payload = {
    typ: MsgType.QUERY as MsgType.QUERY,
    doc: docId,
  };
  const id = messageHash(payload);
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
        doc: message.doc.toString(),
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
      const payload = { typ: MsgType.UPDATE, doc: message.doc.toString(), tip: message.tip.toString() };
      return JSON.stringify(payload);
    }
    default:
      throw new UnreachableCaseError(message, 'Unknown message type');
  }
}

export function deserialize(message: any, pubsubLogger: ServiceLogger, peerId: string, topic: string): PubsubMessage {
  const asString = new TextDecoder('utf-8').decode(message.data);
  const parsed = JSON.parse(asString);

  // TODO: handle signature and key buffers in message data
  // TODO: Logger does not belong here
  const logMessage = { ...message, data: parsed };
  delete logMessage.key;
  delete logMessage.signature;
  pubsubLogger.log({ peer: peerId, event: 'received', topic: topic, message: logMessage });

  const typ = parsed.typ as MsgType;
  switch (typ) {
    case MsgType.UPDATE: {
      return {
        typ: MsgType.UPDATE,
        doc: DocID.fromString(parsed.doc),
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
    case MsgType.QUERY:
      return {
        typ: MsgType.QUERY,
        id: parsed.id,
        doc: DocID.fromString(parsed.doc),
      };
    default:
      throw new UnreachableCaseError(typ, 'Unknown message type');
  }
}
