import jsonpatch from 'fast-json-patch'

import { encode as base64Encode } from '@ethersproject/base64'
import { randomBytes } from '@ethersproject/random'

import { DID } from 'dids'
import {
    Doctype,
    DoctypeConstructor,
    DoctypeStatic,
    CeramicRecord,
    RecordHeader,
    DocOpts,
    DocParams,
    Context,
    GenesisHeader,
    GenesisRecord,
    UnsignedRecord,
} from "@ceramicnetwork/common"

const DOCTYPE = 'tile'

/**
 * Tile doctype parameters
 */
export interface TileParams extends DocParams {
    content?: Record<string, unknown>;
}

/**
 * Tile doctype implementation
 */
@DoctypeStatic<DoctypeConstructor<TileDoctype>>()
export class TileDoctype extends Doctype {

    /**
     * Change existing Tile doctype
     * @param params - Change parameters
     * @param opts - Initialization options
     */
    async change(params: TileParams, opts: DocOpts = {}): Promise<void> {
        if (this.context.did == null) {
            throw new Error('No DID authenticated')
        }

        const updateRecord = await TileDoctype._makeRecord(this, this.context.did, params.content, params.metadata?.controllers, params.metadata?.schema)
        const updated = await this.context.api.applyRecord(this.id.toString(), updateRecord, opts)
        this.state = updated.state
    }

    /**
     * Create Tile doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: TileParams, context: Context, opts?: DocOpts): Promise<TileDoctype> {
        const { content, metadata } = params
        const record = await TileDoctype.makeGenesis({ content, metadata }, context)
        return context.api.createDocumentFromGenesis<TileDoctype>(DOCTYPE, record, opts)
    }

    /**
     * Creates genesis record
     * @param params - Create parameters
     * @param context - Ceramic context
     */
    static async makeGenesis<T extends CeramicRecord>(params: DocParams, context: Context): Promise<T> {
        // If 'deterministic' is undefined, default to creating document uniquely
        const unique = params.deterministic ? '0' : base64Encode(randomBytes(12))

        const metadata: GenesisHeader = params.metadata || { controllers: [] }
        if (metadata.controllers.length === 0) {
            if (params.content && context.did) {
                metadata.controllers = [context.did.id]
            } else {
                throw new Error('No controllers specified')
            }
        }

        const record: GenesisRecord = { data: params.content, header: metadata, unique }
        return (params.content ? await TileDoctype._signDagJWS(record, context.did, metadata.controllers[0]): record) as T
    }

    /**
     * Make change record
     * @param doctype - Tile doctype instance
     * @param did - DID instance
     * @param newContent - New context
     * @param newControllers - New controllers
     * @param schema - New schema ID
     * @private
     */
    static async _makeRecord(doctype: Doctype, did: DID, newContent: any, newControllers?: string[], schema?: string): Promise<CeramicRecord> {
        const header: RecordHeader = {
            ...schema != null && { schema: schema },
            ...newControllers != null && { controllers: newControllers },
        }

        if (newContent == null) {
            newContent = doctype.content
        }

        const patch = jsonpatch.compare(doctype.content, newContent)
        const record: UnsignedRecord = { header, data: patch, prev: doctype.tip, id: doctype.state.log[0].cid }
        return TileDoctype._signDagJWS(record, did, doctype.controllers[0])
    }

    /**
     * Sign Tile record
     * @param did - DID instance
     * @param record - Record to be signed
     * @param controller - Controller
     * @private
     */
    static async _signDagJWS(record: CeramicRecord, did: DID, controller: string): Promise<CeramicRecord> {
        // check for DID and authentication
        if (did == null || !did.authenticated) {
            throw new Error('No DID authenticated')
        }
        return did.createDagJWS(record, { did: controller })
    }

}
