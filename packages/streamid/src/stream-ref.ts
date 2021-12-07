import type { CID } from 'multiformats/cid'
import { StreamID } from './stream-id'
import { CommitID } from './commit-id'

/**
 * Ensure there is some resemblance in CommitID and StreamID APIs.
 */
export interface StreamRef {
  readonly type: number
  readonly typeName: string
  readonly cid: CID
  readonly bytes: Uint8Array
  readonly baseID: StreamID
  atCommit(commit: CID | string | number): CommitID
  equals(other: this): boolean
  toString(): string
  toUrl(): string
}

/**
 * Return result of `f` or null if it fails.
 */
function tryCatch<A>(f: () => A): A {
  try {
    return f()
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace StreamRef {
  /**
   * Try to parse `input` into CommitID or StreamID.
   */
  // eslint-disable-next-line no-inner-declarations
  export function from(input: StreamID | CommitID | string | Uint8Array): StreamID | CommitID {
    if (StreamID.isInstance(input)) {
      return input
    } else if (CommitID.isInstance(input)) {
      return input
    } else if (input instanceof Uint8Array) {
      // Lazy computation: try CommitID, then StreamID
      const commitId = CommitID.fromBytesNoThrow(input)
      if (commitId instanceof Error) {
        return StreamID.fromBytes(input)
      }
      return commitId
    } else if (typeof input === 'string') {
      // Lazy computation: try CommitID, then StreamID
      const commitId = CommitID.fromStringNoThrow(input)
      if (commitId instanceof Error) {
        return StreamID.fromString(input)
      }
      return commitId
    } else {
      throw new Error(`Can not build CommitID or StreamID`)
    }
  }
}
