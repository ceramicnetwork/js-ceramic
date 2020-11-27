import { DID, DIDProvider } from 'dids'
import { Doctype, DoctypeHandler, DocOpts, DocParams } from "./doctype"
import DocID from '@ceramicnetwork/docid'
import { ChainInfo } from "./context"

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
     * Initialize the Ceramic API
     */
    init(): Promise<void>;

    /**
     * Register Doctype handler
     * @param doctypeHandler - DoctypeHandler instance
     */
    addDoctypeHandler<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void;

    /**
     * Finds document handler for the doctype
     * @param doctype - Doctype
     */
    findDoctypeHandler<T extends Doctype>(doctype: string): DoctypeHandler<T>;

    /**
     * Create Doctype instance
     * @param doctype - Doctype name
     * @param params - Create parameters
     * @param opts - Initialization options
     */
    createDocument<T extends Doctype>(doctype: string, params: DocParams, opts?: DocOpts): Promise<T>;

    /**
     * Create Doctype from genesis record
     * @param doctype - Document type
     * @param genesis - Genesis record
     * @param opts - Initialization options
     */
    createDocumentFromGenesis<T extends Doctype>(doctype: string, genesis: any, opts?: DocOpts): Promise<T>;

    /**
     * Loads Doctype instance
     * @param docId - Document ID
     * @param opts - Initialization options
     */
    loadDocument<T extends Doctype>(docId: DocID | string, opts?: DocOpts): Promise<T>;

    /**
     * Load all document records by document ID
     * @param docId - Document ID
     */
    loadDocumentRecords(docId: DocID | string): Promise<Array<Record<string, any>>>;

    /**
     * Applies record on the existing document
     * @param docId - Document ID
     * @param record - Record to be applied
     * @param opts - Initialization options
     */
    applyRecord<T extends Doctype>(docId: DocID | string, record: Record<string, unknown>, opts?: DocOpts): Promise<T>;

    /**
     * Set DID provider
     * @param provider - DID provider instance
     */
    setDIDProvider (provider: DIDProvider): Promise<void>;

    /**
     * @returns an object which contains an array of the CAIP-2 chain IDs of the blockchains that are supported for
     * anchoring documents and a preferred one.
     */
    getChainsInfo(): Promise<ChainInfo>;

    /**
     * Closes Ceramic instance
     */
    close(): Promise<void>; // gracefully close the ceramic instance
}
