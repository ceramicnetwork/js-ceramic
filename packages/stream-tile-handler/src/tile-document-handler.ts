import type CID from 'cids'

import type { DIDResolutionResult } from 'did-resolver'

import jsonpatch from 'fast-json-patch'
import cloneDeep from 'lodash.clonedeep'

import { TileDocument } from "@ceramicnetwork/stream-tile"
import {
    AnchorStatus,
    Context,
    StreamState,
    CommitType,
    StreamConstructor,
    StreamHandler,
    StreamUtils,
    SignatureStatus,
    CeramicCommit,
    AnchorCommit,
} from "@ceramicnetwork/common"

const IPFS_GET_TIMEOUT = 60000 // 1 minute

/**
 * TileDocument stream handler implementation
 */
export class TileDocumentHandler implements StreamHandler<TileDocument> {
    get type(): number {
      return TileDocument.STREAM_TYPE_ID
    }

    get name(): string {
        return TileDocument.STREAM_TYPE_NAME
    }

    get stream_constructor(): StreamConstructor<TileDocument> {
        return TileDocument
    }

    /**
     * Applies commit (genesis|signed|anchor)
     * @param commit - Commit
     * @param cid - Commit CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    async applyCommit(commit: CeramicCommit, cid: CID, context: Context, state?: StreamState): Promise<StreamState> {
        if (state == null) {
            // apply genesis
            return this._applyGenesis(commit, cid, context)
        }

        if ((commit as AnchorCommit).proof) {
            return this._applyAnchor(context, commit as AnchorCommit, cid, state);
        }

        return this._applySigned(commit, cid, state, context)
    }

    /**
     * Applies genesis commit
     * @param commit - Genesis commit
     * @param cid - Genesis commit CID
     * @param context - Ceramic context
     * @private
     */
    async _applyGenesis(commit: any, cid: CID, context: Context): Promise<StreamState> {
        let payload = commit
        const isSigned = StreamUtils.isSignedCommit(commit)
        if (isSigned) {
            payload = (await context.ipfs.dag.get(commit.link, { timeout: IPFS_GET_TIMEOUT })).value
            await this._verifySignature(commit, context, payload.header.controllers[0])
        } else if (payload.data) {
            throw Error('Genesis commit with contents should always be signed')
        }

        if (!(payload.header.controllers && payload.header.controllers.length === 1)) {
            throw new Error('Exactly one controller must be specified')
        }

        return {
            type: TileDocument.STREAM_TYPE_ID,
            content: payload.data || {},
            metadata: payload.header,
            signature: isSigned? SignatureStatus.SIGNED : SignatureStatus.GENESIS,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            log: [{ cid, type: CommitType.GENESIS }]
        }
    }

    /**
     * Applies signed commit
     * @param commit - Signed commit
     * @param cid - Signed commit CID
     * @param state - Document state
     * @param context - Ceramic context
     * @private
     */
    async _applySigned(commit: any, cid: CID, state: StreamState, context: Context): Promise<StreamState> {
        // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
        await this._verifySignature(commit, context, state.metadata.controllers[0])

        const payload = (await context.ipfs.dag.get(commit.link, { timeout: IPFS_GET_TIMEOUT })).value
        if (!payload.id.equals(state.log[0].cid)) {
            throw new Error(`Invalid streamId ${payload.id}, expected ${state.log[0].cid}`)
        }

        if (payload.header.controllers && payload.header.controllers.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        const nextState = cloneDeep(state)

        nextState.signature = SignatureStatus.SIGNED
        nextState.anchorStatus = AnchorStatus.NOT_REQUESTED

        nextState.log.push({ cid, type: CommitType.SIGNED })

        const content = state.next?.content ?? state.content
        const metadata = state.next?.metadata ?? state.metadata
        nextState.next = {
            content: jsonpatch.applyPatch(content, payload.data).newDocument,
            metadata: {...metadata, ...payload.header}
        }
        return nextState
    }

    /**
     * Applies anchor commit
     * @param context - Ceramic context
     * @param commit - Anchor commit
     * @param cid - Anchor commit CID
     * @param state - Document state
     * @private
     */
    async _applyAnchor(context: Context, commit: AnchorCommit, cid: CID, state: StreamState): Promise<StreamState> {
        // TODO: Assert that the 'prev' of the commit being applied is the end of the log in 'state'
        const proof = (await context.ipfs.dag.get(commit.proof, { timeout: IPFS_GET_TIMEOUT })).value;

        const supportedChains = await context.api.getSupportedChains()
        if (!supportedChains.includes(proof.chainId)) {
            throw new Error("Anchor proof chainId '" + proof.chainId
                + "' is not supported. Supported chains are: '"
                + supportedChains.join("', '") + "'")
        }

        state.log.push({ cid, type: CommitType.ANCHOR, timestamp: proof.blockTimestamp })
        let content = state.content
        let metadata = state.metadata

        if (state.next?.content) {
            content = state.next.content
            delete state.next.content
        }

        if (state.next?.metadata) {
            metadata = state.next.metadata
            delete state.next.metadata
        }

        delete state.next
        delete state.anchorScheduledFor

        return {
            ...state, content, metadata, anchorStatus: AnchorStatus.ANCHORED, anchorProof: proof,
        }
    }

    /**
     * Verifies commit signature
     * @param commit - Commit to be verified
     * @param context - Ceramic context
     * @param did - DID value
     * @private
     */
    async _verifySignature(commit: any, context: Context, did: string): Promise<DIDResolutionResult> {
        let result
        try {
            result = await context.did.verifyJWS(commit)
        } catch (e) {
            throw new Error('Invalid signature for signed commit. ' + e)
        }
        const { kid, didResolutionResult } = result
        // TODO - this needs to be changed to support NFT dids
        // and the did-core "controller" property in general.
        if (!kid.startsWith(did)) {
            throw new Error(`Signature was made with wrong DID. Expected: ${did}, got: ${kid}`)
        }
        return didResolutionResult
    }
}
