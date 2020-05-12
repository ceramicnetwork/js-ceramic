import CID from "cids"
import levelup from "levelup";
import leveldown from "leveldown";
import encoding from "encoding-down";

import type Ipfs from 'ipfs'
import Document, { AnchorStatus, DocState } from "../document"
import StateStore from "./state-store"

/**
 * LevelDb backed Pinning Service
 */
export default class LevelStateStore implements StateStore {
    private readonly store: any

    constructor(private ipfs: Ipfs.Ipfs, private pinningStorePath: string) {
        const encoded = encoding(leveldown(pinningStorePath), {
            valueEncoding: "json"
        });
        this.store = levelup(encoded);
    }

    /**
     * Open pinning service
     */
    async open(): Promise<void> {
        await this.store.open();
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
                return this.ipfs.pin.add(cid.toString(), {
                    recursive: false,
                })
            })
            await Promise.all(pinPromises);
        }
    }

    /**
     * Serializes document state
     * TODO move to common utility
     * @param state - Document state
     * @private
     */
    _serializeState (state: any): any {
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
    _deserializeState (state: any): DocState {
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
                await this.ipfs.pin.rm(cid.toString())
            } catch (e) {
                // do nothing
            }
            return
        });
        await Promise.all(pinPromises);
        return await this.store.del(docId)
    }

    /**
     * List pinned document
     * @param docId - Document ID
     */
    async ls(docId?: string): Promise<string[]> {
        if (docId == null) {
            return await this._listDocIds();
        }

        const isPinned = await this.isDocPinned(docId)
        return isPinned? [ docId ] : []
    }

    /**
     * List all document IDs
     * @private
     */
    async _listDocIds(): Promise<string[]> {
        const { store } = this;
        const keys: string[] = [];
        return new Promise(function (resolve, reject) {
            store.createKeyStream()
                .on('data', (data: string) => {
                    keys.push(data);
                })
                .on('error', function (err: Error) {
                    reject(err)
                })
                .on('close', function () {
                    resolve(keys);
                })
        })
    }

    /**
     * Close pinning service
     */
    async close(): Promise<void> {
        await this.store.close();
    }

}