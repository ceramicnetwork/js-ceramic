import CID from 'cids'

import type Ipfs from 'ipfs'
import { Doctype, DoctypeHandler, InitOpts } from "./doctype"
import { Context } from "./context"

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
    ipfs: Ipfs.Ipfs;

    /**
     * Register Doctype handler
     * @param doctypeHandler - DoctypeHandler instance
     */
    addDoctype<T extends Doctype>(doctypeHandler: DoctypeHandler<T>): void;

    /**
     * Create Doctype instance
     * @param doctype - Doctype name
     * @param params - Create parameters
     * @param opts - Initialization options
     */
    create<T extends Doctype>(doctype: string, params: object, opts?: InitOpts): Promise<T>;

    /**
     * Create Doctype from genesis record
     * @param genesis - Genesis record
     * @param opts - Initialization options
     */
    createFromGenesis<T extends Doctype>(genesis: any, opts?: InitOpts): Promise<T>;

    /**
     * Loads Doctype instance
     * @param docId - Document ID
     * @param opts - Initialization options
     */
    load<T extends Doctype>(docId: string, opts?: InitOpts): Promise<T>;

    /**
     * Applies record on the existing document
     * @param docId - Document ID
     * @param record - Record to be applied
     * @param opts - Initialization options
     */
    applyRecord<T extends Doctype>(docId: string, record: object, opts?: InitOpts): Promise<T>;

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
