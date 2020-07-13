import CID from 'cids'

import { DIDDocument } from 'did-resolver'

import { wrapDocument } from '@ceramicnetwork/3id-did-resolver'
import jsonpatch from 'fast-json-patch'
import * as didJwt from 'did-jwt'
import { ThreeIdDoctype, ThreeIdParams } from "./three-id-doctype"
import {
    AnchorProof, AnchorRecord, AnchorStatus, DocState, DoctypeConstructor, DoctypeHandler, InitOpts, SignatureStatus
} from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = '3id'

/**
 * ThreeId doctype handler implementation
 */
export class ThreeIdDoctypeHandler implements DoctypeHandler<ThreeIdDoctype> {
    /**
     * Gets doctype name
     */
    get name(): string {
        return DOCTYPE
    }

    /**
     * Gets doctype class
     */
    get doctype(): DoctypeConstructor<ThreeIdDoctype> {
        return ThreeIdDoctype
    }

    /**
     * Creates ThreeId doctype instance
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    async create(params: ThreeIdParams, context: Context, opts?: InitOpts): Promise<ThreeIdDoctype> {
        return ThreeIdDoctype.create(params, context, opts);
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
            // apply genesis
            return this._applyGenesis(record, cid)
        }

        if (record.proof) {
            const proofRecord = (await context.ipfs.dag.get(record.proof)).value;
            return this._applyAnchor(record, proofRecord, cid, state);
        }

        return this._applySigned(record, cid, state);
    }

    /**
     * Applies genesis record
     * @param record - Genesis record
     * @param cid - Genesis record CID
     * @private
     */
    async _applyGenesis(record: any, cid: CID): Promise<DocState> {
        if (record.doctype === DOCTYPE) {
            return {
                doctype: DOCTYPE,
                owners: record.owners,
                content: record.content,
                nextContent: null,
                signature: SignatureStatus.GENESIS,
                anchorStatus: AnchorStatus.NOT_REQUESTED,
                log: [cid]
            }
        } else if (record['@context'] === "https://w3id.org/did/v1") {
            const managementKey = record.publicKey.find((pk: { id: string }) => pk.id === 'did:3:GENESIS#managementKey').ethereumAddress
            const signingKey = record.publicKey.find((pk: { id: string }) => pk.id === 'did:3:GENESIS#signingKey').publicKeyHex
            const encryptionKey = record.publicKey.find((pk: { id: string }) => pk.id === 'did:3:GENESIS#encryptionKey').publicKeyBase64
            return {
                doctype: DOCTYPE,
                owners: [managementKey],
                content: {
                    publicKeys: {
                        signing: signingKey, encryption: encryptionKey
                    }
                },
                nextContent: null,
                signature: SignatureStatus.GENESIS,
                anchorStatus: AnchorStatus.NOT_REQUESTED,
                log: [cid]
            }
        }
        // TODO - verify genesis record
    }

    /**
     * Applies signed record
     * @param record - Signed record
     * @param cid - Signed record CID
     * @param state - Document state
     * @private
     */
    async _applySigned(record: any, cid: CID, state: DocState): Promise<DocState> {
        if (!record.id.equals(state.log[0])) throw new Error(`Invalid docId ${record.id}, expected ${state.log[0]}`)
        // reconstruct jwt
        const { header, signature } = record
        delete record.header
        delete record.signature
        let payload = Buffer.from(JSON.stringify({
            doctype: record.doctype,
            owners: record.owners,
            content: record.content,
            prev: { '/': record.prev.toString() },
            id: { '/': record.id.toString() },
            iss: record.iss
        })).toString('base64')

        payload = payload.replace(/=/g, '')
        const jwt = [header, payload, signature].join('.')
        try {
            // verify the jwt with a fake DID resolver that uses the current state of the 3ID
            const didDoc = wrapDocument({ publicKeys: { signing: state.owners[0], encryption: '' } }, 'did:fake:123')
            await this.verifyJWT(jwt, { resolver: { resolve: async (): Promise<DIDDocument> => didDoc } })
        } catch (e) {
            throw new Error('Invalid signature for signed record:' + e)
        }
        state.log.push(cid)
        return {
            ...state,
            signature: SignatureStatus.SIGNED,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            nextContent: jsonpatch.applyPatch(state.content, record.content).newDocument,
            nextOwners: record.owners
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

    /**
     * Applies anchor record
     * @param record - Anchor record
     * @param proof - Anchor proof record
     * @param cid - Anchor record CID
     * @param state - Document state
     * @private
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
            anchorProof: proof,
        }
    }

}
