import type CID from 'cids'
import { validateLink } from "@ceramicnetwork/blockchain-utils-validation"
import { Caip10LinkDoctype, Caip10LinkParams } from "@ceramicnetwork/doctype-caip10-link"
import {
    AnchorStatus,
    DocState,
    DoctypeConstructor,
    DoctypeHandler,
    DocOpts,
    SignatureStatus,
    CommitType,
    CeramicCommit,
    AnchorCommit,
    Context
} from "@ceramicnetwork/common"

const IPFS_GET_TIMEOUT = 60000 // 1 minute

export class Caip10LinkDoctypeHandler implements DoctypeHandler<Caip10LinkDoctype> {
    /**
     * Gets doctype name
     */
    get name(): string {
        return Caip10LinkDoctype.DOCTYPE_NAME
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
     * @param commit - Commit to be applied
     * @param cid - Commit CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    async applyCommit(commit: CeramicCommit, cid: CID, context: Context, state?: DocState): Promise<DocState> {
        if (state == null) {
            return this._applyGenesis(commit, cid)
        }

        if ((commit as AnchorCommit).proof) {
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
        const state = {
            doctype: Caip10LinkDoctype.DOCTYPE_NAME,
            content: null,
            next: {
                content: null
            },
            metadata: commit.header,
            signature: SignatureStatus.GENESIS,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            log: [{ cid, type: CommitType.GENESIS }]
        }

        if (!(state.metadata.controllers && state.metadata.controllers.length === 1)) {
            throw new Error('Exactly one controller must be specified')
        }

        return state
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
        let validProof = null
        try {
          validProof = await validateLink(commit.data)
        } catch (e) {
          throw new Error("Error while validating link proof for caip10-link signed commit: " + e.toString())
        }
        if (!validProof) {
            throw new Error('Invalid proof for signed commit')
        }

        if (state.signature !== SignatureStatus.GENESIS && (
          (
            state.anchorStatus === AnchorStatus.ANCHORED &&
            validProof.timestamp < state.anchorProof.blockTimestamp
          ) || (
            state.anchorStatus !== AnchorStatus.ANCHORED &&
            validProof.timestamp < state.next.metadata.lastUpdate
          )
        )) {
          throw new Error('Invalid commit, proof timestamp too old')
        }

        // TODO: handle CAIP-10 addresses in proof generation of 3id-blockchain-utils
        const account = validProof.account || validProof.address
        let [address, chainId] = account.split('@')  // eslint-disable-line prefer-const

        const addressCaip10 = [address, chainId].join('@')
        if (addressCaip10.toLowerCase() !== state.metadata.controllers[0].toLowerCase()) {
            throw new Error("Address doesn't match document controller")
        }
        state.log.push({ cid, type: CommitType.SIGNED })
        return {
            ...state,
            signature: SignatureStatus.SIGNED,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            next: {
                content: validProof.did,
                metadata: {
                  ...state.metadata,
                  lastUpdate: validProof.timestamp // in case there are two updates after each other
                }
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
        const proof = (await context.ipfs.dag.get(commit.proof, { timeout: IPFS_GET_TIMEOUT })).value;

        const supportedChains = await context.api.getSupportedChains()
        if (!supportedChains.includes(proof.chainId)) {
            throw new Error("Anchor proof chainId '" + proof.chainId
                + "' is not supported. Supported chains are: '"
                + supportedChains.join("', '") + "'")
        }

        state.log.push({ cid, type: CommitType.ANCHOR })
        let content = state.content
        if (state.next?.content) {
            content = state.next.content
        }

        delete state.next
        delete state.anchorScheduledFor

        return {
            ...state,
            content,
            anchorStatus: AnchorStatus.ANCHORED,
            anchorProof: proof,
        }
    }

}
