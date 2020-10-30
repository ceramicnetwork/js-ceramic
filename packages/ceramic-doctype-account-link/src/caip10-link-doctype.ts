import { Doctype, DoctypeConstructor, DoctypeStatic, DocOpts, DocParams, Context } from "@ceramicnetwork/ceramic-common"

const DOCTYPE = 'caip10-link'

/**
 * Caip10Link parameters
 */
export interface Caip10LinkParams extends DocParams {
    content?: object;
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
        const updateRecord = await Caip10LinkDoctype._makeRecord(this, content, metadata?.schema)
        const updated = await this.context.api.applyRecord(this.id.toString(), updateRecord, opts)
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

        const record = await Caip10LinkDoctype.makeGenesis({ content, metadata })
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
        if (!metadata.controllers) {
            throw new Error('Controller must be specified')
        }
        if (metadata.controllers.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }
        const [address, chainId] = metadata.controllers[0].split('@') // eslint-disable-line @typescript-eslint/no-unused-vars
        if (!chainId) {
            throw new Error('Chain ID must be specified according to CAIP-10')
        }
        return {
            doctype: DOCTYPE,
            header: metadata,
        }
    }

    /**
     * Creates change record
     * @param doctype - Caip10Link doctype instance
     * @param newContent - Change content
     * @param newSchema - Change schema
     * @private
     */
    static async _makeRecord (doctype: Caip10LinkDoctype, newContent: any, newSchema: string = null): Promise<any> {
        const { metadata } = doctype
        if (newSchema) {
            metadata.schema = newSchema
        }
        if (newContent == null) {
            newContent = doctype.content
        }
        return { content: newContent, header: metadata, prev: doctype.tip, id: doctype.state.log[0] }
    }
}
