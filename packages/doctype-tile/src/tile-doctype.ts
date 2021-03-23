import jsonpatch from 'fast-json-patch'

import * as uint8arrays from 'uint8arrays'
import { randomBytes } from '@stablelib/random'

import type { DID } from 'dids'
import {
    Doctype,
    DoctypeConstructor,
    DoctypeStatic,
    CeramicCommit,
    CommitHeader,
    DocOpts,
    DocParams,
    Context,
    GenesisHeader,
    GenesisCommit,
    UnsignedCommit,
} from "@ceramicnetwork/common"

export const DOCTYPE_NAME = 'tile'

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

        const updateCommit = await TileDoctype._makeCommit(this, this.context.did, params.content, params.metadata?.controllers, params.metadata?.schema)
        const updated = await this.context.api.applyCommit(this.id.toString(), updateCommit, opts)
        this.state$.next(updated.state);
    }

    /**
     * Create Tile doctype
     * @param params - Create parameters
     * @param context - Ceramic context
     * @param opts - Initialization options
     */
    static async create(params: TileParams, context: Context, opts?: DocOpts): Promise<TileDoctype> {
        const { content, metadata } = params
        const commit = await TileDoctype.makeGenesis({ content, metadata }, context)
        return context.api.createDocumentFromGenesis<TileDoctype>(DOCTYPE_NAME, commit, opts)
    }

    /**
     * Creates genesis commit
     * @param params - Create parameters
     * @param context - Ceramic context
     */
    static async makeGenesis<T extends CeramicCommit>(params: DocParams, context: Context): Promise<T> {
        const metadata: GenesisHeader = params.metadata || { controllers: [] }
        if (!metadata.controllers || metadata.controllers.length === 0) {
            if (context.did) {
                metadata.controllers = [context.did.id]
            } else {
                throw new Error('No controllers specified')
            }
        }

        if (metadata.controllers.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        // If 'deterministic' is undefined, default to creating document uniquely
        if (!params.deterministic) {
            metadata.unique = uint8arrays.toString(randomBytes(12), 'base64')
        }

        const commit: GenesisCommit = { data: params.content, header: metadata }
        return (params.content ? await TileDoctype._signDagJWS(commit, context.did, metadata.controllers[0]): commit) as T
    }

    /**
     * Make change commit
     * @param doctype - Tile doctype instance
     * @param did - DID instance
     * @param newContent - New context
     * @param newControllers - New controllers
     * @param schema - New schema ID
     * @private
     */
    static async _makeCommit(doctype: Doctype, did: DID, newContent: any, newControllers?: string[], schema?: string): Promise<CeramicCommit> {
        const header: CommitHeader = {
            ...schema != null && { schema: schema },
            ...newControllers != null && { controllers: newControllers },
        }

        if (newContent == null) {
            newContent = doctype.content
        }

        if (header.controllers && header.controllers.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        const patch = jsonpatch.compare(doctype.content, newContent)
        const commit: UnsignedCommit = { header, data: patch, prev: doctype.tip, id: doctype.state.log[0].cid }
        return TileDoctype._signDagJWS(commit, did, doctype.controllers[0])
    }

    /**
     * Sign Tile commit
     * @param did - DID instance
     * @param commit - Commit to be signed
     * @param controller - Controller
     * @private
     */
    static async _signDagJWS(commit: CeramicCommit, did: DID, controller: string): Promise<CeramicCommit> {
        // check for DID and authentication
        if (did == null || !did.authenticated) {
            throw new Error('No DID authenticated')
        }
        return did.createDagJWS(commit, { did: controller })
    }

}
