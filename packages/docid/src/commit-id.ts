import CID from 'cids';
import multibase from 'multibase';
import * as doctypes from './doctypes';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { Memoize } from 'typescript-memoize';
import { DEFAULT_BASE, DOCID_CODEC } from './constants';
import { readCid, readVarint } from './reading-bytes';
import { DocID } from './doc-id';
import { DocRef } from './doc-ref';

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
    throw new Error(`No commit information provided`);
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
    return DocID.fromString(base).atCommit(commit);
  } else {
    return fromBytes(multibase.decode(protocolFree));
  }
}

/**
 * Commit identifier, includes doctype, genesis CID, commit CID.
 * Encoded as '<multibase-prefix><multicodec-docid><doctype><genesis-cid-bytes><commit-cid-bytes>'
 */
export class CommitID implements DocRef {
  readonly #doctype: number;
  readonly #cid: CID;
  readonly #commit: CID | null; // null ≝ genesis commit

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
  @Memoize()
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
  @Memoize()
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
  @Memoize()
  get commit(): CID {
    return this.#commit || this.#cid;
  }

  /**
   * Bytes representation
   */
  @Memoize()
  get bytes(): Uint8Array {
    const codec = varint.encode(DOCID_CODEC);
    const doctype = varint.encode(this.type);

    const commitBytes = this.#commit?.bytes || new Uint8Array([0]);
    return uint8ArrayConcat([codec, doctype, this.cid.bytes, commitBytes]);
  }

  /**
   * Construct new CommitID for the same document, but a new `commit` CID.
   */
  atCommit(commit: CID | string | number): CommitID {
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
  @Memoize()
  toString(): string {
    return uint8ArrayToString(multibase.encode(DEFAULT_BASE, this.bytes));
  }

  /**
   * Encode the DocID into a base36 url
   */
  @Memoize()
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
    return `CommitID(${this.toString()})`;
  }

  /**
   * String representation of CommitID.
   */
  [Symbol.toPrimitive](): string | Uint8Array {
    return this.toString();
  }
}
