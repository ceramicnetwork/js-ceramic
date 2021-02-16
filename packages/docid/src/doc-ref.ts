import CID from 'cids';
import { DocID } from './doc-id';
import { CommitID } from './commit-id';
import * as uint8arrays from 'uint8arrays'

/**
 * Ensure there is some resemblance in CommitID and DocID APIs.
 */
export interface DocRef {
  readonly type: number;
  readonly typeName: string;
  readonly cid: CID;
  readonly bytes: Uint8Array;
  readonly baseID: DocID;
  atCommit(commit: CID | string | number): CommitID;
  equals(other: this): boolean;
  toString(): string;
  toUrl(): string;
}

/**
 * Return result of `f` or null if it fails.
 */
function tryCatch<A>(f: () => A): A {
  try {
    return f();
  } catch {
    return null;
  }
}

/**
 * Throw an error.
 * Suitable for lazy computations.
 */
function complain(message: string): never {
  throw new Error(message);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DocRef {
  /**
   * Try to parse `input` into CommitID or DocID.
   */
  // eslint-disable-next-line no-inner-declarations
  export function from(input: DocID | CommitID | string | Uint8Array): DocID | CommitID {
    if (input instanceof DocID) {
      return input;
    } else if (input instanceof CommitID) {
      return input;
    } else if (input instanceof Uint8Array) {
      // Lazy computation: try CommitID, then DocID, then complain
      return (
        tryCatch(() => CommitID.fromBytes(input)) ||
        tryCatch(() => DocID.fromBytes(input)) ||
        complain(`Can not build CommitID or DocID from bytes ${uint8arrays.toString(input, 'base36')}`)
      );
    } else if (typeof input === 'string') {
      // Lazy computation: try CommitID, then DocID, then complain
      return (
        tryCatch(() => CommitID.fromString(input)) ||
        tryCatch(() => DocID.fromString(input)) ||
        complain(`Can not build CommitID or DocID from string ${input}`)
      );
    } else {
      throw new Error(`Can not build CommitID or DocID`)
    }
  }
}
