import CID from "cids";

import { AnchorProof } from "../document";
import {EventEmitter} from "events";

export default interface AnchorService extends EventEmitter {

    /**
     * Request anchor record on blockchain
     * @param docId - Document ID
     * @param head - CID head
     */
    requestAnchor(docId: string, head: CID): Promise<void>;

    /**
     * Validate anchor proof record
     * @param proof - Anchor proof record
     */
    validateChainInclusion (proof: AnchorProof): Promise<void>;

}