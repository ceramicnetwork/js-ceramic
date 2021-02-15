import CID from 'cids';
import multibase from 'multibase';
import * as doctypes from './doctypes';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { DEFAULT_BASE, DOCID_CODEC } from './constants';
import { readCid, readVarint } from './reading-bytes';
import { DocID } from './doc-id';

/**
 * Parse CommitID from bytes representation.
 *
 * @param bytes - bytes representation of CommitID.
 * @see [[CommitID#bytes]]
 */
function fromBytes(bytes: Uint8Array): CommitID {
  const [docCodec, docCodecRemainder] = readVarint(bytes);
  if (docCodec !== DOCID_CODEC) throw new Error('fromBytes: invalid docid, does not include docid codec');
  const [doctype, doctypeRemainder] = readVarint(docCodecRemainder);
  const [base, baseRemainder] = readCid(doctypeRemainder);
  if (baseRemainder.length === 0) {
    // No commit AKA DocID
    return new CommitID(doctype, base);
  } else if (baseRemainder.length === 1) {
    // Zero commit
    return new CommitID(doctype, base, baseRemainder[0]);
  } else {
    // Commit
    const [commit] = readCid(baseRemainder);
    return new CommitID(doctype, base, commit);
  }
}

/**
 * Safely parse CID, be it CID instance or a string representation.
 * Return `undefined` if not CID.
 *
 * @param input - CID or string.
 */
function parseCID(input: any): CID | undefined {
  try {
    return new CID(input);
  } catch {
    return undefined;
  }
}

/**
 * Parse commit CID from string or number.
 * `null` result indicates genesis commit.
 * If `commit` is 0, `'0'`, `null` or is equal to `genesis` CID, result is `null`.
 * Otherwise, return commit as proper CID.
 *
 * @param genesis - genesis CID for document
 * @param commit - representation of commit, be it CID, 0, `'0'`, `null`
 */
function parseCommit(genesis: CID, commit: CID | string | number = null): CID | null {
  if (!commit) return null;

  const commitCID = parseCID(commit);
  if (commitCID) {
    // CID-like
    if (genesis.equals(commitCID)) {
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

/**
 * Parse CommitID from string representation.
 *
 * @param input - string representation of CommitID, be it base36-encoded string or URL.
 * @see [[CommitID#toString]]
 * @see [[CommitID#toUrl]]
 */
function fromString(input: string): CommitID {
  const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '');
  if (protocolFree.includes('commit')) {
    const commit = protocolFree.split('?')[1].split('=')[1];
    const base = protocolFree.split('?')[0];
    return fromBytes(multibase.decode(base)).travel(commit);
  } else {
    return fromBytes(multibase.decode(protocolFree));
  }
}

/**
 * Commit identifier, includes doctype, genesis CID, commit CID.
 * Encoded as '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><commit-cid-bytes>'
 */
export class CommitID {
  readonly #doctype: number;
  readonly #cid: CID;
  readonly #commit: CID | null; // null ≝ genesis commit
  private _bytes: Uint8Array;

  static fromBytes = fromBytes;
  static fromString = fromString;

  /**
   * Create a new DocID.
   *
   * @param {string|number}      doctype
   * @param {CID|string}         cid
   * @param {CID|string}         commit CID. Pass '0', 0, or omit the value as shorthand for the genesis commit.
   *
   * @example
   * new DocID(<docType>, <CID>|<cidStr>)
   * new DocID(<docType>, <CID>|<cidStr>, <CommitCID>|<CommitCidStr>)
   */
  constructor(doctype: string | number, cid: CID | string, commit: CID | string | number = null) {
    if (!doctype && doctype !== 0) throw new Error('constructor: doctype required');
    if (!cid) throw new Error('constructor: cid required');
    this.#doctype = typeof doctype === 'string' ? doctypes.indexByName(doctype) : doctype;
    this.#cid = typeof cid === 'string' ? new CID(cid) : cid;
    this.#commit = parseCommit(this.#cid, commit);
  }

  /**
   * Construct DocID, no commit information included
   */
  get baseID(): DocID {
    return new DocID(this.#doctype, this.#cid);
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
  get typeName(): string {
    return doctypes.nameByIndex(this.#doctype);
  }

  /**
   * Genesis CID
   */
  get cid(): CID {
    return this.#cid;
  }

  /**
   * Commit CID
   */
  get commit(): CID {
    return this.#commit || this.#cid;
  }

  /**
   * Bytes representation
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

  /**
   * Construct new CommitID for the same document, but a new `commit` CID.
   */
  travel(commit: CID | string | number): CommitID {
    return new CommitID(this.#doctype, this.#cid, commit);
  }

  /**
   * Compare equality with another CommitID.
   */
  equals(other: CommitID): boolean {
    return this.type === other.type && this.cid.equals(other.cid) && this.commit.equals(other.commit);
  }

  /**
   * Encode the CommitID into a string.
   */
  toString(): string {
    return uint8ArrayToString(multibase.encode(DEFAULT_BASE, this.bytes));
  }

  /**
   * Encode the DocID into a base36 url
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

  /**
   * String representation of CommitID.
   */
  [Symbol.toPrimitive](): string | Uint8Array {
    return this.toString();
  }
}
