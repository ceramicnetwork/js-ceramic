import CID from 'cids';
import multibase from 'multibase';
import * as doctypes from './doctypes';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { DEFAULT_BASE, DOCID_CODEC } from './constants';
import { readCid, readVarint } from './reading-bytes';
import { DocID } from './doc-id';

// Definition
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes>'
// '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><commit-cid-bytes>'

function fromOther(other: CommitId): CommitId {
  return new CommitId(other.type, other.cid, other.commit);
}

function fromBytes(bytes: Uint8Array): CommitId {
  const [docCodec, docCodecRemainder] = readVarint(bytes);
  if (docCodec !== DOCID_CODEC) throw new Error('fromBytes: invalid docid, does not include docid codec');
  const [doctype, doctypeRemainder] = readVarint(docCodecRemainder);
  const [base, baseRemainder] = readCid(doctypeRemainder);
  if (baseRemainder.length === 0) {
    // No commit AKA DocID
    return new CommitId(doctype, base);
  } else if (baseRemainder.length === 1) {
    // Zero commit
    return new CommitId(doctype, base, baseRemainder[0]);
  } else {
    // Commit
    const [commit] = readCid(baseRemainder);
    return new CommitId(doctype, base, commit);
  }
}

function parseCID(input: any) {
  try {
    return new CID(input);
  } catch {
    return undefined;
  }
}

function parseCommit(base: CID, commit: CID | string | number = null): CID | null {
  if (!commit) return null;

  const commitCID = parseCID(commit);
  if (commitCID) {
    // CID-like
    if (base.equals(commitCID)) {
      return null;
    } else {
      return commitCID;
    }
  } else if (String(commit) === '0') {
    // Zero as number or string
    return null;
  } else {
    throw new Error('Cannot specify commit as a number except to request commit 0 (the genesis commit)');
  }
}

function fromString(input: string): CommitId {
  const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '');
  if (protocolFree.includes('commit')) {
    const commit = protocolFree.split('?')[1].split('=')[1];
    const base = protocolFree.split('?')[0];
    return fromBytes(multibase.decode(base)).travel(commit);
  } else {
    return fromBytes(multibase.decode(protocolFree));
  }
}

export class CommitId {
  readonly #doctype: number;
  readonly #cid: CID;
  readonly #commit: CID | null;
  private _bytes: Uint8Array;

  /**
   * Copies the given DocID and returns a copy of it, optionally changing the commit to the one provided
   * @param other
   * @param commit
   */
  static fromOther = fromOther;
  static fromBytes = fromBytes;
  static fromString = fromString;

  /**
   * Create a new DocID.
   *
   * @param {string|number}      doctype
   * @param {CID|string}         cid
   * @param {CID|string}         commit CID. Pass '0' as shorthand for the genesis commit.
   *
   * @example
   * new DocID(<docType>, <CID>|<cidStr>)
   * new DocID(<docType>, <CID>|<cidStr>, <CommitCID>|<CommitCidStr>, <multibaseName>)
   */
  constructor(doctype: string | number, cid: CID | string, commit: CID | string | number = null) {
    if (!doctype && doctype !== 0) throw new Error('constructor: doctype required');
    if (!cid) throw new Error('constructor: cid required');
    this.#doctype = typeof doctype === 'string' ? doctypes.indexByName(doctype) : doctype;
    this.#cid = typeof cid === 'string' ? new CID(cid) : cid;
    this.#commit = parseCommit(this.#cid, commit);
  }

  /**
   * Get base docID, always returns without commit
   *
   * @returns {DocID}
   * @readonly
   */
  get baseID(): DocID {
    return new DocID(this.#doctype, this.#cid);
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
   * Get Commit CID
   *
   * @returns {CID}
   * @readonly
   */
  get commit(): CID {
    return this.#commit || this.#cid;
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

      const commitBytes = this.#commit?.bytes || new Uint8Array(0);
      this._bytes = uint8ArrayConcat([codec, doctype, this.cid.bytes, commitBytes]);
    }
    return this._bytes;
  }

  travel(commit: CID | string | number): CommitId {
    return new CommitId(this.#doctype, this.#cid, commit);
  }

  /**
   * Compare equality with another DocID.
   *
   * @param   {DocID}   other
   */
  equals(other: CommitId): boolean {
    return this.type === other.type && this.cid.equals(other.cid) && this.commit.equals(other.commit);
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
   * If genesis commit:
   * CommitID(k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws, 0)
   *
   * If commit:
   * CommitID(k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws, bagjqcgzaday6dzalvmy5ady2m5a5legq5zrbsnlxfc2bfxej532ds7htpova)
   *
   * @returns {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    if (this.#commit) {
      return `CommitID(${this.#cid.toString()}, ${this.#commit.toString()})`;
    } else {
      return `CommitID(${this.#cid.toString()}, 0)`;
    }
  }

  [Symbol.toPrimitive](): string | Uint8Array {
    return this.toString();
  }
}
