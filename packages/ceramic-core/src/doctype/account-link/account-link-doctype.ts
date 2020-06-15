import CID from 'cids'
import { DocState, Doctype, InitOpts } from "../../doctype"
import { Context } from "../../context"
import User from "../../user"

const DOCTYPE = 'account-link'

/**
 * AccountLink parameters
 */
export class AccountLinkParams {
    content: object;
    owners: Array<string>;
}

/**
 * AccountLink doctype implementation
 */
export class AccountLinkDoctype implements Doctype {
    id: string;
    content: object
    doctype: string
    head: CID
    owners: string[]
    state: DocState

    constructor(content: object, doctype: string, head: CID, owners: Array<string>, state: DocState) {
        this.content = content
        this.doctype = doctype
        this.head = head
        this.owners = owners
        this.state = state
    }

    /**
     * Creates AccountLink doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: AccountLinkParams, context: Context, opts?: InitOpts): Promise<AccountLinkDoctype> {
        const { content, owners } = params

        const record = await AccountLinkDoctype._makeGenesis(content, owners)
        await context.ipfs.dag.put(record)

        const accountLinkDoctype = await context.ceramic.createFromGenesis(record, opts)
        return Promise.resolve(accountLinkDoctype)
    }

    /**
     * Makes genesis record
     * @param content - Content
     * @param owners - Owners
     * @private
     */
    static async _makeGenesis (content: any, owners: Array<string>): Promise<any> {
        if (content) {
            throw new Error('Account link genesis cannot have content')
        }
        if (!owners) {
            throw new Error('Owner must be specified')
        }
        if (owners.length !== 1) {
            throw new Error('Exactly one owner must be specified')
        }
        const [address, chainId] = owners[0].split('@') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (!chainId) {
            throw new Error('Chain ID must be specified according to CAIP-10')
        }
        if (chainId !== 'eip155:1') {
            throw new Error('Only Ethereum mainnet supported')
        }
        return {
            doctype: DOCTYPE,
            owners,
        }
    }

    /**
     * Changes AccountLink instance
     * @param doctype - AccountLink doctype instance
     * @param params - Change parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async change(doctype: Doctype, params: AccountLinkParams, context: Context, opts?: InitOpts): Promise<Doctype> {
        if (context.user == null) {
            throw new Error('No user authenticated')
        }

        const { content } = params
        const updateRecord = AccountLinkDoctype._makeRecord(doctype, content)
        return await context.ceramic.applyRecord(doctype.id, updateRecord, opts)
    }

    /**
     * Creates change record
     * @param doctype - AccountLink doctype instance
     * @param newContent - Change content
     * @private
     */
    static async _makeRecord (doctype: AccountLinkDoctype, newContent: any): Promise<any> {
        return { content: newContent, prev: doctype.head, id: doctype.state.log[0] }
    }
}
