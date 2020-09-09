import jsonpatch from 'fast-json-patch'

import { encode as base64Encode } from '@ethersproject/base64'
import { randomBytes } from '@ethersproject/random'

import { DID } from 'dids'
import { Doctype, DoctypeConstructor, DoctypeStatic, DocOpts, DocParams } from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = 'tile'

/**
 * Tile doctype parameters
 */
export interface TileParams extends DocParams {
    content?: object;
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

        const updateRecord = await TileDoctype._makeRecord(this, this.context.did, params.content, params.metadata?.schema)
        const updated = await this.context.api.applyRecord(this.id, updateRecord, opts)
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
        const record = await TileDoctype.makeGenesis({ content, metadata }, context, opts)
        return context.api.createDocumentFromGenesis<TileDoctype>(record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async makeGenesis(params: DocParams, context?: Context, opts: DocOpts = {}): Promise<Record<string, any>> {
        if (!context.did || !context.did.authenticated) {
            throw new Error('No DID authenticated')
        }

        const metadata = params.metadata? params.metadata : { owners: [] }

        let unique: string
        if (metadata.isUnique) {
            unique = base64Encode(randomBytes(12))
        }

        const { owners } = metadata
        if (!owners || owners.length === 0) {
            metadata.owners = [context.did.id]
        }

        const { content } = params
        const record = { doctype: DOCTYPE, data: content, header: metadata, unique }
        return TileDoctype._signDagJWS(record, context.did)
    }

    /**
     * Make change record
     * @param doctype - Tile doctype instance
     * @param did - DID instance
     * @param newContent - New context
     * @param schema - New schema ID
     * @private
     */
    static async _makeRecord(doctype: Doctype, did: DID, newContent: any, schema?: string): Promise<any> {
        if (did == null || !did.authenticated) {
            throw new Error('No DID authenticated')
        }

        const header: Record<string, any> = {}
        if (schema) {
            header.schema = schema
        }

        if (newContent == null) {
            newContent = doctype.content
        }

        const patch = jsonpatch.compare(doctype.content, newContent)
        const record = { header, data: patch, prev: doctype.head, id: doctype.state.log[0] }
        return TileDoctype._signDagJWS(record, did)
    }

    /**
     * Sign Tile record
     * @param did - DID instance
     * @param record - Record to be signed
     * @private
     */
    static async _signDagJWS(record: any, did: DID): Promise<any> {
        if (did == null || !did.authenticated) {
            throw new Error('No user authenticated')
        }
        return did.createDagJWS(record)
    }

}

