import os from 'os'
import path from 'path'
import { randomBytes } from '@stablelib/random'
import * as u8a from 'uint8arrays'

import { promises as fs } from 'fs'

import { Ed25519Provider } from 'key-did-provider-ed25519'
import CeramicClient from '@ceramicnetwork/http-client'
import { CeramicApi, DoctypeUtils, LoggerConfig, LogLevel, Networks } from '@ceramicnetwork/common'
import DocID, {CommitID} from '@ceramicnetwork/docid'

import CeramicDaemon, { CreateOpts } from './ceramic-daemon'
import { TileDoctype } from "@ceramicnetwork/doctype-tile";

import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from "did-resolver"
import { DID } from 'dids'

const DEFAULT_CLI_CONFIG_FILE = 'config.json'
const DEFAULT_CLI_CONFIG_PATH = path.join(os.homedir(), '.ceramic')
const DEFAULT_NETWORK = Networks.TESTNET_CLAY

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
     * @param ipfsPinningEndpoints - Ipfs pinning endpoints
     * @param stateStoreDirectory - Path to the directory that will be used for storing pinned document state
     * @param stateStoreS3Bucket - S3 bucket name for storing pinned document state
     * @param gateway - read only endpoints available. It is disabled by default
     * @param port - port daemon is availabe. Default is 7007
     * @param debug - Enable debug logging level
     * @param verbose - Enable verbose logging
     * @param logToFiles - Enable writing logs to files
     * @param logDirectory - Store log files in this directory
     * @param network - The Ceramic network to connect to
     * @param pubsubTopic - Pub/sub topic to use for protocol messages.
     * @param corsAllowedOrigins - Origins for Access-Control-Allow-Origin header. Default is all
     */
    static async createDaemon(
        ipfsApi: string,
        ethereumRpc: string,
        anchorServiceApi: string,
        validateDocs: boolean,
        ipfsPinningEndpoints: string[],
        stateStoreDirectory: string,
        stateStoreS3Bucket: string,
        gateway: boolean,
        port: number,
        debug: boolean,
        verbose: boolean,
        logToFiles: boolean,
        logDirectory: string,
        network = DEFAULT_NETWORK,
        pubsubTopic: string,
        corsAllowedOrigins: string
    ): Promise<CeramicDaemon> {
        let _corsAllowedOrigins: string | RegExp[] = '*'
        if (corsAllowedOrigins != null && corsAllowedOrigins != '*') {
            _corsAllowedOrigins = corsAllowedOrigins.split(' ').map((origin) => new RegExp(origin))
        }
        const logLevel = verbose ? LogLevel.verbose : (debug ? LogLevel.debug : LogLevel.important)
        const loggerConfig: LoggerConfig = {
          logToFiles,
          logDirectory,
          logLevel,
        }

        const config: CreateOpts = {
            ethereumRpcUrl: ethereumRpc,
            anchorServiceUrl: anchorServiceApi,
            stateStoreDirectory,
            s3StateStoreBucket: stateStoreS3Bucket,
            validateDocs,
            ipfsPinningEndpoints,
            gateway,
            port,
            loggerConfig,
            network,
            pubsubTopic,
            corsAllowedOrigins: _corsAllowedOrigins,
            ipfsHost: ipfsApi,
        }
        return CeramicDaemon.create(config)
    }

    /**
     * Internal helper for creating documents
     * @param doctype - Document type
     * @param content - Document content
     * @param controllers - Document controllers
     * @param onlyGenesis - Create only a genesis commit (no publish or anchor)
     * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
     * @param schemaDocId - Schema document ID
     */
    static async _createDoc(doctype: string, content: string, controllers: string, onlyGenesis: boolean, deterministic: boolean, schemaDocId: string = null): Promise<void> {
        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicClient) => {
            const parsedControllers = CeramicCliUtils._parseControllers(controllers)
            const parsedContent = CeramicCliUtils._parseContent(content)
            const metadata = { controllers: parsedControllers, schema: schemaDocId, deterministic }

            const doc = await TileDoctype.create(ceramic, parsedContent, metadata, {
                anchor: !onlyGenesis,
                publish: !onlyGenesis,
            })

            console.log(doc.id)
            console.log(JSON.stringify(doc.content, null, 2))
        })
    }

    /**
     * Update document
     * @param docId - Document ID
     * @param content - Document content
     * @param controllers - Document controllers
     * @param schemaCommitId - Optional schema document CommitID
     */
    static async update(docId: string, content: string, controllers: string, schemaCommitId?: string): Promise<void> {
        const id = DocID.fromString(docId)
        if (id.type != TileDoctype.DOCTYPE_ID) {
            throw new Error(`CLI does not currently support updating doctypes other than 'tile'. DocID ${id.toString()} has doctype '${id.typeName}'`)
        }
        const schemaId = CommitID.fromString(schemaCommitId)
        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicClient) => {
            const parsedControllers = CeramicCliUtils._parseControllers(controllers)
            const parsedContent = CeramicCliUtils._parseContent(content)

            const doc = await TileDoctype.load(ceramic, id)
            await doc.update(parsedContent, { controllers: parsedControllers, schema: schemaId })

            console.log(JSON.stringify(doc.content, null, 2))
        })
    }

    /**
     * Show document content
     * @param docRef - Document ID
     */
    static async show(docRef: string): Promise<void> {
        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await TileDoctype.load(ceramic, docRef)
            console.log(JSON.stringify(doc.content, null, 2))
        })
    }

    /**
     * Show document state
     * @param docRef - Document ID or Commit ID
     */
    static async state(docRef: string): Promise<void> {
        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(docRef)
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
            const doc = await TileDoctype.load(ceramic, id)
            console.log(JSON.stringify(doc.content, null, 2))
            doc.subscribe(() => {
              console.log('--- document changed ---')
              console.log(JSON.stringify(doc.content, null, 2))
            })
        })
    }

    /**
     * Get document commits
     * @param docId - Document ID
     */
    static async commits(docId: string): Promise<void> {
        const id = DocID.fromString(docId)

        await CeramicCliUtils._runWithCeramic(async (ceramic: CeramicApi) => {
            const doc = await ceramic.loadDocument(id)
            const commits = doc.allCommitIds.map(v => v.toString())
            console.log(JSON.stringify(commits, null, 2))
        })
    }

    /**
     * Create non-schema document
     * @param doctype - Document type
     * @param content - Document content
     * @param controllers - Document controllers
     * @param onlyGenesis - Create only a genesis commit (no publish or anchor)
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
     * @param onlyGenesis - Create only a genesis commit (no publish or anchor)
     * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
     */
    static async schemaCreateDoc(content: string, controllers: string, onlyGenesis: boolean, deterministic: boolean): Promise<void> {
        // TODO validate schema on the client side
        return CeramicCliUtils._createDoc('tile', content, controllers, onlyGenesis, deterministic)
    }

    /**
     * Update schema document
     * @param schemaDocId - Schema document ID
     * @param content - Schema document content
     * @param controllers - Schema document controllers
     */
    static async schemaUpdateDoc(schemaDocId: string, content: string, controllers: string): Promise<void> {
        DocID.fromString(schemaDocId)
        // TODO validate schema on the client side
        return CeramicCliUtils.update(schemaDocId, content, controllers, null)
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
        const id = docId ? DocID.fromString(docId) : null

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
     * Creates an Ed25519-based key-did from a given seed for use with the CLI. The DID instance
     * has a KeyDidResolver and ThreeIdResolver pre-loaded so that the Ceramic daemon will be
     * able to resolve both 'did:key' and 'did:3' DIDs.
     * @param seed
     * @param ceramic
     */
    static _makeDID(seed: Uint8Array, ceramic: CeramicClient): DID {
        const provider = new Ed25519Provider(seed)

        const keyDidResolver = KeyDidResolver.getResolver()
        const threeIdResolver = ThreeIdResolver.getResolver(ceramic)
        const resolver = new Resolver({
            ...threeIdResolver, ...keyDidResolver,
        })
        return new DID({ provider, resolver })
    }

    /**
     * Open Ceramic and execute function
     * @param fn - Function to be executed
     * @private
     */
    static async _runWithCeramic(fn: (ceramic: CeramicClient) => Promise<void>): Promise<void> {
        const cliConfig = await CeramicCliUtils._loadCliConfig()

        if (!cliConfig.seed) {
            cliConfig.seed = u8a.toString(randomBytes(32), 'base16')
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

        const seed = u8a.fromString(cliConfig.seed, 'base16')
        await ceramic.setDID(CeramicCliUtils._makeDID(seed, ceramic))

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
    static _parseControllers(controllers: string): string[] | undefined {
        if (controllers == null) {
            return undefined
        }
        return controllers.includes(',') ? controllers.split(',') : [controllers]
    }
}
