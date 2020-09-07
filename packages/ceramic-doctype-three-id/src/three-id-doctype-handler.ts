import CID from 'cids'
import base64url from 'base64url'
import stringify from 'fast-json-stable-stringify'

import jsonpatch from 'fast-json-patch'
import * as didJwt from 'did-jwt'
import { ThreeIdDoctype, ThreeIdParams } from "./three-id-doctype"
import {
    AnchorProof, AnchorRecord, AnchorStatus, DocState, DoctypeConstructor, DoctypeHandler, DocOpts, SignatureStatus
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
    async create(params: ThreeIdParams, context: Context, opts?: DocOpts): Promise<ThreeIdDoctype> {
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

        return this._applySigned(record, cid, state, context);
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
                metadata: record.header,
                content: record.data,
                next: {
                    content: null,
                },
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
                metadata: {
                    owners: [managementKey],
                },
                content: {
                    publicKeys: {
                        signing: signingKey, encryption: encryptionKey
                    }
                },
                next: {
                    content: null,
                },
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
     * @param context - Ceramic context
     * @private
     */
    async _applySigned(record: any, cid: CID, state: DocState, context: Context): Promise<DocState> {
        await this._verifySignature(record, context)

        const payload = (await context.ipfs.dag.get(record.link)).value
        if (!payload.id.equals(state.log[0])) {
            throw new Error(`Invalid docId ${payload.id}, expected ${state.log[0]}`)
        }
        state.log.push(cid)
        return {
            ...state,
            signature: SignatureStatus.SIGNED,
            anchorStatus: AnchorStatus.NOT_REQUESTED,
            next: {
                owners: payload.header.owners,
                content: jsonpatch.applyPatch(state.content, payload.data).newDocument,
            },
        }
    }

    /**
     * Verifies record signature
     * @param record - Record to be verified
     * @param context - Ceramic context
     * @private
     */
    async _verifySignature(record: any, context: Context): Promise<void> {
        const { payload, signatures } = record
        const { signature,  protected: _protected } = signatures[0]

        const decodedHeader = JSON.parse(base64url.decode(_protected))
        const { kid } = decodedHeader

        const jws = [_protected, payload, signature].join('.')
        const { publicKey } = await context.resolver.resolve(kid)
        try {
            await this.verifyJWS(jws, publicKey)
        } catch (e) {
            throw new Error('Invalid signature for signed record. ' + e)
        }
    }

    /**
     * Verifies JWS token
     * @param jwt - JWS token
     * @param pubkeys - public key(s)
     */
    async verifyJWS(jwt: string, pubkeys: any): Promise<void> {
        await didJwt.verifyJWS(jwt, pubkeys)
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
        if (state.next?.content) {
            content = state.next.content
            delete state.next.content
        }
        let owners = state.metadata?.owners
        if (state.next?.owners) {
            owners = state.next.owners
            delete state.next.owners
        }
        return {
            ...state,
            metadata: {
                owners
            },
            content,
            anchorStatus: AnchorStatus.ANCHORED,
            anchorProof: proof,
        }
    }

}
