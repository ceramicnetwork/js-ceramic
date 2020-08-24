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
        if (this.context.user == null) {
            throw new Error('No user authenticated')
        }

        const updateRecord = await TileDoctype._makeRecord(this, this.context.user, params.content, params.metadata?.schema)
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
        if (context.user == null) {
            throw new Error('No user authenticated')
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
        if (!context.user || !context.user.authenticated) {
            throw new Error('No user authenticated')
        }

        const metadata = params.metadata? params.metadata : { owners: [] }

        let unique: string
        if (metadata.isUnique) {
            unique = base64Encode(randomBytes(12))
        }

        const { owners } = metadata
        if (!owners || owners.length === 0) {
            metadata.owners = [context.user.DID]
        }

        const { content } = params
        const record = { doctype: DOCTYPE, data: content, header: metadata, unique }
        return TileDoctype._signRecord(record, context.user)
    }

    /**
     * Make change record
     * @param doctype - Tile doctype instance
     * @param user - User instance
     * @param newContent - New context
     * @param schema - New schema ID
     * @private
     */
    static async _makeRecord(doctype: Doctype, user: DID, newContent: any, schema?: string): Promise<Doctype> {
        if (user == null || !user.authenticated) {
            throw new Error('No user authenticated')
        }

        const header = doctype.metadata
        if (schema) {
            header.schema = schema
        }

        if (newContent == null) {
            newContent = doctype.content
        }

        const patch = jsonpatch.compare(doctype.content, newContent)
        const record = { data: patch, header, prev: doctype.head, id: doctype.state.log[0] }
        return TileDoctype._signRecord(record, user)
    }

    /**
     * Sign Tile record
     * @param user - User instance
     * @param record - Record to be signed
     * @private
     */
    static async _signRecord(record: any, user: DID): Promise<any> {
        if (user == null || !user.authenticated) {
            throw new Error('No user authenticated')
        }
        // TODO - use the dag-jose library for properly encoded signed records
        // convert CID to string for signing
        const tmpCID = record.prev
        const tmpId = record.id
        if (tmpCID) {
            record.prev = { '/': tmpCID.toString() }
        }
        if (tmpId) {
            record.id = { '/': tmpId.toString() }
        }

        const jws = await user.createJWS(JSON.parse(JSON.stringify(record)))
        const [signedHeader, payload, signature] = jws.split('.') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (tmpCID) {
            record.prev = tmpCID
        }
        if (tmpId) {
            record.id = tmpId
        }
        return { ...record, signedHeader, signature }
    }

}

