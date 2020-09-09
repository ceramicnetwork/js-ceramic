import jsonpatch from 'fast-json-patch'

import {
    Doctype,
    DoctypeConstructor,
    DoctypeStatic,
    DocOpts,
    DocParams
} from "@ceramicnetwork/ceramic-common"

import { DID } from 'dids'
import { Context } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = '3id'

/**
 * ThreeId doctype parameters
 */
export interface ThreeIdParams extends DocParams {
    content?: object;
}

/**
 * ThreeId doctype implementation
 */
@DoctypeStatic<DoctypeConstructor<ThreeIdDoctype>>()
export class ThreeIdDoctype extends Doctype {
    /**
     * Change existing ThreeId doctype
     * @param params - Change parameters
     * @param opts - Initialization options
     */
    async change(params: ThreeIdParams, opts: DocOpts = {}): Promise<void> {
        const { content, metadata } = params

        const updateRecord = await ThreeIdDoctype._makeRecord(this, this.context.did, content, metadata?.owners, metadata?.schema)
        const updated = await this.context.api.applyRecord(this.id, updateRecord, opts)
        this.state = updated.state
    }

    /**
     * Creates ThreeId doctype instance
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: ThreeIdParams, context: Context, opts?: DocOpts): Promise<ThreeIdDoctype> {
        const { content, metadata } = params
        if (!metadata?.owners) {
            throw new Error('The owner of the 3ID needs to be specified')
        }

        const record = await ThreeIdDoctype.makeGenesis({ content, metadata })
        return context.api.createDocumentFromGenesis<ThreeIdDoctype>(record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     */
    static async makeGenesis(params: Record<string, any>): Promise<Record<string, any>> {
        const { content, metadata } = params

        if (!metadata) {
            throw new Error('Metadata needs to be specified')
        }

        if (!metadata.owners) {
            throw new Error('The owner of the 3ID needs to be specified')
        }
        return {
            doctype: DOCTYPE, header: metadata, data: content
        }
    }

    /**
     * Creates change record
     * @param doctype - Doctype instance
     * @param did - DID instance
     * @param newContent - New content
     * @param newOwners - New owners
     * @param newSchema - New schema
     * @private
     */
    static async _makeRecord(doctype: Doctype, did: DID, newContent: any, newOwners: string[] = null, newSchema: string = null): Promise<any> {
        if (did == null || !did.authenticated) {
            throw new Error('No DID authenticated')
        }

        if (typeof newContent == null) {
            newContent = doctype.state.content
        }

        const patch = jsonpatch.compare(doctype.state.content, newContent)
        const header: Record<string, any> = {}
        if (newOwners) {
            header.owners = newOwners
        }
        if (newSchema) {
            header.schema = newSchema
        }
        const record: any = { header, data: patch, prev: doctype.head, id: doctype.state.log[0] }
        return ThreeIdDoctype._signDagJWS(record, did, doctype.owners[0])
    }

    /**
     * Sign ThreeId record
     * @param did - DID instance
     * @param record - Record to be signed
     * @private
     */
    static async _signDagJWS(record: any, did: DID, owner: string): Promise<any> {
        if (did == null || !did.authenticated) {
            throw new Error('No user authenticated')
        }
        return did.createDagJWS(record, { did: owner })
    }

}
