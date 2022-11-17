import { CID } from 'multiformats/cid'
import { base36 } from 'multiformats/bases/base36'
import { StreamType } from './stream-type.js'
import varint from 'varint'
import { concat as uint8ArrayConcat } from 'uint8arrays'
import { STREAMID_CODEC } from './constants.js'
import { StreamID } from './stream-id.js'
import type { StreamRef } from './stream-ref.js'
import { tryCatch } from './try-catch.util.js'
import * as parsing from './stream-ref-parsing.js'

export class InvalidCommitIDBytesError extends Error {
  constructor(bytes: Uint8Array) {
    super(
      `Error while parsing CommitID from bytes ${base36.encode(
        bytes
      )}: no commit information provided`
    )
  }
}

export class InvalidCommitIDStringError extends Error {
  constructor(input: string) {
    super(`Error while parsing CommitID from string ${input}: no commit information provided`)
  }
}

/**
 * Parse CommitID from bytes representation.
 *
 * @param bytes - bytes representation of CommitID.
 * @throws error on invalid input
 * @see CommitID#bytes
 */
function fromBytes(bytes: Uint8Array): CommitID {
  const parsed = parsing.fromBytes(bytes, 'CommitID')
  if (parsed.kind === 'commit-id') {
    return new CommitID(parsed.type, parsed.genesis, parsed.commit)
  }
  throw new InvalidCommitIDBytesError(bytes)
}

/**
 * Same as fromBytes, but returns an Error instance rather than throwing if there is a problem
 * with the input.
 * Note that some exceptions can still be thrown in certain cases, if they come from lower-level
 * libraries like multibase, for example.
 * @param bytes
 */
function fromBytesNoThrow(bytes: Uint8Array): CommitID | Error {
  return tryCatch(() => fromBytes(bytes))
}

/**
 * Parse CommitID from string representation.
 *
 * @param input - string representation of CommitID, be it base36-encoded string or URL.
 * @see CommitID#toString
 * @see CommitID#toUrl
 */
function fromString(input: string): CommitID {
  const parsed = parsing.fromString(input, 'CommitID')
  if (parsed.kind === 'commit-id') {
    return new CommitID(parsed.type, parsed.genesis, parsed.commit)
  }
  throw new InvalidCommitIDStringError(input)
}

/**
 * Same as fromString, but returns an Error instance rather than throwing if there is a problem
 * with the input.
 * Note that some exceptions can still be thrown in certain cases, if they come from lower-level
 * libraries like multibase, for example.
 * @param input
 */
function fromStringNoThrow(input: string): CommitID | Error {
  return tryCatch(() => fromString(input))
}

const TAG = Symbol.for('@ceramicnetwork/streamid/CommitID')

/**
 * Construct new CommitID for a given stream and commit
 */
function make(stream: StreamID, commit: CID | string | number): CommitID {
  return new CommitID(stream.type, stream.cid, commit)
}

/**
 * Commit identifier, includes type, genesis CID, commit CID.
 *
 * Encoded as `<multibase-prefix><multicodec-streamid><type><genesis-cid-bytes><commit-cid-bytes>`.
 *
 * String representation is base36-encoding of the bytes above.
 */
export class CommitID implements StreamRef {
  protected readonly _tag = TAG

  readonly #type: number
  readonly #cid: CID
  readonly #commit: CID | null // null ≝ genesis commit

  // Memoization
  #_baseID?: StreamID
  #_typeName?: string
  #_commit?: CID
  #_bytes?: Uint8Array
  #_toString?: string
  #_toUrl?: string

  static fromBytes = fromBytes
  static fromBytesNoThrow = fromBytesNoThrow
  static fromString = fromString
  static fromStringNoThrow = fromStringNoThrow
  static make = make

  // WORKAROUND. Weird replacement for Symbol.hasInstance due to
  // this old bug in Babel https://github.com/babel/babel/issues/4452
  // which is used by CRA, which is widely popular.
  static isInstance(instance: any): instance is CommitID {
    return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG
  }

  /**
   * Create a new StreamID.
   *
   * @param type
   * @param {CID|string}         cid
   * @param {CID|string}         commit CID. Pass '0', 0, or omit the value as shorthand for the genesis commit.
   *
   * @example
   * new StreamID(<type>, <CID>|<cidStr>)
   * new StreamID(<type>, <CID>|<cidStr>, <CommitCID>|<CommitCidStr>)
   */
  constructor(
    type: string | number,
    cid: CID | string,
    commit: CID | string | number | null = null
  ) {
    if (!type && type !== 0) throw new Error('constructor: type required')
    if (!cid) throw new Error('constructor: cid required')
    this.#type = typeof type === 'string' ? StreamType.codeByName(type) : type
    this.#cid = typeof cid === 'string' ? CID.parse(cid) : cid
    this.#commit = parsing.parseCommit(this.#cid, commit)
  }

  /**
   * Construct StreamID, no commit information included
   */
  get baseID(): StreamID {
    if (!this.#_baseID) {
      this.#_baseID = new StreamID(this.#type, this.#cid)
    }
    return this.#_baseID
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
  get typeName(): string {
    if (!this.#_typeName) {
      this.#_typeName = StreamType.nameByCode(this.#type)
    }
    return this.#_typeName
  }

  /**
   * Genesis CID
   */
  get cid(): CID {
    return this.#cid
  }

  /**
   * Commit CID
   */
  get commit(): CID {
    if (!this.#_commit) {
      this.#_commit = this.#commit || this.#cid
    }
    return this.#_commit
  }

  /**
   * Bytes representation
   */
  get bytes(): Uint8Array {
    if (!this.#_bytes) {
      const codec = varint.encode(STREAMID_CODEC)
      const type = varint.encode(this.type)

      const commitBytes = this.#commit?.bytes || new Uint8Array([0])
      this.#_bytes = uint8ArrayConcat([codec, type, this.cid.bytes, commitBytes])
    }
    return this.#_bytes
  }

  /**
   * Compare equality with another CommitID.
   */
  equals(other: CommitID): boolean {
    return (
      this.type === other.type && this.cid.equals(other.cid) && this.commit.equals(other.commit)
    )
  }

  /**
   * Encode the CommitID into a string.
   */
  toString(): string {
    if (!this.#_toString) {
      this.#_toString = base36.encode(this.bytes)
    }
    return this.#_toString
  }

  /**
   * Encode the StreamID into a base36 url
   */
  toUrl(): string {
    if (!this.#_toUrl) {
      this.#_toUrl = `ceramic://${this.toString()}`
    }
    return this.#_toUrl
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
    return `CommitID(${this.toString()})`
  }

  /**
   * String representation of CommitID.
   */
  [Symbol.toPrimitive](): string | Uint8Array {
    return this.toString()
  }
}
