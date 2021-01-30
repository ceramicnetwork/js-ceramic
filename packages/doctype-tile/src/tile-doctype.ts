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
     * @deprecated - Use CeramicApi.updateDocument instead
     */
    async change(params: TileParams, opts: DocOpts = {}): Promise<void> {
        await this.context.api.updateDocument(this, params, opts)
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
        // If 'deterministic' is undefined, default to creating document uniquely
        const unique = params.deterministic ? '0' : uint8arrays.toString(randomBytes(12), 'base64')

        const metadata: GenesisHeader = params.metadata || { controllers: [] }
        if (!metadata.controllers || metadata.controllers.length === 0) {
            if (params.content && context.did) {
                metadata.controllers = [context.did.id]
            } else {
                throw new Error('No controllers specified')
            }
        }

        if (metadata.controllers.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        const commit: GenesisCommit = { data: params.content, header: metadata, unique }
        return (params.content ? await TileDoctype._signDagJWS(commit, context.did, metadata.controllers[0]): commit) as T
    }

    /**
     * Makes a new SignedCommit describing a change to the document.
     * @param params
     */
    async _makeCommit(params: DocParams): Promise<CeramicCommit> {
        const schema = params.metadata?.schema
        const newControllers = params.metadata?.controllers
        let newContent = params.content

        if (this.context.did == null) {
            throw new Error('No DID authenticated')
        }

        const header: CommitHeader = {
            ...schema != null && { schema: schema },
            ...newControllers != null && { controllers: newControllers },
        }

        if (newContent == null) {
            newContent = this.content
        }

        if (header.controllers && header.controllers.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        const patch = jsonpatch.compare(this.content, newContent)
        const commit: UnsignedCommit = { header, data: patch, prev: this.tip, id: this.state.log[0].cid }
        return TileDoctype._signDagJWS(commit, this.context.did, this.controllers[0])
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
