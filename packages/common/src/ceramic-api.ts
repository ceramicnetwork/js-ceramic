import { DID, DIDProvider } from 'dids'
import {
    Doctype,
    DoctypeHandler,
    DocOpts,
    CeramicCommit
} from "./doctype"
import { DocID, CommitID } from '@ceramicnetwork/docid'

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
     * Register Doctype handler
     * @param doctypeHandler - DoctypeHandler instance
     */
    addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void;

    /**
     * Create Doctype from genesis commit
     * @param doctype - Document type
     * @param genesis - Genesis commit
     * @param opts - Initialization options
     */
    createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts?: DocOpts): Promise<T>;

    /**
     * Loads Doctype instance
     * @param docId - Document ID
     * @param opts - Initialization options
     */
    loadDocument<T extends Doctype>(docId: DocID | CommitID | string, opts?: DocOpts): Promise<T>;

    /**
     * Load all document commits by document ID
     * @param docId - Document ID
     */
    loadDocumentCommits(docId: DocID | string): Promise<Array<Record<string, any>>>;

    /**
     * Load all document types instances for given multiqueries
     * @param queries - Array of MultiQueries
     * @param timeout - Timeout in milliseconds
     */
    multiQuery(queries: Array<MultiQuery>, timeout?: number):  Promise<Record<string, Doctype>>;

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

    /**
     * Sets the DID instance that will be used to author commits to documents. The DID instance
     * also includes the DID Resolver that will be used to verify commits from others.
     * @param did
     */
    setDID(did: DID): Promise<void>;

    /**
     * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported for anchoring
     * documents.
     */
    getSupportedChains(): Promise<Array<string>>;

    /**
     * Closes Ceramic instance
     */
    close(): Promise<void>; // gracefully close the ceramic instance
}

export interface MultiQuery {
    /**
     * The DocID of the document to load
     */
    docId: DocID | string
    /**
     * An array of paths used to look for linked documents
     */
    paths?: Array<string>
    /**
     * Load a previous version of the document based on unix timestamp
     */
    atTime?: number
}
