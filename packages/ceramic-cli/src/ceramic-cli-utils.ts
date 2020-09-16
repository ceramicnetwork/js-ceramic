import os from "os"
import path from "path"
import { randomBytes } from '@stablelib/random'

const fs = require('fs').promises

import IdentityWallet from "identity-wallet"
import CeramicClient from "@ceramicnetwork/ceramic-http-client"
import { CeramicApi, DoctypeUtils } from "@ceramicnetwork/ceramic-common"

import CeramicDaemon from "./ceramic-daemon"

import Ipfs from "ipfs"

import dagJose from 'dag-jose'
// @ts-ignore
import multiformats from 'multiformats/basics'
// @ts-ignore
import legacy from 'multiformats/legacy'

const PREFIX_REGEX = /^ceramic:\/\/|^\/ceramic\//

const DEFAULT_CLI_CONFIG_FILE = 'config.json'
export const DEFAULT_PINNING_STORE_PATH = ".pinning.store"
const DEFAULT_CLI_CONFIG_PATH = path.join(os.homedir(), '.ceramic')

/**
 * CLI configuration
 */
interface CliConfig {
    seed?: string;
    ceramicHost?: string;

    [index: string]: any; // allow arbitrary properties
}

/**
 * Ceramic CLI utility functions
 */
export class CeramicCliUtils {

    /**
     * Create CeramicDaemon instance
     * @param ipfsApi - IPFS api
     * @param ethereumRpc - Ethereum RPC URL
     * @param anchorServiceApi - Anchor service API URL
     * @param validateDocs - Validate docs according to schemas or not
     * @param pinning - Pinning endpoint
     * @param stateStorePath - State store path
     * @param gateway - read only endpoints available. It is disabled by default
     * @param port - port daemon is availabe. Default is 7007
     */
    static async createDaemon(ipfsApi: string, ethereumRpc: string, anchorServiceApi: string, validateDocs: boolean, pinning: string[], stateStorePath: string, gateway: boolean, port: number): Promise<CeramicDaemon> {
        if (stateStorePath == null) {
            stateStorePath = DEFAULT_PINNING_STORE_PATH
        }

        const config = {
            ethereumRpcUrl: ethereumRpc,
            anchorServiceUrl: anchorServiceApi,
            stateStorePath: stateStorePath,
            validateDocs,
            pinning: pinning,
            gateway,
            port
        }

        if (ipfsApi) {
            Object.assign(config, {
                ipfsHost: ipfsApi,
            })
        } else {
            multiformats.multicodec.add(dagJose)
            const format = legacy(multiformats, dagJose.name)

            Object.assign(config, {
                ipfs: await Ipfs.create({ ipld: { formats: [format] } })
            })
        }

        return CeramicDaemon.create(config)
    }

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
        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicClient) => {
            const parsedOwners = CeramicCliUtils._parseOwners(owners)
            const parsedContent = CeramicCliUtils._parseContent(content)

            const params = {
                content: parsedContent, metadata: {
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

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicClient) => {
            const parsedOwners = CeramicCliUtils._parseOwners(owners)
            const parsedContent = CeramicCliUtils._parseContent(content)

            const doc = await ceramic.loadDocument(docId)
            await doc.change({
                content: parsedContent, metadata: {
                    owners: parsedOwners, schema: schemaDocId
                }
            })

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
    static async _runWithCeramic(fn: (ceramic: CeramicClient) => Promise<void>): Promise<void> {
        const cliConfig = await CeramicCliUtils._loadCliConfig()

        if (!cliConfig.seed) {
            cliConfig.seed = CeramicCliUtils._generateSeed()
            await CeramicCliUtils._saveCliConfig(cliConfig)
        }

        let ceramic
        const { ceramicHost } = cliConfig
        if (ceramicHost !== undefined) {
            ceramic = new CeramicClient(ceramicHost)
        } else {
            ceramic = new CeramicClient()
        }

        await IdentityWallet.create({
            getPermission: async (): Promise<Array<string>> => [], seed: cliConfig.seed, ceramic,
        })

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
     * Set Ceramic Daemon host
     */
    static async showConfig(): Promise<void> {
        const cliConfig = await this._loadCliConfig()

        console.log(JSON.stringify(cliConfig, null, 2))
    }

    /**
     * Set Ceramic Daemon host
     * @param variable - CLI config variable
     * @param value - CLI config variable value
     */
    static async setConfig(variable: string, value: any): Promise<void> {
        let cliConfig = await this._loadCliConfig()

        if (cliConfig == null) {
            cliConfig = {}
        }

        Object.assign(cliConfig, {
            [variable]: value
        })
        await this._saveCliConfig(cliConfig)

        console.log(`Ceramic CLI configuration ${variable} set to ${value}`)
        console.log(JSON.stringify(cliConfig))
    }

    /**
     * Set Ceramic Daemon host
     * @param variable - Name of the configuration variable
     */
    static async unsetConfig(variable: string): Promise<void> {
        const cliConfig = await this._loadCliConfig()

        delete cliConfig[variable]
        await this._saveCliConfig(cliConfig)

        console.log(`Ceramic CLI configuration ${variable} unset`)
        console.log(JSON.stringify(cliConfig, null, 2))
    }

    /**
     * Load CLI configuration file
     * @private
     */
    static async _loadCliConfig(): Promise<CliConfig> {
        const fullCliConfigPath = path.join(DEFAULT_CLI_CONFIG_PATH, DEFAULT_CLI_CONFIG_FILE)
        try {
            await fs.access(fullCliConfigPath)
            return JSON.parse(await fs.readFile(fullCliConfigPath, { encoding: 'utf8' }))
        } catch (e) {
            // TODO handle invalid configuration
        }
        return await this._saveCliConfig({})
    }

    /**
     * Save CLI configuration file
     * @param cliConfig - CLI configuration
     * @private
     */
    static async _saveCliConfig(cliConfig: CliConfig): Promise<CliConfig> {
        await fs.mkdir(DEFAULT_CLI_CONFIG_PATH, { recursive: true }) // create dirs if there are no
        const fullCliConfigPath = path.join(DEFAULT_CLI_CONFIG_PATH, DEFAULT_CLI_CONFIG_FILE)

        await fs.writeFile(fullCliConfigPath, JSON.stringify(cliConfig, null, 2))
        return cliConfig
    }

    /**
     * Generate new seed
     * @private
     */
    static _generateSeed(): string {
        const seed = '0x' + Buffer.from(randomBytes(32)).toString('hex')
        console.log('Identity wallet seed generated')
        return seed
    }

    /**
     * Parse input content
     * @param content - Input content
     * @private
     */
    static _parseContent(content: string): any {
        return content == null ? null : JSON.parse(content)
    }

    /**
     * Parse input owners
     * @param owners - Input owners
     * @private
     */
    static _parseOwners(owners: string): string[] {
        if (owners == null) {
            return [ ]
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
