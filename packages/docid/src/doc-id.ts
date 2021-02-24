import CID from 'cids';
import multibase from 'multibase';
import * as doctypes from './doctypes';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { DEFAULT_BASE, DOCID_CODEC } from './constants';
import { readCid, readVarint } from './reading-bytes';
import { Memoize } from 'typescript-memoize';
import { CommitID } from './commit-id';
import { DocRef } from './doc-ref';

/**
 * Parse DocID from bytes representation.
 *
 * @param bytes - bytes representation of DocID.
 * @see [[DocID#bytes]]
 */
function fromBytes(bytes: Uint8Array): DocID {
  const [docCodec, docCodecRemainder] = readVarint(bytes);
  if (docCodec !== DOCID_CODEC) throw new Error('fromBytes: invalid docid, does not include docid codec');
  const [docType, docTypeRemainder] = readVarint(docCodecRemainder);
  const [cid, cidRemainder] = readCid(docTypeRemainder);
  if (cidRemainder.length > 0) {
    throw new Error(`Invalid DocID: contains commit`);
  }
  return new DocID(docType, cid);
}

/**
 * Parse DocID from string representation.
 *
 * @param input - string representation of DocID, be it base36-encoded string or URL.
 * @see [[DocID#toString]]
 * @see [[DocID#toUrl]]
 */
function fromString(input: string): DocID {
  const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '');
  const commitFree = protocolFree.includes('commit') ? protocolFree.split('?')[0] : protocolFree;
  const bytes = multibase.decode(commitFree);
  return fromBytes(bytes);
}

const TAG = Symbol.for('@ceramicnetwork/docid/DocID');

/**
 * Document identifier, no commit information included.
 * Encoded as '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes>'
 */
export class DocID implements DocRef {
  protected readonly _tag = TAG;

  readonly #doctype: number;
  readonly #cid: CID;

  static fromBytes = fromBytes;
  static fromString = fromString;

  static [Symbol.hasInstance](instance: any): boolean {
    return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG;
  }

  /**
   * Create a new DocID.
   *
   * @param {string|number}      doctype
   * @param {CID|string}         cid
   *
   * @example
   * ```typescript
   * new DocID('tile', 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a');
   * new DocID('tile', cid);
   * new DocID(0, cid);
   * ```
   */
  constructor(doctype: string | number, cid: CID | string) {
    if (!(doctype || doctype === 0)) throw new Error('constructor: doctype required');
    if (!cid) throw new Error('constructor: cid required');
    this.#doctype = typeof doctype === 'string' ? doctypes.indexByName(doctype) : doctype;
    this.#cid = typeof cid === 'string' ? new CID(cid) : cid;
  }

  /**
   * Doc type code
   */
  get type(): number {
    return this.#doctype;
  }

  /**
   * Doc type name
   */
  @Memoize()
  get typeName(): string {
    return doctypes.nameByIndex(this.#doctype);
  }

  /**
   * Genesis record CID
   */
  get cid(): CID {
    return this.#cid;
  }

  /**
   * Bytes representation of DocID.
   */
  @Memoize()
  get bytes(): Uint8Array {
    const codec = varint.encode(DOCID_CODEC);
    const doctype = varint.encode(this.type);

    return uint8ArrayConcat([codec, doctype, this.cid.bytes]);
  }

  /**
   * Copy of self. Exists to maintain compatibility with CommitID.
   * @readonly
   */
  @Memoize()
  get baseID(): DocID {
    return new DocID(this.#doctype, this.#cid);
  }

  /**
   * Construct new CommitID for the same document, but a new `commit` CID.
   */
  atCommit(commit: CID | string | number): CommitID {
    return new CommitID(this.#doctype, this.#cid, commit);
  }

  /**
   * Compare equality with another DocID.
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
  @Memoize()
  toString(): string {
    return uint8ArrayToString(multibase.encode(DEFAULT_BASE, this.bytes));
  }

  /**
   * Encode the DocID into a base36 url.
   */
  @Memoize()
  toUrl(): string {
    return `ceramic://${this.toString()}`;
  }

  /**
   * DocId(k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws)
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `DocID(${this.toString()})`;
  }

  /**
   * String representation of DocID.
   */
  [Symbol.toPrimitive](): string {
    return this.toString();
  }
}
