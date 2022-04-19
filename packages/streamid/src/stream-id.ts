import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import { base36 } from 'multiformats/bases/base36'
import { sha256 as hasher } from 'multiformats/hashes/sha2'
import varint from 'varint'
import * as codec from '@ipld/dag-cbor'
import { concat as uint8ArrayConcat } from 'uint8arrays'
import { STREAMID_CODEC } from './constants.js'
import { readCidNoThrow, readVarint } from './reading-bytes.js'
import { Memoize } from 'typescript-memoize'
import { StreamRef } from './stream-ref.js'
import { StreamType } from './stream-type.js'

/**
 * Parse StreamID from bytes representation.
 *
 * @param bytes - bytes representation of StreamID.
 * @throws error on invalid input
 * @see StreamID#bytes
 */
function fromBytes(bytes: Uint8Array): StreamID {
  const result = fromBytesNoThrow(bytes)
  if (result instanceof Error) {
    throw result
  }
  return result
}

/**
 * Same as fromBytes, but returns an Error instance rather than throwing if there is a problem
 * with the input.
 * Note that some exceptions can still be thrown in certain cases, if they come from lower-level
 * libraries like multibase, for example.
 * @param bytes
 */
function fromBytesNoThrow(bytes: Uint8Array): StreamID | Error {
  const [streamCodec, streamCodecRemainder] = readVarint(bytes)
  if (streamCodec !== STREAMID_CODEC)
    return new Error('fromBytes: invalid streamid, does not include streamid codec')
  const [type, streamTypeRemainder] = readVarint(streamCodecRemainder)
  const cidResult = readCidNoThrow(streamTypeRemainder)
  if (cidResult instanceof Error) {
    return cidResult
  }
  const [cid, cidRemainder] = cidResult
  if (cidRemainder.length > 0) {
    return new Error(`Invalid StreamID: contains commit`)
  }
  return new StreamID(type, cid)
}

/**
 * Parse StreamID from string representation.
 *
 * @param input - string representation of StreamID, be it base36-encoded string or URL.
 * @see StreamID#toString
 * @see StreamID#toUrl
 */
function fromString(input: string): StreamID {
  const result = fromStringNoThrow(input)
  if (result instanceof Error) {
    throw result
  }
  return result
}

/**
 * Same as fromString but returns an Error instance rather than throwing if there is a problem
 * with the input.
 * Note that some exceptions can still be thrown in certain cases, if they come from lower-level
 * libraries like multibase, for example.
 * @param input
 */
function fromStringNoThrow(input: string): StreamID | Error {
  const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '')
  const commitFree = protocolFree.includes('commit') ? protocolFree.split('?')[0] : protocolFree
  const bytes = base36.decode(commitFree)
  return fromBytesNoThrow(bytes)
}

const TAG = Symbol.for('@ceramicnetwork/streamid/StreamID')

/**
 * Stream identifier, no commit information included.
 *
 * Contains stream type and CID of genesis commit.
 *
 * Encoded as `<multibase-prefix><multicodec-streamid><type><genesis-cid-bytes>`.
 *
 * String representation is base36-encoding of the bytes above.
 */
export class StreamID implements StreamRef {
  protected readonly _tag = TAG

  readonly #type: number
  readonly #cid: CID

  static fromBytes = fromBytes
  static fromBytesNoThrow = fromBytesNoThrow
  static fromString = fromString
  static fromStringNoThrow = fromStringNoThrow

  // WORKARDOUND Weird replacement for Symbol.hasInstance due to
  // this old bug in Babel https://github.com/babel/babel/issues/4452
  // which is used by CRA, which is widely popular.
  static isInstance(instance: any): instance is StreamID {
    return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG
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
    if (!(type || type === 0)) throw new Error('constructor: type required')
    if (!cid) throw new Error('constructor: cid required')
    this.#type = typeof type === 'string' ? StreamType.codeByName(type) : type
    this.#cid = typeof cid === 'string' ? CID.parse(cid) : cid
  }

  /**
   * Create a streamId from a genesis commit.
   *
   * @param
   * @param {string|number}         type       the stream type
   * @param {Record<string, any>}   genesis    a genesis commit
   *
   * @example
   * ```typescript
   * const streamId = StreamID.fromGenesis('tile', {
   *   header: {
   *     controllers:['did:3:kjz...'],
   *     family: 'IDX'
   *   }
   * });
   * ```
   */
  static async fromGenesis(type: string | number, genesis: Record<string, any>): Promise<StreamID> {
    const block = await Block.encode({ value: genesis, codec, hasher })
    return new StreamID(type, block.cid)
  }

  /**
   * Stream type code
   */
  get type(): number {
    return this.#type
  }

  /**
   * Stream type name
   */
  @Memoize()
  get typeName(): string {
    return StreamType.nameByCode(this.#type)
  }

  /**
   * Genesis commits CID
   */
  get cid(): CID {
    return this.#cid
  }

  /**
   * Bytes representation of StreamID.
   */
  @Memoize()
  get bytes(): Uint8Array {
    const codec = varint.encode(STREAMID_CODEC)
    const type = varint.encode(this.type)

    return uint8ArrayConcat([codec, type, this.cid.bytes])
  }

  /**
   * Copy of self. Exists to maintain compatibility with CommitID.
   * @readonly
   */
  @Memoize()
  get baseID(): StreamID {
    return new StreamID(this.#type, this.#cid)
  }

  /**
   * Compare equality with another StreamID.
   */
  equals(other: StreamID): boolean {
    if (StreamID.isInstance(other)) {
      return this.type === other.type && this.cid.equals(other.cid)
    } else {
      return false
    }
  }

  /**
   * Encode the StreamID into a string.
   */
  @Memoize()
  toString(): string {
    return base36.encode(this.bytes)
  }

  /**
   * Encode the StreamID into a base36 url.
   */
  @Memoize()
  toUrl(): string {
    return `ceramic://${this.toString()}`
  }

  /**
   * StreamId(k3y52l7mkcvtg023bt9txegccxe1bah8os3naw5asin3baf3l3t54atn0cuy98yws)
   */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `StreamID(${this.toString()})`
  }

  /**
   * String representation of StreamID.
   */
  [Symbol.toPrimitive](): string {
    return this.toString()
  }
}
