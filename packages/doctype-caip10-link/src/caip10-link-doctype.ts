import {
  Doctype,
  DoctypeConstructor,
  DoctypeStatic,
  DocOpts,
  DocParams,
  Context,
  CeramicCommit, UnsignedCommit,
} from '@ceramicnetwork/common';

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
     */
    async change(params: Caip10LinkParams, opts?: DocOpts): Promise<void> {
        const { content, metadata } = params

        const updateCommit = await Caip10LinkDoctype._makeCommit(this, content, metadata?.schema)
        const updated = await this.context.api.applyCommit(this.id.toString(), updateCommit, opts)
        this.state$.next(updated.state);
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

        const [, linkedChainId] = metadata.controllers[0].split('@') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (!linkedChainId) {
            throw new Error('Chain ID must be specified according to CAIP-10')
        }
        // Add family here to enable easier indexing
        return { header: { controllers: metadata.controllers, family: `caip10-${linkedChainId}` } }
    }

    /**
     * Creates change commit
     * @param doctype - Caip10Link doctype instance
     * @param newContent - Change content
     * @param newSchema - Change schema
     * @private
     */
    static async _makeCommit (doctype: Caip10LinkDoctype, newContent: any, newSchema: string = null): Promise<UnsignedCommit> {
        if (newSchema) {
            throw new Error('Schema not allowed on caip10-link doctype')
        }
        if (newContent == null) {
            throw new Error('Proof must be given in doctype')
        }
        return { data: newContent, prev: doctype.tip, id: doctype.state.log[0].cid }
    }
}
