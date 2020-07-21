import { Doctype, DoctypeHandler, DocOpts } from "./doctype"

/**
 * Describes Ceramic pinning functionality
 */
export interface PinApi {
    /**
     * Pin document
     * @param docId - Document ID
     */
    add(docId: string): Promise<void>;

    /**
     * Unpin document
     * @param docId - Document ID
     */
    rm(docId: string): Promise<void>;

    /**
     * List pinned documents
     * @param docId - Document ID for filtering
     */
    ls(docId?: string): Promise<AsyncIterable<string>>;
}

// TODO handle errors as well
export interface JsonRpc2Response {
    'id': string;
    'json-rpc': string;
    'result': object;
}

/**
 * Describes DID provider instance
 */
export interface DIDProvider {
    send(jsonReq: object): JsonRpc2Response;
}

/**
 * Describes Ceramic node API
 */
export interface CeramicApi {
    pin: PinApi;

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
    createDocument<T extends Doctype>(doctype: string, params: object, opts?: DocOpts): Promise<T>;

    /**
     * Create Doctype from genesis record
     * @param genesis - Genesis record
     * @param opts - Initialization options
     */
    createDocumentFromGenesis<T extends Doctype>(genesis: any, opts?: DocOpts): Promise<T>;

    /**
     * Loads Doctype instance
     * @param docId - Document ID
     * @param opts - Initialization options
     */
    loadDocument<T extends Doctype>(docId: string, opts?: DocOpts): Promise<T>;

    /**
     * Lists current Doctype versions
     * @param docId - Document ID
     */
    listVersions(docId: string): Promise<string[]>;

    /**
     * Applies record on the existing document
     * @param docId - Document ID
     * @param record - Record to be applied
     * @param opts - Initialization options
     */
    applyRecord<T extends Doctype>(docId: string, record: object, opts?: DocOpts): Promise<T>;

    /**
     * Set DID provider
     * @param provider - DID provider instance
     */
    setDIDProvider (provider: DIDProvider): Promise<void>;

    /**
     * Closes Ceramic instance
     */
    close(): Promise<void>; // gracefully close the ceramic instance
}
