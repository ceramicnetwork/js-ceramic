import CID from "cids";

import { EventEmitter } from "events";
import { AnchorProof } from "./doctype"
import { CeramicApi } from "./ceramic-api"

/**
 * Describes anchoring service behavior
 */
export abstract class AnchorService extends EventEmitter {

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
    abstract requestAnchor(docId: string, tip: CID): Promise<void>;

    /**
     * Validate anchor proof commit
     * @param anchorProof - Anchor proof commit
     */
    abstract validateChainInclusion(anchorProof: AnchorProof): Promise<void>;

    /**
     * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
     * anchor service.
     */
    abstract getSupportedChains(): Promise<Array<string>>;

}
