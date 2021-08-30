import { Doctype, DoctypeConstructor, DoctypeStatic, DocOpts, DocParams, Context } from "@ceramicnetwork/common"

const DOCTYPE = 'caip10-link'

/**
 * Caip10Link parameters
 */
export interface Caip10LinkParams extends DocParams {
    content?: Record<string, unknown>;
}

/**
 * Caip10Link doctype implementation
 */
@DoctypeStatic<DoctypeConstructor<Caip10LinkDoctype>>()
export class Caip10LinkDoctype extends Doctype {

    /**
     * Changes Caip10Link instance
     * @param params - Change parameters
     * @param opts - Initialization options
     */
    async change(params: Caip10LinkParams, opts?: DocOpts): Promise<void> {
        const { content, metadata } = params

        if ('chainId' in params && params.chainId != this.metadata.chainId) {
            throw new Error("Updating chainId is not currently supported. Current chainId: " + this.metadata.chainId + ", requested chainId: " + params.chainId)
        }

        const updateCommit = await Caip10LinkDoctype._makeCommit(this, content, metadata?.schema)
        const updated = await this.context.api.applyCommit(this.id.toString(), updateCommit, opts)
        this.state = updated.state
    }

    /**
     * Creates Caip10Link doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: Caip10LinkParams, context: Context, opts?: DocOpts): Promise<Caip10LinkDoctype> {
        const { content, metadata } = params

        const commit = await Caip10LinkDoctype.makeGenesis({ content, metadata }, context)
        return context.api.createDocumentFromGenesis(DOCTYPE, commit, opts)
    }

    /**
     * Creates genesis commit
     * @param params - Create parameters
     */
    static async makeGenesis(params: Record<string, any>, context: Context): Promise<Commit<string, any>> {
        const { content, metadata } = params

        if (content) {
            throw new Error('Account link genesis cannot have content')
        }
        if (!metadata) {
            throw new Error('Metadata must be specified')
        }
        if (!metadata.controllers) {
            throw new Error('Controller must be specified')
        }
        if (metadata.controllers.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        const supported_anchor_chains = await context.api.getSupportedChains()
        if ('chainId' in metadata && !supported_anchor_chains.includes(metadata.chainId)) {
            throw new Error("Requested chainId '" + metadata.chainId + "' is not supported. Supported chains are: " + supported_anchor_chains.toString())
        }
        metadata.chainId = metadata.chainId ?? supported_anchor_chains[0]

        const [address, linkedChainId] = metadata.controllers[0].split('@') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (!linkedChainId) {
            throw new Error('Chain ID must be specified according to CAIP-10')
        }
        return { header: metadata }
    }

    /**
     * Creates change commit
     * @param doctype - Caip10Link doctype instance
     * @param newContent - Change content
     * @param newSchema - Change schema
     * @private
     */
    static async _makeCommit (doctype: Caip10LinkDoctype, newContent: any, newSchema: string = null): Promise<any> {
        const { metadata } = doctype
        if (newSchema) {
            metadata.schema = newSchema
        }
        if (newContent == null) {
            newContent = doctype.content
        }
        return { data: newContent, header: metadata, prev: doctype.tip, id: doctype.state.log[0].cid }
    }
}
