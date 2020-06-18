import CID from "cids"
import Level from "level-ts";

import Ipfs from "ipfs"
import Document from "../document"
import StateStore from "./state-store"
import Dispatcher from "../dispatcher"
import { AnchorStatus, DocState } from "../doctype"

/**
 * Level backed State Store
 */
export default class LevelStateStore implements StateStore {
    private store: any

    constructor(private ipfs: Ipfs.Ipfs, private dispatcher: Dispatcher, private storePath: string) {
    }

    /**
     * Open pinning service
     */
    async open(): Promise<void> {
        this.store = new Level(this.storePath);
    }

    /**
     * Pin document
     * @param document - Document instance
     * @param pinOnIpfs - Pin logs on IPFS
     */
    async pin(document: Document, pinOnIpfs = true): Promise<void> {
        const { state } = document;
        await this.store.put(document.id, this._serializeState(state))

        if (pinOnIpfs) {
            const { log } = state;
            const pinPromises = log.map(async (cid) => {
                const promisedPins = []

                promisedPins.push(this.ipfs.pin.add(cid.toString(), {
                    recursive: false,
                }))

                const record = await this.dispatcher.retrieveRecord(cid)
                if (record.proof) {
                    promisedPins.push(this.ipfs.pin.add(record.proof.toString(), {
                        recursive: false,
                    }))

                    const path = "root/" + record.path
                    const subPaths = path.split('/')

                    let currentPath = ""
                    for (const subPath of subPaths) {
                        if (subPath.length === 0) {
                            continue
                        }
                        currentPath += "/" + subPath

                        promisedPins.push(this.ipfs.pin.add(record.proof.toString() + currentPath, {
                            recursive: false,
                        }))
                    }
                }
                return promisedPins
            })
            await Promise.all(this._flattenArray(pinPromises));
        }
    }

    /**
     * Serializes document state
     * TODO move to common utility
     * @param state - Document state
     * @private
     */
    _serializeState(state: any): any {
        state.log = state.log.map((cid: any) => cid.toString());
        if (state.anchorStatus) {
            state.anchorStatus = AnchorStatus[state.anchorStatus];
        }
        if (state.anchorScheduledFor) {
            state.anchorScheduledFor = new Date(state.anchorScheduledFor).toISOString(); // ISO format of the UTC time
        }
        if (state.anchorProof) {
            state.anchorProof.txHash = state.anchorProof.txHash.toString();
            state.anchorProof.root = state.anchorProof.root.toString();
        }
        return state
    }

    /**
     * Deserializes document state
     * TODO move to common utility
     * @param state - Serialized document state
     * @private
     */
    _deserializeState(state: any): DocState {
        state.log = state.log.map((cidStr: string): CID => new CID(cidStr))
        if (state.anchorProof) {
            state.anchorProof.txHash = new CID(state.anchorProof.txHash);
            state.anchorProof.root = new CID(state.anchorProof.root);
        }

        if (state.anchorStatus) {
            state.anchorStatus = AnchorStatus[state.anchorStatus];
        }
        if (state.anchorScheduledFor) {
            state.anchorScheduledFor = Date.parse(state.anchorScheduledFor); // ISO format of the UTC time
        }
        return state
    }

    /**
     * Load document
     * @param docId - Document ID
     */
    async loadState(docId: string): Promise<DocState> {
        try {
            const state = await this.store.get(docId)
            return this._deserializeState(state)
        } catch (err) {
            if (err.notFound) {
                return null; // return null for non-existent entry
            }
            throw err;
        }
    }

    /**
     * Is document pinned locally?
     * @param docId - Document ID
     */
    async isDocPinned(docId: string): Promise<boolean> {
        const state = await this.loadState(docId);
        return Boolean(state)
    }

    /**
     * Unpin document
     * @param docId - Document ID
     */
    async rm(docId: string): Promise<void> {
        const state = await this.loadState(docId)
        if (state == null) {
            return
        }

        const { log } = state;
        const pinPromises = log.map(async (cid) => {
            try {
                const promisedPins = []
                promisedPins.push(this.ipfs.pin.rm(cid.toString()))

                const record = await this.dispatcher.retrieveRecord(cid)
                if (record.proof) {
                    promisedPins.push(this.ipfs.pin.rm(record.proof.toString()))

                    const path = "root/" + record.path
                    const subPaths = path.split('/')

                    let currentPath = ""
                    for (const subPath of subPaths) {
                        if (subPath.length === 0) {
                            continue
                        }
                        currentPath += "/" + subPath
                        promisedPins.push(this.ipfs.pin.rm(record.proof.toString() + currentPath))
                    }
                }
            } catch (e) {
                // do nothing
            }
        });
        try {
            await Promise.all(this._flattenArray(pinPromises));
        } catch (e) {
            // do nothing
        }

        return this.store.del(docId)
    }

    /**
     * List pinned document
     * @param docId - Document ID
     */
    async ls(docId?: string): Promise<AsyncIterable<string>> {
        let docIds: string[]
        if (docId == null) {
            docIds = await this._listDocIds();
        } else {
            const isPinned = await this.isDocPinned(docId)
            docIds = isPinned ? [docId] : []
        }

        return {
            [Symbol.asyncIterator](): any {
                let index = 0
                return {
                    next(): any {
                        if (index === docIds.length) {
                            return Promise.resolve({ value: null, done: true });
                        }
                        return Promise.resolve({ value: docIds[index++], done: false });
                    }
                };
            }
        }
    }

    /**
     * List all document IDs
     * @private
     */
    async _listDocIds(): Promise<string[]> {
        const { store } = this;
        const keys: string[] = [];
        const all = await store.stream({
            keys: true
        })
        for (const { key } of all) {
            keys.push(key)
        }
        return keys
    }

    /**
     * Flatten array of arrays
     * @param arr - Array of arrays
     * @private
     */
    _flattenArray(arr: any[]): any[] {
        return arr.reduce((accumulator, value) => accumulator.concat(value), []);
    }

    /**
     * Close pinning service
     */
    async close(): Promise<void> {
        // do nothing
    }

}
