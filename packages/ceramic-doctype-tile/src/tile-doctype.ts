import jsonpatch from 'fast-json-patch'

import { encode as base64Encode } from '@ethersproject/base64'
import { randomBytes } from '@ethersproject/random'

import { Doctype, DoctypeConstructor, DoctypeStatic, DocOpts, DocParams } from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"
import { User } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = 'tile'

/**
 * Tile doctype parameters
 */
export interface TileParams extends DocParams {
    content: object;
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

        const updateRecord = await TileDoctype._makeRecord(this, this.context.user, params.content)
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

        const { content, owners } = params
        const record = await TileDoctype.makeGenesis({ content, owners }, context, opts)
        return context.api.createDocumentFromGenesis<TileDoctype>(record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async makeGenesis(params: DocParams, context?: Context, opts: DocOpts = {}): Promise<Record<string, any>> {
        if (!context.user) {
            throw new Error('No user authenticated')
        }

        let unique: string
        if (opts.isUnique) {
            unique = base64Encode(randomBytes(12))
        }

        const metadata = params.metadata? params.metadata : {}
        const { owners } = metadata
        if (!owners) {
            metadata.owners = [context.user.DID]
        }

        const { content } = params
        const record = { doctype: DOCTYPE, data: content, metadata, unique }
        return TileDoctype._signRecord(record, context.user)
    }

    /**
     * Make change record
     * @param doctype - Tile doctype instance
     * @param user - User instance
     * @param newContent - New context
     * @private
     */
    static async _makeRecord(doctype: Doctype, user: User, newContent: any): Promise<Doctype> {
        if (!user) {
            throw new Error('No user authenticated')
        }
        const patch = jsonpatch.compare(doctype.content, newContent)
        const record = { data: patch, metadata: doctype.metadata, prev: doctype.head, id: doctype.state.log[0] }
        return TileDoctype._signRecord(record, user)
    }

    /**
     * Sign Tile record
     * @param user - User instance
     * @param record - Record to be signed
     * @private
     */
    static async _signRecord(record: any, user: User): Promise<any> {
        if (user == null) {
            throw new Error('No user authenticated')
        }
        // TODO - use the dag-jose library for properly encoded signed records
        // The way we use did-jwts right now are quite hacky
        record.iss = user.DID
        // convert CID to string for signing
        const tmpCID = record.prev
        const tmpId = record.id
        if (tmpCID) {
            record.prev = { '/': tmpCID.toString() }
        }
        if (tmpId) {
            record.id = { '/': tmpId.toString() }
        }
        const jwt = await user.sign(record)
        const [header, payload, signature] = jwt.split('.') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (tmpCID) {
            record.prev = tmpCID
        }
        if (tmpId) {
            record.id = tmpId
        }
        return { ...record, header, signature }
    }

}

