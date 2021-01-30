import { DID, DIDProvider } from 'dids'
import {
    Doctype,
    DoctypeHandler,
    DocOpts,
    DocParams,
    CeramicCommit
} from "./doctype"
import DocID from '@ceramicnetwork/docid'

/**
 * Describes Ceramic pinning functionality
 */
export interface PinApi {
    /**
     * Pin document
     * @param docId - Document ID
     */
    add(docId: DocID): Promise<void>;

    /**
     * Unpin document
     * @param docId - Document ID
     */
    rm(docId: DocID): Promise<void>;

    /**
     * List pinned documents
     * @param docId - Document ID for filtering
     */
    ls(docId?: DocID): Promise<AsyncIterable<string>>;
}

/**
 * Describes DID provider instance
 */
export type { DIDProvider } from 'dids'

/**
 * Describes Ceramic node API
 */
export interface CeramicApi {
    pin: PinApi;
    did?: DID;

    /**
     * Create Doctype instance
     * @param doctype - Doctype name
     * @param params - Create parameters
     * @param opts - Initialization options
     */
    createDocument<T extends Doctype>(doctype: string, params: DocParams, opts?: DocOpts): Promise<T>;

    /**
     * Create Doctype from genesis commit
     * @param doctype - Document type
     * @param genesis - Genesis commit
     * @param opts - Initialization options
     */
    createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts?: DocOpts): Promise<T>;

    /**
     * Makes an update to an existing document.
     * @param doc - Document to update
     * @param params - Update parameters
     * @param opts - Additional options
     */
    updateDocument<T extends Doctype>(doc: T, params: DocParams, opts?: DocOpts): Promise<void>;

    /**
     * Loads Doctype instance
     * @param docId - Document ID
     * @param opts - Initialization options
     */
    loadDocument<T extends Doctype>(docId: DocID | string, opts?: DocOpts): Promise<T>;

    /**
     * Set DID provider
     * @param provider - DID provider instance
     */
    setDIDProvider (provider: DIDProvider): Promise<void>;

    /**
     * Register Doctype handler
     * @param doctypeHandler - DoctypeHandler instance
     */
    addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void;

    /**
     * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported for anchoring
     * documents.
     */
    getSupportedChains(): Promise<Array<string>>;

    /**
     * Closes Ceramic instance
     */
    close(): Promise<void>; // gracefully close the ceramic instance


    /////////////// Below here is the advanced API, primarily for internal use. //////////////////
    /////////////// Only use if you know what you're doing.                     //////////////////

    /**
     * Load all document commits by document ID
     * @param docId - Document ID
     */
    loadDocumentCommits(docId: DocID | string): Promise<Array<Record<string, any>>>;

    /**
     * Load all document commits by document ID
     * @param docId - Document ID
     * @deprecated See `loadDocumentCommits`
     */
    loadDocumentRecords(docId: DocID | string): Promise<Array<Record<string, any>>>;

    /**
     * Applies commit on the existing document
     * @param docId - Document ID
     * @param commit - Commit to be applied
     * @param opts - Initialization options
     * @deprecated Use `applyCommit`
     */
    applyRecord<T extends Doctype>(docId: DocID | string, commit: CeramicCommit, opts?: DocOpts): Promise<T>;

    /**
     * Applies commit on the existing document
     * @param docId - Document ID
     * @param commit - Commit to be applied
     * @param opts - Initialization options
     */
    applyCommit<T extends Doctype>(docId: DocID | string, commit: CeramicCommit, opts?: DocOpts): Promise<T>;

}

export interface MultiQuery {
    docId: DocID | string
    paths?: Array<string>
}
