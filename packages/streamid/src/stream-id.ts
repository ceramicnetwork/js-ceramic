import CID from 'cids';
import multibase from 'multibase';
import varint from 'varint';
import uint8ArrayConcat from 'uint8arrays/concat';
import uint8ArrayToString from 'uint8arrays/to-string';
import { DEFAULT_BASE, STREAMID_CODEC } from './constants';
import { readCid, readVarint } from './reading-bytes';
import { Memoize } from 'typescript-memoize';
import { CommitID } from './commit-id';
import { StreamRef } from './stream-ref';
import { StreamType } from './stream-type';

/**
 * Parse StreamID from bytes representation.
 *
 * @param bytes - bytes representation of StreamID.
 * @see [[StreamID#bytes]]
 */
function fromBytes(bytes: Uint8Array): StreamID {
  const [streamCodec, streamCodecRemainder] = readVarint(bytes);
  if (streamCodec !== STREAMID_CODEC) throw new Error('fromBytes: invalid streamid, does not include streamid codec');
  const [type, streamTypeRemainder] = readVarint(streamCodecRemainder);
  const [cid, cidRemainder] = readCid(streamTypeRemainder);
  if (cidRemainder.length > 0) {
    throw new Error(`Invalid StreamID: contains commit`);
  }
  return new StreamID(type, cid);
}

/**
 * Parse StreamID from string representation.
 *
 * @param input - string representation of StreamID, be it base36-encoded string or URL.
 * @see [[StreamID#toString]]
 * @see [[StreamID#toUrl]]
 */
function fromString(input: string): StreamID {
  const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '');
  const commitFree = protocolFree.includes('commit') ? protocolFree.split('?')[0] : protocolFree;
  const bytes = multibase.decode(commitFree);
  return fromBytes(bytes);
}

const TAG = Symbol.for('@ceramicnetwork/streamid/StreamID');

/**
 * Stream identifier, no commit information included.
 * Encoded as '<multibase-prefix><multicodec-streamid><type><genesis-cid-bytes>'
 */
export class StreamID implements StreamRef {
  protected readonly _tag = TAG;

  readonly #type: number;
  readonly #cid: CID;

  static fromBytes = fromBytes;
  static fromString = fromString;

  static [Symbol.hasInstance](instance: any): boolean {
    return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG;
  }

  /**
   * Create a new StreamID.
   *
   * @param {string|number}      type       the stream type
   * @param {CID|string}         cid
   *
   * @example
   * ```typescript
   * new StreamID('tile', 'bagcqcerakszw2vsovxznyp5gfnpdj4cqm2xiv76yd24wkjewhhykovorwo6a');
   * new StreamID('tile', cid);
   * new StreamID(0, cid);
   * ```
   */
  constructor(type: string | number, cid: CID | string) {
    if (!(type || type === 0)) throw new Error('constructor: type required');
    if (!cid) throw new Error('constructor: cid required');
    this.#type = typeof type === 'string' ? StreamType.indexByName(type) : type;
    this.#cid = typeof cid === 'string' ? new CID(cid) : cid;
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
   * Genesis record CID
   */
  get cid(): CID {
    return this.#cid;
  }

  /**
   * Bytes representation of StreamID.
   */
  @Memoize()
  get bytes(): Uint8Array {
    const codec = varint.encode(STREAMID_CODEC);
    const type = varint.encode(this.type);

    return uint8ArrayConcat([codec, type, this.cid.bytes]);
  }

  /**
   * Copy of self. Exists to maintain compatibility with CommitID.
   * @readonly
   */
  @Memoize()
  get baseID(): StreamID {
    return new StreamID(this.#type, this.#cid);
  }

  /**
   * Construct new CommitID for the same stream, but a new `commit` CID.
   */
  atCommit(commit: CID | string | number): CommitID {
    return new CommitID(this.#type, this.#cid, commit);
  }

  /**
   * Compare equality with another StreamID.
   */
  equals(other: StreamID): boolean {
    if (other instanceof StreamID) {
      return this.type === other.type && this.cid.equals(other.cid);
    } else {
      return false;
    }
  }

  /**
   * Encode the StreamID into a string.
   */
  @Memoize()
  toString(): string {
    return uint8ArrayToString(multibase.encode(DEFAULT_BASE, this.bytes));
  }

  /**
   * Encode the StreamID into a base36 url.
   */
  @Memoize()
  toUrl(): string {
    return `ceramic://${this.toString()}`;
  }

  /**
   * StreamId(k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws)
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `StreamID(${this.toString()})`;
  }

  /**
   * String representation of StreamID.
   */
  [Symbol.toPrimitive](): string {
    return this.toString();
  }
}
