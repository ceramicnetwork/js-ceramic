import CID from 'cids';
import multibase from 'multibase';
import doctypes from './doctype-table';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { DEFAULT_BASE, DOCID_CODEC } from './constants';

const getKey = (obj: { [key: string]: number }, value: number): string | undefined => {
  for (const [k, v] of Object.entries(obj)) {
    if (v === value) return k;
  }
};

// Definition
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes>'
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><commit-cid-bytes>'

export class DocID {
  /**
   * Create a new DocID.
   *
   * @param {string|number}      doctype
   * @param {CID|string}         cid
   * @param {CID|string}         commit CID. Pass '0' as shorthand for the genesis commit.
   * @param {string}             [multibaseName = 'base36']
   *
   * @example
   * new DocID(<docType>, <CID>|<cidStr>)
   * new DocID(<docType>, <CID>|<cidStr>, <CommitCID>|<CommitCidStr>, <multibaseName>)
   */

  readonly #doctype: number;
  readonly #cid: CID;
  private _bytes: Uint8Array;

  constructor(doctype: string | number, cid: CID | string) {
    if (!cid) throw new Error('constructor: cid required');
    this.#doctype = typeof doctype === 'string' ? doctypes[doctype] : doctype;
    if (!this.#doctype && this.#doctype !== 0) throw new Error('constructor: doctype required');
    this.#cid = typeof cid === 'string' ? new CID(cid) : cid;
  }

  /**
   * Copies the given DocID and returns a copy of it, optionally changing the commit to the one provided
   * @param other
   */
  static fromOther(other: DocID): DocID {
    return new DocID(other.type, other.cid);
  }

  static fromBytes(bytes: Uint8Array): DocID {
    const docCodec = varint.decode(bytes);
    if (docCodec !== DOCID_CODEC) throw new Error('fromBytes: invalid docid, does not include docid codec');
    bytes = bytes.slice(varint.decode.bytes);
    const docType = varint.decode(bytes);
    bytes = bytes.slice(varint.decode.bytes);

    let cid;

    try {
      cid = new CID(bytes);
    } catch (e) {
      // Includes commit
      const cidLength = DocID._genesisCIDLength(bytes);
      cid = new CID(bytes.slice(0, cidLength));
    }

    return new DocID(docType, cid);
  }

  static _genesisCIDLength(bytes: Uint8Array): number {
    let offset = 0;

    varint.decode(bytes); // cid version
    offset += varint.decode.bytes;

    varint.decode(bytes.slice(offset)); // cid codec
    offset += varint.decode.bytes;

    varint.decode(bytes.slice(offset)); //mh codec
    offset += varint.decode.bytes;

    const length = varint.decode(bytes.slice(offset)); //mh length
    return offset + length + 1;
  }

  static fromString(docId: string): DocID {
    docId = docId.split('ceramic://').pop();
    // Likely temp, remove legacy once all ceramic update, but should make updating easier
    docId = docId.split('/ceramic/').pop();
    if (docId.includes('commit')) {
      docId = docId.split('?')[0];
    }
    const bytes = multibase.decode(docId);
    return DocID.fromBytes(bytes);
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
    const name = getKey(doctypes, this.#doctype);
    if (!name) throw new Error('docTypeName: no registered name available');
    return name;
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
  get bytes(): Uint8Array {
    if (this._bytes == null) {
      const codec = varint.encode(DOCID_CODEC);
      const doctype = varint.encode(this.type);

      this._bytes = uint8ArrayConcat([codec, doctype, this.cid.bytes]);
    }
    return this._bytes;
  }

  /**
   * Compare equality with another DocID.
   *
   * @param   {DocID}   other
   * @returns {bool}
   */
  equals(other: DocID | Uint8Array | string): boolean {
    let otherDocID;
    if (typeof other === 'string') otherDocID = DocID.fromString(other);
    else if (other instanceof Uint8Array) {
      otherDocID = DocID.fromBytes(other);
    } else {
      otherDocID = other;
    }

    return this.type === otherDocID.type && this.cid.equals(otherDocID.cid);
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

  [Symbol.toPrimitive](): string | Uint8Array {
    return this.toString();
  }

  /**
   * Determine if given DocID, DocID string or bytes is a valid DocID
   *
   * @param   {any}     other
   * @returns {Boolean}
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static isDocID(other: any): boolean {
    try {
      if (typeof other === 'string') {
        DocID.fromString(other);
        return true;
      } else if (other instanceof Uint8Array) {
        DocID.fromBytes(other);
        return true;
      } else {
        return (other.type || other.type === 0) && Boolean(other.cid);
      }
    } catch (e) {
      return false;
    }
  }
}
