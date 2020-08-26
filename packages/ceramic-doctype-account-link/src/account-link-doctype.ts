import { Doctype, DoctypeConstructor, DoctypeStatic, DocOpts, DocParams } from "@ceramicnetwork/ceramic-common"
import { Context } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = 'account-link'

/**
 * AccountLink parameters
 */
export interface AccountLinkParams extends DocParams {
    content?: object;
}

function isValidChainId(chainId: string) {
    return chainId === 'eip155:1' || chainId === 'fil:t' || chainId === 'fil:m'
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
        const { content, metadata } = params
        const updateRecord = await AccountLinkDoctype._makeRecord(this, content, metadata?.schema)
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
        const { content, metadata } = params

        const record = await AccountLinkDoctype.makeGenesis({ content, metadata })
        return context.api.createDocumentFromGenesis(record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     */
    static async makeGenesis(params: Record<string, any>): Promise<Record<string, any>> {
        const { content, metadata } = params

        if (content) {
            throw new Error('Account link genesis cannot have content')
        }
        if (!metadata) {
            throw new Error('Metadata must be specified')
        }
        if (!metadata.owners) {
            throw new Error('Owner must be specified')
        }
        if (metadata.owners.length !== 1) {
            throw new Error('Exactly one owner must be specified')
        }
        const [address, chainId] = metadata.owners[0].split('@') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (!chainId) {
            throw new Error('Chain ID must be specified according to CAIP-10')
        }
        if (isValidChainId(chainId)) {
            return {
                doctype: DOCTYPE,
                header: metadata,
            }
        } else {
            throw new Error(`ChainId ${chainId} is not supported`)
        }
    }

    /**
     * Creates change record
     * @param doctype - AccountLink doctype instance
     * @param newContent - Change content
     * @param newSchema - Change schema
     * @private
     */
    static async _makeRecord (doctype: AccountLinkDoctype, newContent: any, newSchema: string = null): Promise<any> {
        const { metadata } = doctype
        if (newSchema) {
            metadata.schema = newSchema
        }
        if (newContent == null) {
            newContent = doctype.content
        }
        return { content: newContent, header: metadata, prev: doctype.head, id: doctype.state.log[0] }
    }
}
