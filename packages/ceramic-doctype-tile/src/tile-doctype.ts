import jsonpatch from 'fast-json-patch'

import { encode as base64Encode } from '@ethersproject/base64'
import { randomBytes } from '@ethersproject/random'

import { Doctype, DoctypeConstructor, DoctypeStatic, InitOpts } from "@ceramicnetwork/ceramic-common/lib/doctype"
import { Context } from "@ceramicnetwork/ceramic-common/lib/context"
import User from "@ceramicnetwork/ceramic-common/lib/user"

const DOCTYPE = 'tile'

/**
 * Tile doctype parameters
 */
export interface TileParams {
    content: object;
    owners?: Array<string>;
}

/**
 * Tile doctype implementation
 */
@DoctypeStatic<DoctypeConstructor<TileDoctype>>()
export class TileDoctype extends Doctype {

    /**
     * Change existing Tile doctype
     * @param params - Change parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    async change(params: TileParams, context: Context, opts?: InitOpts): Promise<Doctype> {
        if (context.user == null) {
            throw new Error('No user authenticated')
        }

        const updateRecord = await TileDoctype._makeRecord(this, context.user, params.content)
        return await context.api.applyRecord(this.id, updateRecord, opts)
    }

    /**
     * Create Tile doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: TileParams, context: Context, opts?: InitOpts): Promise<TileDoctype> {
        if (context.user == null) {
            throw new Error('No user authenticated')
        }

        const { content, owners } = params
        const record = await TileDoctype.makeGenesis({ content, owners }, context, opts)
        return context.api.createDocumentFromGenesis(record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async makeGenesis(params: Record<string, any>, context?: Context, opts: InitOpts = {}): Promise<Record<string, any>> {
        if (!context.user) {
            throw new Error('No user authenticated')
        }

        let { owners } = params
        const { content } = params

        if (!owners) {
            owners = [context.user.DID]
        }

        let unique: string
        if (opts.isUnique) {
            unique = base64Encode(randomBytes(12))
        }

        const record = { doctype: DOCTYPE, owners, content, unique }
        return TileDoctype._signRecord(record, context.user)
    }

    /**
     * Change existing Tile doctype
     * @param doctype - Tile doctype instance
     * @param params - Change parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async change(doctype: Doctype, params: TileParams, context: Context, opts?: InitOpts): Promise<TileDoctype> {
        if (context.user == null) {
            throw new Error('No user authenticated')
        }

        const updateRecord = await TileDoctype._makeRecord(doctype, context.user, params.content)
        return await context.api.applyRecord(doctype.id, updateRecord, opts)
    }

    /**
     * Make change record
     * @param doctype - Tile doctype instance
     * @param user - User instance
     * @param newContent - New context
     * @private
     */
    static async _makeRecord(doctype: Doctype, user: User, newContent: any): Promise<Doctype> {
        if (user == null) {
            throw new Error('No user authenticated')
        }

        const patch = jsonpatch.compare(doctype.content, newContent)
        const record: any = { owners: doctype.owners, content: patch, prev: doctype.head, id: doctype.state.log[0] }
        record.iss = user.DID
        // convert CID to string for signing
        const tmpPrev = record.prev
        const tmpId = record.id
        record.prev = { '/': tmpPrev.toString() }
        record.id = { '/': tmpId.toString() }
        const jwt = await user.sign(record, { useMgmt: true})
        const [header, payload, signature] = jwt.split('.') // eslint-disable-line @typescript-eslint/no-unused-vars
        record.prev = tmpPrev
        record.id = tmpId

        return { ...record, header, signature }
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

