import type { DID } from 'dids'

/**
 * Options that are related to pinning streams.
 */
export interface PinningOpts {
  /**
   * Whether the stream should be pinned or not.
   */
  pin?: boolean
}

/**
 * Enum describing different modes for syncing a stream.
 */
export enum SyncOptions {
  /**
   *  If the stream is found in the node's in-memory cache or pin store, then return the cached version
   *  without performing any query to the pubsub network for the current tip.
   */
  PREFER_CACHE,

  /**
   *  Always query pubsub for the current tip for the stream and wait up to 'syncTimeoutSeconds'
   *   for the response, regardless of whether or not the stream is found in the node's cache
   */
  SYNC_ALWAYS,

  /**
   * Do not query pubsub for the new tip in any circumstance. This means that if the stream
   * is not in cache or the pin store, then only the genesis commit for the stream will be returned
   */
  NEVER_SYNC,
}

/**
 * Options related to syncing a stream.
 */
interface SyncOpts {
  /**
   * Controls the behavior related to syncing a stream to the most recent tip.
   */
  sync?: SyncOptions

  /**
   * How long to wait for a response from pubsub when syncing a stream.
   */
  syncTimeoutSeconds?: number
}

/**
 * Options that are used internally but aren't designed to be set by end users.
 */
export interface InternalOpts {
  /**
   * If true, when loading a stream log will throw an exception if any commit fails to apply.
   * If false, the error will be logged, but the log application operation will return as much
   * of the log as it was able to successfully apply.
   * This option is used internally but is not designed to be set by user applications.
   * @private
   */
  throwOnInvalidCommit?: boolean
}

/**
 * Extra options passed as part of operations that load a stream.
 */
export interface LoadOpts extends SyncOpts, PinningOpts {
  /**
   * Load a previous version of the stream based on unix timestamp
   */
  atTime?: number
}

/**
 * Extra options related to publishing updates to a stream.
 */
export interface PublishOpts {
  /**
   * Whether or not to publish the current tip commit to the pubsub channel after performing
   * the operation.
   */
  publish?: boolean
}

/**
 * Extra options related to anchoring.
 */
export interface AnchorOpts {
  /**
   * Whether or not to request an anchor after performing the operation.
   */
  anchor?: boolean
}

/**
 * Extra options passed as part of operations that update streams.
 */
export interface UpdateOpts extends PublishOpts, AnchorOpts, InternalOpts, PinningOpts {
  asDID?: DID
}

/**
 * Extra options passed as part of operations that create streams
 */
export interface CreateOpts extends UpdateOpts, SyncOpts, PinningOpts {}
