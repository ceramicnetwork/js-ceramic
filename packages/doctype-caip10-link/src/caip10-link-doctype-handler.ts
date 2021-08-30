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
     * Applies commit (genesis|signed|anchor)
     * @param commit - Record to be applied
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    async applyCommit(commit: any, cid: CID, context: Context, state?: DocState): Promise<DocState> {
        if (state == null) {
            return this._applyGenesis(commit, cid)
        }

        if (commit.proof) {
            return this._applyAnchor(context, commit, cid, state);
        }

        return this._applySigned(commit, cid, state);
    }

    /**
     * Applies genesis commit
     * @param commit - Genesis commit
     * @param cid - Genesis commit CID
     * @private
     */
    async _applyGenesis (commit: any, cid: CID): Promise<DocState> {
        // TODO - verify genesis commit
        return {
            doctype: DOCTYPE,
            content: null,
            next: {
                content: null
            },
            metadata: commit.header,
            signature: SignatureStatus.GENESIS,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            log: [{ cid, type: RecordType.GENESIS }]
        }
    }

    /**
     * Applies signed commit
     * @param commit - Signed commit
     * @param cid - Signed commit CID
     * @param state - Document state
     * @private
     */
    async _applySigned (commit: any, cid: CID, state: DocState): Promise<DocState> {
        // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
        const validProof = await validateLink(commit.data)
        if (!validProof) {
            throw new Error('Invalid proof for signed commit')
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
     * Applies anchor commit
     * @param context - Ceramic context
     * @param commit - Anchor commit
     * @param cid - Anchor commit CID
     * @param state - Document state
     * @private
     */
    async _applyAnchor (context: Context, commit: any, cid: CID, state: DocState): Promise<DocState> {
        // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
        const proof = (await context.ipfs.dag.get(commit.proof)).value;
        if (proof.chainId != state.metadata.chainId) {
            throw new Error("Anchor commit with cid '" + cid.toString() +
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
