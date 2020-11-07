import os from "os"
import path from "path"
import { randomBytes } from '@stablelib/random'
import * as u8a from 'uint8arrays'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises

import IdentityWallet from "identity-wallet"
import CeramicClient from "@ceramicnetwork/http-client"
import { CeramicApi, DoctypeUtils } from "@ceramicnetwork/common"
import DocID from '@ceramicnetwork/docid'

import CeramicDaemon, { CreateOpts } from "./ceramic-daemon"

import IPFS from "ipfs"

import dagJose from 'dag-jose'
// @ts-ignore
import multiformats from 'multiformats/basics'
// @ts-ignore
import legacy from 'multiformats/legacy'
import ipfsClient from "ipfs-http-client"
import { IPFSApi } from "./declarations"

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
     * @param debug - Enable debug logging level
     * @param logToFiles - Enable writing logs to files
     * @param logPath - Store log files in this directory
     */
    static async createDaemon(ipfsApi: string, ethereumRpc: string, anchorServiceApi: string, validateDocs: boolean, pinning: string[], stateStorePath: string, gateway: boolean, port: number, debug: boolean, logToFiles: boolean, logPath: string): Promise<CeramicDaemon> {
        if (stateStorePath == null) {
            stateStorePath = DEFAULT_PINNING_STORE_PATH
        }

        const config: CreateOpts = {
            ethereumRpcUrl: ethereumRpc,
            anchorServiceUrl: anchorServiceApi,
            stateStorePath: stateStorePath,
            validateDocs,
            pinning: pinning,
            gateway,
            port,
            debug,
            logToFiles,
            logPath
        }

        multiformats.multicodec.add(dagJose)
        const format = legacy(multiformats, dagJose.name)

        let ipfs: IPFSApi
        if (ipfsApi) {
            ipfs = ipfsClient({ url: ipfsApi, ipld: { formats: [format] } })
        } else {
            ipfs = await IPFS.create({ ipld: { formats: [format] } })
        }

        config.ipfs = ipfs
        return CeramicDaemon.create(config)
    }

    /**
     * Internal helper for creating documents
     * @param doctype - Document type
     * @param content - Document content
     * @param controllers - Document controllers
     * @param onlyGenesis - Create only a genesis record (no publish or anchor)
     * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
     * @param schemaDocId - Schema document ID
     */
    static async _createDoc(doctype: string, content: string, controllers: string, onlyGenesis: boolean, deterministic: boolean, schemaDocId: string = null): Promise<void> {
        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicClient) => {
            const parsedControllers = CeramicCliUtils._parseControllers(controllers)
            const parsedContent = CeramicCliUtils._parseContent(content)

            const params = {
                content: parsedContent,
                metadata: {
                    controllers: parsedControllers, schema: schemaDocId
                },
                deterministic,
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
     * @param controllers - Document controllers
     * @param schemaDocId - Optional schema document ID
     */
    static async change(docId: string, content: string, controllers: string, schemaDocId?: string): Promise<void> {
        const id = DocID.fromString(docId)

        const version = id.version
        if (version) {
            console.error(`No versions allowed. Invalid docId: ${id.toString()}`)
            return
        }

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicClient) => {
            const parsedControllers = CeramicCliUtils._parseControllers(controllers)
            const parsedContent = CeramicCliUtils._parseContent(content)

            const doc = await ceramic.loadDocument(id)
            await doc.change({
                content: parsedContent, metadata: {
                    controllers: parsedControllers, schema: schemaDocId
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
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(id)
            console.log(JSON.stringify(doc.content, null, 2))
        })
    }

    /**
     * Show document state
     * @param docId - Document ID
     */
    static async state(docId: string): Promise<void> {
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(id)
            console.log(JSON.stringify(DoctypeUtils.serializeState(doc.state), null, 2))
        })
    }

    /**
     * Watch document state periodically
     * @param docId - Document ID
     */
    static async watch(docId: string): Promise<void> {
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(id)
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
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const versions = await ceramic.listVersions(id)
            console.log(JSON.stringify(versions, null, 2))
        })
    }

    /**
     * Create non-schema document
     * @param doctype - Document type
     * @param content - Document content
     * @param controllers - Document controllers
     * @param onlyGenesis - Create only a genesis record (no publish or anchor)
     * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
     * @param schemaDocId - Schema document ID
     */
    static async nonSchemaCreateDoc(doctype: string, content: string, controllers: string, onlyGenesis: boolean, deterministic: boolean, schemaDocId: string = null): Promise<void> {
        return CeramicCliUtils._createDoc(doctype, content, controllers, onlyGenesis, deterministic, schemaDocId)
    }

    /**
     * Create schema document
     * @param content - Schema content
     * @param controllers - Schema controllers
     * @param onlyGenesis - Create only a genesis record (no publish or anchor)
     * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
     */
    static async schemaCreateDoc(content: string, controllers: string, onlyGenesis: boolean, deterministic: boolean): Promise<void> {
        // TODO validate schema on the client side
        return CeramicCliUtils._createDoc('tile', content, controllers, onlyGenesis, deterministic)
    }

    /**
     * Change schema document
     * @param schemaDocId - Schema document ID
     * @param content - Schema document content
     * @param controllers - Schema document controllers
     */
    static async schemaChangeDoc(schemaDocId: string, content: string, controllers: string): Promise<void> {
        DocID.fromString(schemaDocId)
        // TODO validate schema on the client side
        return CeramicCliUtils.change(schemaDocId, content, controllers, null)
    }

    /**
     * Pin document
     * @param docId - Document ID
     */
    static async pinAdd(docId: string): Promise<void> {
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const result = await ceramic.pin.add(id)
            console.log(JSON.stringify(result, null, 2))
        })
    }

    /**
     * Unpin document
     * @param docId - Document ID
     */
    static async pinRm(docId: string): Promise<void> {
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const result = await ceramic.pin.rm(id)
            console.log(JSON.stringify(result, null, 2))
        })
    }

    /**
     * List pinned documents
     * @param docId - optional document ID filter
     */
    static async pinLs(docId?: string): Promise<void> {
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const pinnedDocIds = []
            const iterator = await ceramic.pin.ls(id)
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
            cliConfig.seed = u8a.toString(randomBytes(32))
            console.log('Identity wallet seed generated')
            await CeramicCliUtils._saveCliConfig(cliConfig)
        }

        let ceramic
        const { ceramicHost } = cliConfig
        if (ceramicHost !== undefined) {
            ceramic = new CeramicClient(ceramicHost)
        } else {
            ceramic = new CeramicClient()
        }

        const seed = u8a.fromString(cliConfig.seed)
        await IdentityWallet.create({
            getPermission: async (): Promise<Array<string>> => [], seed, ceramic, disableIDX: true,
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
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
     * Parse input content
     * @param content - Input content
     * @private
     */
    static _parseContent(content: string): any {
        return content == null ? null : JSON.parse(content)
    }

    /**
     * Parse input controllers
     * @param controllers - Input controllers
     * @private
     */
    static _parseControllers(controllers: string): string[] {
        if (controllers == null) {
            return []
        }
        return controllers.includes(',') ? controllers.split(',') : [controllers]
    }
}
