import jsonpatch from 'fast-json-patch'
import type { Operation } from 'fast-json-patch'

import * as uint8arrays from 'uint8arrays'
import { randomBytes } from '@stablelib/random'

import {
    Doctype,
    DoctypeConstructor,
    DoctypeStatic,
    CeramicCommit,
    CommitHeader,
    DocOpts,
    GenesisCommit,
    UnsignedCommit,
    CeramicApi,
    SignedCommitContainer,
    DocMetadata,
    CeramicSigner,
} from "@ceramicnetwork/common"
import { CommitID, DocID, DocRef } from "@ceramicnetwork/docid";
import cloneDeep from "lodash.clonedeep";

/**
 * Arguments used to generate the metadata for Tile documents
 */
export interface TileMetadataArgs {
  controllers?: Array<string>
  family?: string
  schema?: CommitID | string
  tags?: Array<string>
  deterministic?: boolean
}

/**
 * Converts from metadata format into CommitHeader format to be put into a CeramicCommit
 * @param metadata
 */
function headerFromMetadata(metadata?: TileMetadataArgs | DocMetadata): CommitHeader {
    if (typeof metadata?.schema === 'string') {
        try {
            CommitID.fromString(metadata.schema)
        } catch {
            throw new Error("Schema must be a CommitID")
        }
    }

    const header: CommitHeader = {
        controllers: metadata?.controllers,
        family: metadata?.family,
        schema: metadata?.schema?.toString(),
        tags: metadata?.tags,
    }

    // Delete undefined keys from header
    Object.keys(header).forEach(key => header[key] === undefined && delete header[key])
    return header
}

async function _ensureAuthenticated(signer: CeramicSigner) {
    if (signer.did == null) {
        throw new Error('No DID provided')
    }
    if (!signer.did.authenticated) {
        await signer.did.authenticate()
        if (signer.loggerProvider) {
            signer.loggerProvider.getDiagnosticsLogger().imp(`Now authenticated as DID ${signer.did.id}`)
        }
    }
}

/**
 * Sign Tile commit
 * @param signer - Object containing the DID to use to sign the commit
 * @param commit - Commit to be signed
 * @param controller - Controller
 * @private
 */
async function _signDagJWS(signer: CeramicSigner, commit: CeramicCommit, controller: string): Promise<SignedCommitContainer> {
    await _ensureAuthenticated(signer)
    return signer.did.createDagJWS(commit, { did: controller })
}

async function throwReadOnlyError (): Promise<void> {
    throw new Error('Historical document commits cannot be modified. Load the document without specifying a commit to make updates.')
}

/**
 * Tile doctype implementation
 */
@DoctypeStatic<DoctypeConstructor<TileDoctype>>()
export class TileDoctype<T = Record<string, any>> extends Doctype {

    static DOCTYPE_NAME = 'tile'
    static DOCTYPE_ID = 0

    /**
     * Returns the contents of this document
     */
    get content(): T {
        return this._getContent()
    }

    /**
     * Creates a Tile document.
     * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
     * @param content - Genesis contents. If 'null', then no signature is required to make the genesis commit
     * @param metadata - Genesis metadata
     * @param opts - Additional options
     */
    static async create<T>(ceramic: CeramicApi, content: T | null | undefined, metadata?: TileMetadataArgs, opts: DocOpts = {}): Promise<TileDoctype<T>> {
      const commit = await TileDoctype.makeGenesis(ceramic, content, metadata)
      return ceramic.createDocumentFromGenesis<TileDoctype<T>>(TileDoctype.DOCTYPE_NAME, commit, opts)
    }

    /**
     * Create Tile document from genesis commit
     * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
     * @param genesisCommit - Genesis commit (first commit in document log)
     * @param opts - Additional options
     */
    static async createFromGenesis<T>(ceramic: CeramicApi, genesisCommit: GenesisCommit, opts: DocOpts = {}): Promise<TileDoctype<T>> {
        const commit = (genesisCommit.data ? await _signDagJWS(ceramic, genesisCommit, genesisCommit.header.controllers[0]): genesisCommit)
        return ceramic.createDocumentFromGenesis<TileDoctype<T>>(TileDoctype.DOCTYPE_NAME, commit, opts)
    }

