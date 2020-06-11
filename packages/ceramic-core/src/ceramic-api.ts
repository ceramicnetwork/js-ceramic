import { Doctype, DoctypeHandler, InitOpts } from "./doctype"

/**
 * Describes Ceramic pinning functionalities
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
    ls(docId?: string): Promise<Array<string>>;
}

/**
 * Describes DID provider instance
 */
export interface DIDProvider {
    send(request: object): void;
}

/**
 * Describes Ceramic node API
 */
export interface CeramicApi {
    ipfs: Ipfs.Ipfs;
    pin: PinApi;

    /**
     * Register Doctype handler
     * @param doctypeHandler - DoctypeHandler instance
     */
    addDoctype(doctypeHandler: DoctypeHandler): void;

    /**
     * Set DID provider
     * @param provider - DID provider instance
     */
    setDIDProvider(provider: DIDProvider): void;

    /**
     * Creates new Doctype instance
     * @param doctype - Doctype type name
     * @param params - Creation parameters
     * @param opts - Initialization options
     */
    create<T extends Doctype>(doctype: string, params: object, opts: InitOpts): Promise<T>;

    /**
     * Loads Doctype instance
     * @param docId - Document ID
     * @param opts - Initialization options
     */
    load<T extends Doctype>(docId: string, opts: InitOpts): Promise<T>;

    /**
     * Applies record on the existing document
     * @param docId - Document ID
     * @param record - Record to be applied
     */
    applyRecord: (docId: string, record: object) => Promise<void>;

    /**
     * Closes Ceramic instance
     */
    close: () => Promise<void>; // gracefully close the ceramic instance
}
