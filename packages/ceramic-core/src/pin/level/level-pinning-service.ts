import levelup from "levelup";
import leveldown from "leveldown";
import encoding from "encoding-down";

import type Ipfs from 'ipfs'
import Document, { DocState } from "../../document"
import PinningService from "../pinning-service"

/**
 * LevelDb backed Pinning Service
 */
export default class LevelPinningService implements PinningService {
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
        await this.store.put(document.id, state)

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
     * Load document
     * @param docId - Document ID
     */
    async loadState(docId: string): Promise<DocState> {
        try {
            return await this.store.get(docId)
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
        return state != null;
    }

    /**
     * Unpin document
     * @param document - Document instance
     */
    async rm(document: Document): Promise<void> {
        const { state } = document;
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
        return await this.store.del(document.id)
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