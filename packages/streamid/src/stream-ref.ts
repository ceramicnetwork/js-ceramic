import type { CID } from 'multiformats/cid'
import { StreamID } from './stream-id.js'
import { CommitID } from './commit-id.js'
import { base36 } from 'multiformats/bases/base36'
import * as parsing from './stream-ref-parsing.js'

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
    const parsed = parsing.fromBytes(input)
    switch (parsed.kind) {
      case 'commit-id':
        return new CommitID(parsed.type, parsed.genesis, parsed.commit)
      case 'stream-id':
        return new StreamID(parsed.type, parsed.genesis)
      default:
        throw new Error(`Malformed StreamRef bytes: ${base36.encode(input)}`)
    }
  }

  export function fromString(input: string): CommitID | StreamID {
    const parsed = parsing.fromString(input)
    switch (parsed.kind) {
      case 'commit-id':
        return new CommitID(parsed.type, parsed.genesis, parsed.commit)
      case 'stream-id':
        return new StreamID(parsed.type, parsed.genesis)
      default:
        throw new Error(`Malformed StreamRef string: ${input}`)
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
