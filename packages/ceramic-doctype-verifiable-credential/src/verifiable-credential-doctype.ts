import jsonPatch from 'fast-json-patch'

import { Doctype, DoctypeConstructor, DoctypeStatic, InitOpts } from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"
import { User } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = 'verifiable-credential'

/**
 * content: Verifiable credential content
 * schema: docId of credential schema
 * owners: List of owner Ids
 */
export interface VerifiableCredentialParams {
    content: object;
    owners: Array<string>;
}

@DoctypeStatic<DoctypeConstructor<VerifiableCredentialDoctype>>()
export class VerifiableCredentialDoctype extends Doctype {

    /**
     * Change existing Verifiable Credential doctype
     * @param params - Change parameters
     * @param opts - Initialization options
     */
    async change(params: VerifiableCredentialParams, opts?: InitOpts): Promise<void> {
        const { content, owners } = params
        const updateRecord = await VerifiableCredentialDoctype._makeRecord(this, this.context.user, content, owners)
        const updated = await this.context.api.applyRecord(this.id, updateRecord)
        this.state = updated.state
    }

    /**
     * Create Verifiable Credential doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: VerifiableCredentialParams, context: Context, opts?: InitOpts): Promise<VerifiableCredentialDoctype> {
        if (context.user == null) {
            throw new Error('No user authenticated')
        }

        const { content, owners } = params
        const record = await VerifiableCredentialDoctype.makeGenesis({ content, owners }, context, opts)
        return context.api.createDocumentFromGenesis(record, opts)
    }

    /**
     * Creates a genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async makeGenesis(params: Record<string, any>, context? : Context, opts: InitOpts = {}): Promise<Record<string, any>> {
        if (!context.user) {
            throw new Error('No user authenticated')
        }

        let { owners } = params
        const { content, contentHash } = params

        if (!owners) {
            owners = [context.user.DID]
        }

        // TODO: Add other validations once finalized

        const record = {
            doctype: DOCTYPE,
            owners,
            content
        }

        return VerifiableCredentialDoctype._signRecord(record, context.user)
    }

    /**
     * Make change record
     * @param doctype - Verifiable credential doctype instances
     * @param user - User instance
     * @param newContent - New content
     * @param newOwners - New owners
     */
    static async _makeRecord(doctype: Doctype, user: User, newContent: any, newOwners?: string[]): Promise<any> {
        if (user == null) {
            throw new Error('No user authenticated')
        }

        let owners = newOwners;

        if (!owners) {
            owners = doctype.owners
        }

        const patch = jsonPatch.compare(doctype.content, newContent)
        const record: any = { owners: owners, content: patch, prev: doctype.head, id: doctype.state.log[0] }
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
     * Sign Verifiable Credential Record
     * @param record - Record to be signed
     * @param user - User instance
     */
    static async _signRecord(record: any, user: User): Promise<any> {
        if (user == null) {
            throw new Error('No user authenticated')
        }

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
