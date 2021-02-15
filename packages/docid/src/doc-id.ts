import CID from 'cids';
import multibase from 'multibase';
import * as doctypes from './doctypes';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { DEFAULT_BASE, DOCID_CODEC } from './constants';
import { readCid, readVarint } from './reading-bytes';
import { Memoize } from 'typescript-memoize';

function fromOther(other: DocID): DocID {
  return new DocID(other.type, other.cid);
}

function fromBytes(bytes: Uint8Array): DocID {
  const [docCodec, docCodecRemainder] = readVarint(bytes);
  if (docCodec !== DOCID_CODEC) throw new Error('fromBytes: invalid docid, does not include docid codec');
  const [docType, docTypeRemainder] = readVarint(docCodecRemainder);
  const [cid] = readCid(docTypeRemainder);
  return new DocID(docType, cid);
}

function fromString(input: string): DocID {
  const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '');
  const commitFree = protocolFree.includes('commit') ? protocolFree.split('?')[0] : protocolFree;
  const bytes = multibase.decode(commitFree);
  return fromBytes(bytes);
}

// Definition
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes>'
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><commit-cid-bytes>'

export class DocID {
  readonly #doctype: number;
  readonly #cid: CID;

  /**
   * Copies the given DocID and returns a copy of it, optionally changing the commit to the one provided
   * @param other
   */
  static fromOther = fromOther;
  static fromBytes = fromBytes;
  static fromString = fromString;

  /**
   * Create a new DocID.
   *
   * @param {string|number}      doctype
   * @param {CID|string}         cid
   *
   * @example
   * new DocID(<docType>, <CID>|<cidStr>)
   */
  constructor(doctype: string | number, cid: CID | string) {
    if (!(doctype || doctype === 0)) throw new Error('constructor: doctype required');
    if (!cid) throw new Error('constructor: cid required');
    this.#doctype = typeof doctype === 'string' ? doctypes.indexByName(doctype) : doctype;
    this.#cid = typeof cid === 'string' ? new CID(cid) : cid;
  }

  /**
   * Get doc type code
   *
   * @returns {number}
   * @readonly
   */
  get type(): number {
    return this.#doctype;
  }

  /**
   * Get doc type name
   *
   * @returns {string}
   * @readonly
   */
  get typeName(): string {
    return doctypes.nameByIndex(this.#doctype);
  }

  /**
   * Get CID
   *
   * @returns {CID}
   * @readonly
   */
  get cid(): CID {
    return this.#cid;
  }

  /**
   * Get CID codec name string
   *
   * @returns {string}
   * @readonly
   */
  get codec(): string {
    return this.#cid.codec;
  }

  /**
   * Get bytes of DocId
   *
   * @returns {Uint8Array}
   * @readonly
   */
  @Memoize()
  get bytes(): Uint8Array {
    const codec = varint.encode(DOCID_CODEC);
    const doctype = varint.encode(this.type);

    return uint8ArrayConcat([codec, doctype, this.cid.bytes]);
  }

  /**
   * Compare equality with another DocID.
   *
   * @param   {DocID}   other
   */
  equals(other: DocID): boolean {
    if (other instanceof DocID) {
      return this.type === other.type && this.cid.equals(other.cid);
    } else {
      return false;
    }
  }

  /**
   * Encode the DocID into a string.
   */
  toString(): string {
    return uint8ArrayToString(multibase.encode(DEFAULT_BASE, this.bytes));
  }

  /**
   * Encode the DocID into a base36 url
   *
   * @returns {string}
   */
  toUrl(): string {
    return `ceramic://${this.toString()}`;
  }

  /**
   * DocId(k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws)
   *
   * @returns {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `DocID(${this.toString()})`;
  }

  [Symbol.toPrimitive](): string {
    return this.toString();
  }
}
