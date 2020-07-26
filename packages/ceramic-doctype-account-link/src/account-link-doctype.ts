import { Doctype, DoctypeConstructor, DoctypeStatic, DocOpts } from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = 'account-link'

/**
 * AccountLink parameters
 */
export class AccountLinkParams {
    content: object;
    owners?: Array<string>;
}

/**
 * AccountLink doctype implementation
 */
@DoctypeStatic<DoctypeConstructor<AccountLinkDoctype>>()
export class AccountLinkDoctype extends Doctype {

    /**
     * Changes AccountLink instance
     * @param params - Change parameters
     * @param opts - Initialization options
     */
    async change(params: AccountLinkParams, opts?: DocOpts): Promise<void> {
        const { content } = params
        const updateRecord = await AccountLinkDoctype._makeRecord(this, content)
        const updated = await this.context.api.applyRecord(this.id, updateRecord, opts)
        this.state = updated.state
    }

    /**
     * Creates AccountLink doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: AccountLinkParams, context: Context, opts?: DocOpts): Promise<AccountLinkDoctype> {
        const { content, owners } = params

        const record = await AccountLinkDoctype.makeGenesis({ content, owners })
        return context.api.createDocumentFromGenesis(record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     */
    static async makeGenesis(params: Record<string, any>): Promise<Record<string, any>> {
        const { content, owners } = params

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
     * Creates change record
     * @param doctype - AccountLink doctype instance
     * @param newContent - Change content
     * @private
     */
    static async _makeRecord (doctype: AccountLinkDoctype, newContent: any): Promise<any> {
        return { content: newContent, prev: doctype.head, id: doctype.state.log[0] }
    }
}
