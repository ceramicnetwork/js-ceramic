import CID from 'cids'

import * as didJwt from 'did-jwt'

import jsonpatch from 'fast-json-patch'

import { VerifiableCredentialDoctype, VerifiableCredentialParams } from "./verifiable-credential-doctype"
import {
    AnchorProof, AnchorRecord, AnchorStatus, DocState, DoctypeConstructor, DoctypeHandler, InitOpts, SignatureStatus
} from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = 'verifiable-credential'

/**
 * Verifiable credential doctype handler implementation
 */
export class VerifiableCredentialDoctypeHandler implements DoctypeHandler<VerifiableCredentialDoctype> {

    /**
     * Gets doctype name
     */
    get name(): string {
        return DOCTYPE
    }

    /**
     * Gets doctype class
     */
    get doctype(): DoctypeConstructor<VerifiableCredentialDoctype> {
        return VerifiableCredentialDoctype
    }

    /**
     * Create new verifiable credential doctype instance
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization option
     */
    async create(params: VerifiableCredentialParams, context: Context, opts?: InitOpts): Promise<VerifiableCredentialDoctype> {
        return VerifiableCredentialDoctype.create(params, context, opts)
    }

    /**
     * Applies record (genesis|signed|anchor)
     * @param record - Record
     * @param cid - Record CID
     * @param context - Ceramic context
     * @param state - Document state
     */
    async applyRecord(record: any, cid: CID, context: Context, state?: DocState): Promise<DocState> {
        if (state == null) {
            // apply genesis
            return this._applyGenesis(record, cid, context)
        }

        if (record.proof) {
            const proofRecord = (await context.ipfs.dag.get(record.proof)).value;
            return this._applyAnchor(record, proofRecord, cid, state)
        }

        return this._applySigned(record, cid, state, context)
    }

    /**
     * Applies Genesis record
     * @param record - Genesis record
     * @param cid - Genesis record CID
     * @param context - Ceramic context
     */
    async _applyGenesis(record: any, cid: CID, context: Context): Promise<DocState> {
        await this._verifyRecordSignature(record, context)
        // TODO - verify genesis record
        return {
            doctype: DOCTYPE,
            owners: record.owners,
            content: record.content,
            nextContent: null,
            signature: SignatureStatus.SIGNED,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            log: [cid]
        }
    }

    /**
     * Applies signed record
     * @param record - Signed record
     * @param cid - Signed record CID
     * @param state - Document state
     * @param context - Ceramic context
     */
    async _applySigned(record: any, cid: CID, state: DocState, context: Context): Promise<DocState> {
        if (!record.id.equals(state.log[0])) {
            throw new Error(`Invalid docId ${record.id}, expected ${state.log[0]}`)
        }

        await this._verifyRecordSignature(record, context)
        state.log.push(cid)

        return {
            ...state,
            signature: SignatureStatus.SIGNED,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            nextContent: jsonpatch.applyPatch(state.content, record.content).newDocument
        }
    }

    /**
     * Applies anchor record
     * @param record - Anchor record
     * @param proof - Anchor record proof
     * @param cid - Anchor record CID
     * @param state - Document state
     */
    async _applyAnchor(record: AnchorRecord, proof: AnchorProof, cid: CID, state: DocState): Promise<DocState> {
        state.log.push(cid)
        let content = state.content
        if (state.nextContent) {
            content = state.nextContent
            delete state.nextContent
        }

        let owners = state.owners
        if (state.nextOwners) {
            owners = state.nextOwners
            delete state.nextOwners
        }

        return {
            ...state,
            owners,
            content,
            anchorStatus: AnchorStatus.ANCHORED,
            anchorProof: proof
        }

    }

    /**
     * Verifies record signature
     * @param record - Record to be verified
     * @param context - Ceramic context
     */
    async _verifyRecordSignature(record: any, context: Context): Promise<void> {
        const { header, signature } = record
        delete record.header
        delete record.signature
        let payload = Buffer.from(JSON.stringify({
            doctype: record.doctype,
            owners: record.owners,
            content: record.content,
            prev: record.prev ? { '/': record.prev.toString() } : undefined,
            id: record.id ? { '/': record.id.toString() } : undefined
        })).toString('base64')
        payload = payload.replace(/=/g, '')
        const jwt = [header, payload, signature].join('.')
        try {
            await this.verifyJWT(jwt, { resolver: context.resolver })
        } catch (e) {
            throw new Error('Invalid signature for signed record:' + e)
        }
    }

    /**
     * Verifies JWT token
     * @param jwt - JWT token
     * @param opts - verification options
     */
    async verifyJWT(jwt: string, opts: any): Promise<void> {
        await didJwt.verifyJWT(jwt, opts)
    }
}
