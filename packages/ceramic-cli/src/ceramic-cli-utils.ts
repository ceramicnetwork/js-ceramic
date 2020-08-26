import CeramicClient from "@ceramicnetwork/ceramic-http-client"
import { CeramicApi, DoctypeUtils } from "@ceramicnetwork/ceramic-common"

const PREFIX_REGEX = /^ceramic:\/\/|^\/ceramic\//

/**
 * Ceramic CLI utility functions
 */
export class CeramicCliUtils {

    /**
     * Create document
     * @param doctype - Document type
     * @param content - Document content
     * @param owners - Document owners
     * @param onlyGenesis - Create only a genesis record (no publish or anchor)
     * @param isUnique - Should document be unique?
     * @param schemaDocId - Schema document ID
     */
    static async createDoc(doctype: string, content: string, owners: string, onlyGenesis: boolean, isUnique: boolean, schemaDocId: string = null): Promise<void> {
        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const parsedOwners = CeramicCliUtils._parseOwners(owners)
            const parsedContent = CeramicCliUtils._parseContent(content)

            const params = {
                content: parsedContent,
                metadata: {
                    owners: parsedOwners, isUnique, schema: schemaDocId
                }
            }

            const doc = await ceramic.createDocument(doctype, params, {
                applyOnly: onlyGenesis
            })

            console.log(doc.id)
            console.log(JSON.stringify(doc.content, null, 2))
        })
    }

    /**
     * Change document
     * @param docId - Document ID
     * @param content - Document content
     * @param owners - Document owners
     * @param schemaDocId - Optional schema document ID
     */
    static async change(docId: string, content: string, owners: string, schemaDocId?: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        const version = DoctypeUtils.getVersionId(docId)
        if (version) {
            console.error(`No versions allowed. Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const parsedOwners = CeramicCliUtils._parseOwners(owners)
            const parsedContent = CeramicCliUtils._parseContent(content)

            const doc = await ceramic.loadDocument(docId)
            await doc.change({ content: parsedContent, metadata: { owners: parsedOwners, schema: schemaDocId } })
            console.log(JSON.stringify(doc.content, null, 2))
        })
    }

    /**
     * Show document content
     * @param docId - Document ID
     */
    static async show(docId: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(docId)
            console.log(JSON.stringify(doc.content, null, 2))
        })
    }

    /**
     * Show document state
     * @param docId - Document ID
     */
    static async state(docId: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(docId)
            console.log(JSON.stringify(DoctypeUtils.serializeState(doc.state), null, 2))
        })
    }

    /**
     * Watch document state periodically
     * @param docId - Document ID
     */
    static async watch(docId: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(docId)
            console.log(JSON.stringify(doc.content, null, 2))
            doc.on('change', () => {
                console.log('--- document changed ---')
                console.log(JSON.stringify(doc.content, null, 2))
            })
        })
    }

    /**
     * Get document versions
     * @param docId - Document ID
     */
    static async versions(docId: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const versions = await ceramic.listVersions(docId)
            console.log(JSON.stringify(versions, null, 2))
        })
    }

    /**
     * Create schema document
     * @param content - Schema content
     * @param owners - Schema owners
     * @param onlyGenesis - Create only a genesis record (no publish or anchor)
     * @param isUnique - Should document be unique?
     */
    static async schemaCreateDoc(content: string, owners: string, onlyGenesis: boolean, isUnique: boolean): Promise<void> {
        try {
            const schemaObj = JSON.parse(content)
            if (!DoctypeUtils.isSchemaValid(schemaObj)) {
                console.error('Invalid schema')
                return
            }
        } catch (e) {
            console.error(e.message)
            return
        }

        return CeramicCliUtils.createDoc('tile', content, owners, onlyGenesis, isUnique)
    }

    /**
     * Change schema document
     * @param schemaDocId - Schema document ID
     * @param content - Schema document content
     * @param owners - Schema document owners
     */
    static async schemaChangeDoc(schemaDocId: string, content: string, owners: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(schemaDocId)) {
            console.error(`Invalid schema docId: ${schemaDocId}`)
            return
        }

        try {
            const schemaObj = JSON.parse(content)
            if (!DoctypeUtils.isSchemaValid(schemaObj)) {
                console.error('Invalid schema')
                return
            }
        } catch (e) {
            console.error(e.message)
            return
        }

        return CeramicCliUtils.change(schemaDocId, content, owners, null)
    }

    /**
     * Validate content against schema document
     * @param schemaDocId - Schema document ID
     * @param content - Content
     */
    static async schemaValidateContent(schemaDocId: string, content: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(schemaDocId)) {
            console.error(`Invalid schema docId: ${schemaDocId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(schemaDocId)

            const parsedContent = CeramicCliUtils._parseContent(content)
            try {
                DoctypeUtils.validate(parsedContent, doc.content)
                console.log('Content is valid')
            } catch (e) {
                console.error(e.message)
            }
        })
    }

    /**
     * Pin document
     * @param docId - Document ID
     */
    static async pinAdd(docId: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const result = await ceramic.pin.add(docId)
            console.log(JSON.stringify(result, null, 2))
        })
    }

    /**
     * Unpin document
     * @param docId - Document ID
     */
    static async pinRm(docId: string): Promise<void> {
        if (!CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const result = await ceramic.pin.rm(docId)
            console.log(JSON.stringify(result, null, 2))
        })
    }

    /**
     * List pinned documents
     * @param docId - optional document ID filter
     */
    static async pinLs(docId?: string): Promise<void> {
        if (docId && !CeramicCliUtils._validateDocId(docId)) {
            console.error(`Invalid docId: ${docId}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const pinnedDocIds = []
            const iterator = await ceramic.pin.ls(docId)
            for await (const id of iterator) {
                pinnedDocIds.push(id)
            }
            console.log(JSON.stringify(pinnedDocIds, null, 2))
        })
    }

    /**
     * Open Ceramic and execute function
     * @param fn - Function to be executed
     * @private
     */
    static async _runWithCeramic(fn: (ceramic: CeramicApi) => Promise<void>): Promise<void> {
        const ceramic = new CeramicClient()
        try {
            await fn(ceramic)
        } catch (e) {
            console.error(e.message)
            process.exit(-1)
        } finally {
            ceramic.close()
        }
    }

    /**
     * Parse input content
     * @param content - Input content
     * @private
     */
    static _parseContent(content: string): any {
        return content == null? null : JSON.parse(content)
    }

    /**
     * Parse input owners
     * @param owners - Input owners
     * @private
     */
    static _parseOwners(owners: string): string[] {
        if (owners == null) {
            return null
        }
        return owners.includes(',') ? owners.split(',') : [owners]
    }

    /**
     * Validate document ID
     * @param docId - Document ID
     * @private
     */
    static _validateDocId(docId: string): string {
        if (docId == null) {
            return null
        }
        const match = docId.match(PREFIX_REGEX)
        return match ? match[0] : null
    }
}
