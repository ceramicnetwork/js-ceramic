import CID from "cids";

import { EventEmitter } from "events";
import { AnchorProof } from "./doctype"
import { CeramicApi } from "./ceramic-api"
import DocID from "@ceramicnetwork/docid";

/**
 * Describes anchoring service behavior
 */
export abstract class AnchorService extends EventEmitter {

    /**
     * Performs whatever initialization work is required by the specific anchor service implementation
     */
    abstract init(): Promise<void>;

    /**
     * Set Ceramic API instance
     *
     * @param ceramic - Ceramic API used for various purposes
     */
    abstract set ceramic(ceramic: CeramicApi);

    /**
     * Request anchor commit on blockchain
     * @param docId - Document ID
     * @param tip - CID tip
     */
    abstract requestAnchor(docId: DocID, tip: CID): Promise<void>;

    /**
     * Validate anchor proof commit
     * @param anchorProof - Proof of blockchain inclusion
     */
    abstract validateChainInclusion(anchorProof: AnchorProof): Promise<void>;

    /**
     * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
     * anchor service.
     */
    abstract getSupportedChains(): Promise<Array<string>>;

}
