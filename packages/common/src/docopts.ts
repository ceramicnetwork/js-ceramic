interface BasicLoadOpts {
    /**
     * Whether or not to wait a short period of time to hear about new tips for the document after
     * performing the operation.
     */
    sync?: boolean

    /**
     * How long to wait for a response from pubsub when syncing a document.
     */
    syncTimeoutMillis?: number

    /**
     * Setting this to true means we won't try to load the stream from the network or query pubsub
     * for the current tip. We'll only return the stream if it exists in our in-memory cache
     * or in the state store for pinned streams. This option is incompatible with sync:true.
     */
    fromCacheOnly?: boolean
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
