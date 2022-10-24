import type { CID } from 'multiformats/cid'
import { StreamID } from './stream-id.js'
import { CommitID } from './commit-id.js'
import { readCid, readVarint } from './reading-bytes.js'
import { STREAMID_CODEC } from './constants.js'
import { base36 } from 'multiformats/bases/base36'

/**
 * Ensure there is some resemblance in CommitID and StreamID APIs.
 */
export interface StreamRef {
  readonly type: number
  readonly typeName: string
  readonly cid: CID
  readonly bytes: Uint8Array
  readonly baseID: StreamID
  equals(other: this): boolean
  toString(): string
  toUrl(): string
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace StreamRef {
  export function fromBytes(input: Uint8Array): StreamID | CommitID {
    const [streamCodec, streamCodecRemainder] = readVarint(input)
    if (streamCodec !== STREAMID_CODEC)
      throw new Error('fromBytes: invalid streamid, does not include streamid codec')
    const [type, streamtypeRemainder] = readVarint(streamCodecRemainder)
    const cidResult = readCid(streamtypeRemainder)
    const [base, baseRemainder] = cidResult
    if (baseRemainder.length === 0) {
      return new StreamID(type, base)
    } else if (baseRemainder.length === 1) {
      // Zero commit
      return new CommitID(type, base, baseRemainder[0])
    } else {
      // Commit
      const [commit] = readCid(baseRemainder)
      return new CommitID(type, base, commit)
    }
  }

  export function fromString(input: string): CommitID | StreamID {
    const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '')
    const commit = protocolFree.split('?')[1]?.split('=')[1]
    const base = protocolFree.split('?')[0]
    if (!base) throw new Error(`Malformed commit string: ${input}`)
    if (commit) {
      const streamId = StreamID.fromString(base)
      return new CommitID(streamId.type, streamId.cid, commit)
    } else {
      const bytes = base36.decode(base)
      return fromBytes(bytes)
    }
  }

  /**
   * Try to parse `input` into CommitID or StreamID.
   */
  export function from(input: StreamID): StreamID
  export function from(input: CommitID): CommitID
  export function from(input: string | Uint8Array | unknown): StreamID | CommitID
  export function from(
    input: StreamID | CommitID | string | Uint8Array | unknown
  ): StreamID | CommitID {
    if (StreamID.isInstance(input)) {
      return input
    }
    if (CommitID.isInstance(input)) {
      return input
    }
    if (input instanceof Uint8Array) {
      return fromBytes(input)
    }
    if (typeof input === 'string') {
      return fromString(input)
    }
    throw new Error(`Can not build CommitID or StreamID from ${JSON.stringify(input)}`)
  }
}