    /**
     * Loads a Tile document from a given DocID
     * @param ceramic - Instance of CeramicAPI used to communicate with the Ceramic network
     * @param docId - DocID to load.  Must correspond to a Tile doctype
     * @param opts - Additional options
     */
    static async load<T>(ceramic: CeramicApi, docId: DocID | CommitID | string, opts: DocOpts = {}): Promise<TileDoctype<T>> {
        const docRef = DocRef.from(docId)
        if (docRef.type != TileDoctype.DOCTYPE_ID) {
            throw new Error(`DocID ${docRef.toString()} does not refer to a '${TileDoctype.DOCTYPE_NAME}' doctype, but to a ${docRef.typeName}`)
        }

        return ceramic.loadDocument<TileDoctype<T>>(docRef, opts)
    }

    /**
     * Update an existing Tile document.
     * @param content - New content to replace old content
     * @param metadata - Changes to make to the metadata.  Only fields that are specified will be changed.
     * @param opts - Additional options
     */
    async update(content: T, metadata?: TileMetadataArgs, opts: DocOpts = {}): Promise<void> {
        const updateCommit = await this.makeCommit(this.context.api, content, metadata)
        const updated = await this.context.api.applyCommit(this.id, updateCommit, opts)
        this.state$.next(updated.state)
    }

    /**
     * Update the contents of an existing Tile document based on a JSON-patch diff from the existing
     * contents to the desired new contents
     * @param jsonPatch - JSON patch diff of document contents
     * @param opts - Additional options
     */
    async patch(jsonPatch: Operation[], opts: DocOpts = {}): Promise<void> {
        const header = headerFromMetadata(this.metadata)
        const unsignedCommit: UnsignedCommit = { header, data: jsonPatch, prev: this.tip, id: this.state$.id.cid }
        const commit = await _signDagJWS(this.context.api, unsignedCommit, this.controllers[0])
        const updated = await this.context.api.applyCommit(this.id, commit, opts)
        this.state$.next(updated.state)
    }

    /**
     * Makes this document read-only. After this has been called any future attempts to call
     * mutation methods on the instance will throw.
     */
    makeReadOnly() {
        this.update = throwReadOnlyError
        this.patch = throwReadOnlyError
    }

    /**
     * Make a commit to update the document
     * @param signer - Object containing the DID making (and signing) the commit
     * @param newContent
     * @param newMetadata
     */
    async makeCommit(signer: CeramicSigner, newContent: T | undefined, newMetadata?: TileMetadataArgs): Promise<CeramicCommit> {
        const header = headerFromMetadata(newMetadata)

        if (newContent == null) {
            newContent = this.content
        }

        if (header.controllers && header.controllers?.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        const patch = jsonpatch.compare(this.content, newContent)
        const commit: UnsignedCommit = { header, data: patch, prev: this.tip, id: this.state.log[0].cid }
        return _signDagJWS(signer, commit, this.controllers[0])
    }

    /**
     * Create genesis commit.
     * @param signer - Object containing the DID making (and signing) the commit
     * @param content - genesis content
     * @param metadata - genesis metadata
     */
    static async makeGenesis<T>(signer: CeramicSigner, content: T | null, metadata?: TileMetadataArgs): Promise<CeramicCommit> {
        if (!metadata) {
            metadata = {}
        }

        if (!metadata.controllers || metadata.controllers.length === 0) {
            if (signer.did) {
                await _ensureAuthenticated(signer)
                metadata.controllers = [signer.did.id]
            } else {
                throw new Error('No controllers specified')
            }
        }
        if (metadata.controllers?.length !== 1) {
            throw new Error('Exactly one controller must be specified')
        }

        const header = headerFromMetadata(metadata)
        if (!metadata?.deterministic) {
            header.unique = uint8arrays.toString(randomBytes(12), 'base64')
        }

        if (content == null) {
            // No signature needed if no genesis content
            return { header }
        }
        const commit: GenesisCommit = { data: content, header }
        return await _signDagJWS(signer, commit, metadata.controllers[0])
    }

}
