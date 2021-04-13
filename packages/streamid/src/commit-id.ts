import CID from 'cids';
import multibase from 'multibase';
import { StreamType } from './stream-type';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { Memoize } from 'typescript-memoize';
import { DEFAULT_BASE, STREAMID_CODEC } from './constants';
import { readCid, readVarint } from './reading-bytes';
import { StreamID } from './stream-id';
import { StreamRef } from './stream-ref';

/**
 * Parse CommitID from bytes representation.
 *
 * @param bytes - bytes representation of CommitID.
 * @see [[CommitID#bytes]]
 */
function fromBytes(bytes: Uint8Array): CommitID {
  const [streamCodec, streamCodecRemainder] = readVarint(bytes);
  if (streamCodec !== STREAMID_CODEC) throw new Error('fromBytes: invalid streamid, does not include streamid codec');
  const [type, streamtypeRemainder] = readVarint(streamCodecRemainder);
  const [base, baseRemainder] = readCid(streamtypeRemainder);
  if (baseRemainder.length === 0) {
    throw new Error(`No commit information provided`);
  } else if (baseRemainder.length === 1) {
    // Zero commit
    return new CommitID(type, base, baseRemainder[0]);
  } else {
    // Commit
    const [commit] = readCid(baseRemainder);
    return new CommitID(type, base, commit);
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
 * @param genesis - genesis CID for stream
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
    return StreamID.fromString(base).atCommit(commit);
  } else {
    return fromBytes(multibase.decode(protocolFree));
  }
}

const TAG = Symbol.for('@ceramicnetwork/streamid/CommitID');

/**
 * Commit identifier, includes type, genesis CID, commit CID.
 * Encoded as '<multibase-prefix><multicodec-streamid><type><genesis-cid-bytes><commit-cid-bytes>'
 */
export class CommitID implements StreamRef {
  protected readonly _tag = TAG;

  readonly #type: number;
  readonly #cid: CID;
  readonly #commit: CID | null; // null ≝ genesis commit

  static fromBytes = fromBytes;
  static fromString = fromString;

  static [Symbol.hasInstance](instance: any): boolean {
    return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG;
  }

  /**
   * Create a new StreamID.
   *
   * @param {string|number}      stream type
   * @param {CID|string}         cid
   * @param {CID|string}         commit CID. Pass '0', 0, or omit the value as shorthand for the genesis commit.
   *
   * @example
   * new StreamID(<type>, <CID>|<cidStr>)
   * new StreamID(<type>, <CID>|<cidStr>, <CommitCID>|<CommitCidStr>)
   */
  constructor(type: string | number, cid: CID | string, commit: CID | string | number = null) {
    if (!type && type !== 0) throw new Error('constructor: type required');
    if (!cid) throw new Error('constructor: cid required');
    this.#type = typeof type === 'string' ? StreamType.indexByName(type) : type;
    this.#cid = typeof cid === 'string' ? new CID(cid) : cid;
    this.#commit = parseCommit(this.#cid, commit);
  }

  /**
   * Construct StreamID, no commit information included
   */
  @Memoize()
  get baseID(): StreamID {
    return new StreamID(this.#type, this.#cid);
  }

  /**
   * Stream type code
   */
  get type(): number {
    return this.#type;
  }

  /**
   * Stream type name
   */
  @Memoize()
  get typeName(): string {
    return StreamType.nameByIndex(this.#type);
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
    const codec = varint.encode(STREAMID_CODEC);
    const type = varint.encode(this.type);

    const commitBytes = this.#commit?.bytes || new Uint8Array([0]);
    return uint8ArrayConcat([codec, type, this.cid.bytes, commitBytes]);
  }

  /**
   * Construct new CommitID for the same stream, but a new `commit` CID.
   */
  atCommit(commit: CID | string | number): CommitID {
    return new CommitID(this.#type, this.#cid, commit);
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
   * Encode the StreamID into a base36 url
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
