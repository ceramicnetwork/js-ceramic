import Level from "level-ts";
import { StreamState, StreamStateHolder, StreamUtils } from '@ceramicnetwork/common';
import { StateStore } from "./state-store"
import StreamID from '@ceramicnetwork/streamid'
import * as fs from 'fs'
import path from "path";

/**
 * Ceramic store for saving stream state to a local leveldb instance
 */
export class LevelStateStore implements StateStore {
    #store: Level

    constructor(private storeRoot: string) {
    }

    /**
     * Gets internal db
     */
    get store(): Level {
        return this.#store
    }

    /**
     * Open pinning service
     */
    open(networkName: string): void {
        // Always store the pinning state in a network-specific directory
        const storePath = path.join(this.storeRoot, networkName)
        if (fs) {
            fs.mkdirSync(storePath, { recursive: true }) // create dir if it doesn't exist
        }
        this.#store = new Level(storePath);
    }

    /**
     * Pin stream
     * @param streamStateHolder - Stream instance
     */
    async save(streamStateHolder: StreamStateHolder): Promise<void> {
        await this.#store.put(streamStateHolder.id.toString(), StreamUtils.serializeState(streamStateHolder.state))
    }

    /**
     * Load stream state
     * @param streamId - Stream ID
     */
    async load(streamId: StreamID): Promise<StreamState> {
        try {
            const state = await this.#store.get(streamId.baseID.toString())
            if (state) {
                return StreamUtils.deserializeState(state);
            } else {
                return null;
            }
        } catch (err) {
            if (err.notFound) {
                return null; // return null for non-existent entry
            }
            throw err;
        }
    }

    /**
     * Unpin stream
     * @param streamId - Stream ID
     */
    async remove(streamId: StreamID): Promise<void> {
        await this.#store.del(streamId.baseID.toString())
    }

    /**
     * List pinned stream
     * @param streamId - Stream ID
     */
    async list(streamId?: StreamID): Promise<string[]> {
        let streamIds: string[]
        if (streamId == null) {
            return this.#store.stream({ keys: true, values: false })
        } else {
            const exists = Boolean(await this.load(streamId.baseID))
            streamIds = exists ? [streamId.toString()] : []
        }
        return streamIds
    }

    /**
     * Close pinning service
     */
    async close(): Promise<void> {
        // Do Nothing
    }
}
