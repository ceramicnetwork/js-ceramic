import Document, { DocState } from "../document"

/**
 * State store API
 */
export default interface StateStore {

    /**
     * Open pinning service
     */
    open(): Promise<void>;

    /**
     * Pin document
     * @param document - Document instance
     * @param pinOnIpfs - Pin logs on IPFS
     */
    pin(document: Document, pinOnIpfs?: boolean): Promise<void>;

    /**
     * Load document
     * @param docId - Document ID
     */
    loadState(docId: string): Promise<DocState>;

    /**
     * Is document pinned locally?
     * @param docId - Document ID
     */
    isDocPinned(docId: string): Promise<boolean>;

    /**
     * Unpin document
     * @param docId - Document ID
     */
    rm(docId: string): Promise<void>;

    /**
     * List pinned document
     * @param docId - Document ID
     */
    ls(docId?: string): Promise<string[]>;

    /**
     * Close pinning service
     */
    close(): Promise<void>;

}
