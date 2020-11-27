import jsonpatch from 'fast-json-patch'

import { encode as base64Encode } from '@ethersproject/base64'
import { randomBytes } from '@ethersproject/random'

import { DID } from 'dids'
import {
    Doctype,
    DoctypeConstructor,
    DoctypeStatic,
    DocOpts,
    DocParams,
    Context,
} from "@ceramicnetwork/common"

const DOCTYPE = 'tile'

/**
 * Tile doctype parameters
 */
export interface TileParams extends DocParams {
    content?: Record<string, unknown>;
}

/**
 * Tile doctype implementation
 */
@DoctypeStatic<DoctypeConstructor<TileDoctype>>()
export class TileDoctype extends Doctype {

    /**
     * Change existing Tile doctype
     * @param params - Change parameters
     * @param opts - Initialization options
     */
    async change(params: TileParams, opts: DocOpts = {}): Promise<void> {
        if (this.context.did == null) {
            throw new Error('No DID authenticated')
        }

        if ('chainId' in params && params.chainId != this.metadata.chainId) {
            throw new Error("Updating chainId is not currently supported. Current chainId: " + this.metadata.chainId + ", requested chainId: " + params.chainId)
        }

        const updateRecord = await TileDoctype._makeRecord(this, this.context.did, params.content, params.metadata?.controllers, params.metadata?.schema)
        const updated = await this.context.api.applyRecord(this.id.toString(), updateRecord, opts)
        this.state = updated.state
    }

    /**
     * Create Tile doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: TileParams, context: Context, opts?: DocOpts): Promise<TileDoctype> {
        if (context.did == null) {
            throw new Error('No DID authenticated')
        }

        const { content, metadata } = params
        const record = await TileDoctype.makeGenesis({ content, metadata }, context)
        return context.api.createDocumentFromGenesis<TileDoctype>(DOCTYPE, record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     */
    static async makeGenesis(params: DocParams, context: Context): Promise<Record<string, any>> {
        const metadata = params.metadata? params.metadata : { controllers: [] }

        // check for DID and authentication
        if (!context.did || !context.did.authenticated) {
            throw new Error('No DID authenticated')
        }

        if (!('chainId' in metadata)) {
            metadata.chainId = context.preferredChainId // set to preferred one
        }

        const supportedChains = await context.api.getSupportedChains()
        if (!supportedChains.includes(metadata.chainId)) {
            throw new Error("Requested chainId '" + metadata.chainId + "' is not supported. Supported chains are: '" + supportedChains.join("', '") + "'")
        }

        let unique: string
        if (params.deterministic) {
            unique = '0'
        } else {
            // If 'deterministic' is undefined, default to creating document uniquely
            unique = base64Encode(randomBytes(12))
        }

        const { controllers } = metadata
        if (!controllers || controllers.length === 0) {
            metadata.controllers = [context.did.id]
        }

        const { content } = params
        const record = { data: content, header: metadata, unique }
        return content ? TileDoctype._signDagJWS(record, context.did, metadata.controllers[0]) : record
    }

    /**
     * Make change record
     * @param doctype - Tile doctype instance
     * @param did - DID instance
     * @param newContent - New context
     * @param newControllers - New controllers
     * @param schema - New schema ID
     * @private
     */
    static async _makeRecord(doctype: Doctype, did: DID, newContent: any, newControllers?: string[], schema?: string): Promise<any> {
        if (did == null || !did.authenticated) {
            throw new Error('No DID authenticated')
        }

        const header: Record<string, any> = {}
        if (schema) {
            header.schema = schema
        }

        if (newControllers) {
            header.controllers = newControllers
        }

        const nonce = TileDoctype._calculateNonce(doctype)
        if (nonce != null) {
            header.nonce = nonce
        }

        if (newContent == null) {
            newContent = doctype.content
        }

        const patch = jsonpatch.compare(doctype.content, newContent)

        const willSquash = header.nonce && header.nonce > 0
        const prev = doctype.state.log[doctype.state.log.length - 1 - (willSquash ? 1 : 0)].cid

        const record = { header, data: patch, prev, id: doctype.state.log[0].cid }
        return TileDoctype._signDagJWS(record, did, doctype.controllers[0])
    }

    /**
     * Calculates anchor nonce
     */
    private static _calculateNonce(doctype: Doctype): number {
        // if there hasn't been any update prior to this we should set the nonce to 0
        if (!doctype.state.next) {
            return null
        }
        // get the current nonce and increment it by one
        return (doctype.state.next.metadata?.nonce || 0) + 1
    }

    /**
     * Sign Tile record
     * @param did - DID instance
     * @param record - Record to be signed
     * @param controller - Controller
     * @private
     */
    static async _signDagJWS(record: any, did: DID, controller: string): Promise<any> {
        if (did == null || !did.authenticated) {
            throw new Error('No user authenticated')
        }
        return did.createDagJWS(record, { did: controller })
    }

}
