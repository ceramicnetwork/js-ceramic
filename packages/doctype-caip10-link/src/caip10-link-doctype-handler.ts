import CID from 'cids'
import { validateLink } from "3id-blockchain-utils"
import { Caip10LinkDoctype, Caip10LinkParams } from "./caip10-link-doctype"
import {
    AnchorProof, AnchorStatus, DocState, DoctypeConstructor, DoctypeHandler, DocOpts, SignatureStatus, RecordType
} from "@ceramicnetwork/common"
import { Context } from "@ceramicnetwork/common"

const DOCTYPE = 'caip10-link'

export class Caip10LinkDoctypeHandler implements DoctypeHandler<Caip10LinkDoctype> {
    /**
     * Gets doctype name
     */
    get name(): string {
        return DOCTYPE
    }

    /**
     * Gets doctype class
     */
    get doctype(): DoctypeConstructor<Caip10LinkDoctype> {
        return Caip10LinkDoctype
    }

    /**
     * Creates Caip10Link instance
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    async create(params: Caip10LinkParams, context: Context, opts?: DocOpts): Promise<Caip10LinkDoctype> {
        return Caip10LinkDoctype.create(params, context, opts);
    }

    /**
     * Applies record (genesis|signed|anchor)
     * @param record - Record to be applied
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    async applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState> {
        if (state == null) {
            return this._applyGenesis(record, cid)
        }

        if (record.proof) {
            return this._applyAnchor(context, record, cid, state);
        }

        return this._applySigned(record, cid, state);
    }

    /**
     * Applies genesis record
     * @param record - Genesis record
     * @param cid - Genesis record CID
     * @private
     */
    async _applyGenesis (record: any, cid: CID): Promise<DocState> {
        // TODO - verify genesis record
        return {
            doctype: DOCTYPE,
            content: null,
            next: {
                content: null
            },
            metadata: record.header,
            signature: SignatureStatus.GENESIS,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            log: [{ cid, type: RecordType.GENESIS }]
        }
    }

    /**
     * Applies signed record
     * @param record - Signed record
     * @param cid - Signed record CID
     * @param state - Document state
     * @private
     */
    async _applySigned (record: any, cid: CID, state: DocState): Promise<DocState> {
        // TODO: Assert that the 'prev' of the record being applied is the end of the log in 'state'
        const validProof = await validateLink(record.data)
        if (!validProof) {
            throw new Error('Invalid proof for signed record')
        }

        // TODO: handle CAIP-10 addresses in proof generation of 3id-blockchain-utils
        const account = validProof.account || validProof.address
        let [address, chainId] = account.split('@')  // eslint-disable-line prefer-const

        const addressCaip10 = [address, chainId].join('@')
        if (addressCaip10.toLowerCase() !== state.metadata.controllers[0].toLowerCase()) {
            throw new Error("Address doesn't match document controller")
        }
        state.log.push({ cid, type: RecordType.SIGNED })
        return {
            ...state,
            signature: SignatureStatus.SIGNED,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            next: {
                content: validProof.did
            }
        }
    }

    /**
     * Applies anchor record
     * @param context - Ceramic context
     * @param record - Anchor record
     * @param cid - Anchor record CID
     * @param state - Document state
     * @private
     */
    async _applyAnchor (context: Context, record: any, cid: CID, state: DocState): Promise<DocState> {
        // TODO: Assert that the 'prev' of the record being applied is the end of the log in 'state'
        const proof = (await context.ipfs.dag.get(record.proof)).value;
        if (proof.chainId != state.metadata.chainId) {
            throw new Error("Anchor record with cid '" + cid.toString() +
                "' on caip10-link document with DocID '" + state.log[0].cid.toString() +
                "' is on chain '" + proof.chainId +
                "' but this document is configured to be anchored on chain '" +
                state.metadata.chainId + "'")
        }

        state.log.push({ cid, type: RecordType.ANCHOR })
        let content = state.content
        if (state.next?.content) {
            content = state.next.content
            delete state.next.content
        }
        return {
            ...state,
            content,
            anchorStatus: AnchorStatus.ANCHORED,
            anchorProof: proof,
        }
    }

}
