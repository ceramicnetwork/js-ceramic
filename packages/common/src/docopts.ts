/**
 * Enum describing different modes for syncing a stream.
 * - SYNC_ALWAYS - Means that regardless of whether or not the document is found in the node's cache
 *   we will always query pubsub for the current tip for the stream and wait up to 'syncTimeoutMillis'
 *   for the response.
 * - PREFER_CACHE - Means that if the stream is found in the node's in-memory cache or pin store,
 *   then the cached version is returned without performing any query to the pubsub network for the
 *   current tip.
 */
export enum SyncOptions {
    PREFER_CACHE,
    SYNC_ALWAYS,
}

interface BasicLoadOpts {
    /**
     * Controls the behavior related to syncing a stream to the most recent tip.
     */
    sync?: SyncOptions

    /**
     * How long to wait for a response from pubsub when syncing a stream.
     */
    syncTimeoutMillis?: number
}

/**
 * Extra options passed as part of operations that load a document
 */
export interface LoadOpts extends BasicLoadOpts {
    /**
     * Load a previous version of the document based on unix timestamp
     */
    atTime?: number
}

/**
 * Extra options passed as part of operations that perform updates to documents
 */
export interface UpdateOpts {
    /**
     * Whether or not to request an anchor after performing the operation.
     */
    anchor?: boolean

    /**
     * Whether or not to publish the current tip commit to the pubsub channel after performing
     * the operation.
     */
    publish?: boolean
}

/**
 * Extra options passed as part of operations that create documents
 */
export interface CreateOpts extends UpdateOpts, BasicLoadOpts {}
