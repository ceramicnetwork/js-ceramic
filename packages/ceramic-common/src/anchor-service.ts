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
     * Request anchor record on blockchain
     * @param docId - Document ID
     * @param head - CID head
     */
    abstract requestAnchor(docId: string, head: CID): Promise<void>;

    /**
     * Validate anchor proof record
     * @param anchorProof - Anchor proof record
     */
    abstract validateChainInclusion(anchorProof: AnchorProof): Promise<void>;

}
