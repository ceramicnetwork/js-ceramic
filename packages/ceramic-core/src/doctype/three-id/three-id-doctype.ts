import CID from 'cids'

import jsonpatch from 'fast-json-patch'

import {
    DocState, Doctype, InitOpts,
} from "../../doctype"
import { Context } from "../../context"
import User from "../../user"

const DOCTYPE = '3id'

/**
 * ThreeId doctype parameters
 */
export class ThreeIdParams {
    content: object;
    owners?: Array<string>;
}

/**
 * ThreeId doctype implementation
 */
export class ThreeIdDoctype implements Doctype {
    id: string;
    content: object
    doctype: string
    head: CID
    owners: string[]
    state: DocState

    /**
     * Change existing ThreeId doctype
     * @param params - Change parameters
     * @param context - Ceramic context
     */
    async change(params: ThreeIdParams, context: Context): Promise<ThreeIdDoctype> {
        return ThreeIdDoctype.change(this, params, context)
    }

    /**
     * Creates ThreeId doctype instance
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: ThreeIdParams, context: Context, opts?: InitOpts): Promise<ThreeIdDoctype> {
        const { content, owners } = params
        if (!owners) {
            throw new Error('The owner of the 3ID needs to be specified')
        }

        const record = await ThreeIdDoctype._makeGenesis(content, owners)
        const threeIdDocType = await context.api.createFromGenesis<ThreeIdDoctype>(record, opts)
        return Promise.resolve(threeIdDocType)
    }

    /**
     * Makes genesis record
     * @param content - Content
     * @param owners - Owners
     */
    static async _makeGenesis(content: any, owners?: Array<string>): Promise<any> {
        if (!owners) {
            throw new Error('The owner of the 3ID needs to be specified')
        }
        return {
            doctype: DOCTYPE, owners, content
        }
    }

    /**
     * Change existing ThreeId doctype
     * @param doctype - Doctype instance
     * @param params - Change parameters
     * @param context - Ceramic context
     */
    static async change(doctype: Doctype, params: ThreeIdParams, context: Context): Promise<ThreeIdDoctype> {
        const { content, owners } = params

        const updateRecord = ThreeIdDoctype._makeRecord(doctype, context.user, content, owners)
        return await context.api.applyRecord(doctype.id, updateRecord)
    }

    /**
     * Creates change record
     * @param doctype - Doctype instance
     * @param user - User instance
     * @param newContent - New context
     * @param newOwners - New owners
     * @private
     */
    static async _makeRecord(doctype: Doctype, user: User, newContent: any, newOwners?: string[]): Promise<any> {
        if (user == null) {
            throw new Error('No user authenticated')
        }

        if (typeof newContent == null) {
            newContent = doctype.state.content
        }

        const patch = jsonpatch.compare(doctype.state.content, newContent)
        const record: any = { owners: newOwners, content: patch, prev: doctype.head, id: doctype.state.log[0] }
        // TODO - use the dag-jose library for properly encoded signed records
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

}
