import {
    Doctype,
    DoctypeConstructor,
    DoctypeStatic,
    DocOpts,
    DocParams,
    Context,
    CeramicCommit
} from "@ceramicnetwork/common"

export const DOCTYPE_NAME = 'caip10-link'

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
     * @deprecated - Use CeramicApi.updateDocument instead
     */
    async change(params: Caip10LinkParams, opts?: DocOpts): Promise<void> {
        await this.context.api.updateDocument(this, params, opts)
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
        return context.api.createDocumentFromGenesis(DOCTYPE_NAME, commit, opts)
    }

    /**
     * Creates genesis commit
     * @param params - Create parameters
     * @param context
     */
    static async makeGenesis(params: Record<string, any>, context: Context): Promise<CeramicCommit> {
        const { content, metadata } = params

        if (content) {
            throw new Error('Account link genesis cannot have content')
        }
        if (!metadata) {
            throw new Error('Metadata must be specified')
        }
        if (!(metadata.controllers && metadata.controllers.length === 1)) {
            throw new Error('Exactly one controller must be specified')
        }

        const [address, linkedChainId] = metadata.controllers[0].split('@') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (!linkedChainId) {
            throw new Error('Chain ID must be specified according to CAIP-10')
        }
        // Add family here to enable easier indexing
        return { header: { controllers: metadata.controllers, family: `caip10-${linkedChainId}` } }
    }

    /**
     * Makes a new commit describing a change to the document.
     * @param params
     */
    async _makeCommit(params: DocParams): Promise<CeramicCommit> {
        if (params.metadata?.schema) {
            throw new Error('Schema not allowed on caip10-link doctype')
        }
        if (params.content == null) {
            throw new Error('Proof must be given in doctype')
        }
        return { data: params.content, prev: this.tip, id: this.state.log[0].cid }
    }
}
