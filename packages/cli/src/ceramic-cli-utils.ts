import os from 'os'
import path from 'path'
import pc from 'picocolors'
import { randomBytes } from '@stablelib/random'
import * as u8a from 'uint8arrays'

import { promises as fs } from 'fs'

import { Ed25519Provider } from 'key-did-provider-ed25519'
import CeramicClient from '@ceramicnetwork/http-client'
import { CeramicApi, LogLevel, Networks, StreamUtils, SyncOptions } from '@ceramicnetwork/common'
import StreamID, { CommitID } from '@ceramicnetwork/streamid'

import { CeramicDaemon } from './ceramic-daemon'
import { DaemonConfig, IpfsMode, StateStoreMode } from './daemon-config'
import { TileDocument, TileMetadataArgs } from '@ceramicnetwork/stream-tile'

import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'
import { DEFAULT_STATE_STORE_DIRECTORY } from '@ceramicnetwork/core/lib/store/pin-store-factory'

const DEFAULT_DAEMON_CONFIG_FILENAME = 'daemon.config.json'
const DEFAULT_CLI_CONFIG_FILENAME = 'client.config.json'
const LEGACY_CLI_CONFIG_FILENAME = 'config.json' // todo(1615): Remove this backwards compatibility support
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.ceramic')

const DEFAULT_DAEMON_CONFIG = DaemonConfig.fromObject({
  anchor: {},
  'http-api': { 'cors-allowed-origins': [new RegExp('.*')] },
  ipfs: { mode: IpfsMode.BUNDLED },
  logger: { 'log-level': LogLevel.important, 'log-to-files': false },
  network: { name: Networks.TESTNET_CLAY },
  node: {},
  'state-store': {
    mode: StateStoreMode.FS,
    'local-directory': DEFAULT_STATE_STORE_DIRECTORY,
  },
})

/**
 * CLI configuration
 */
interface CliConfig {
  seed?: string
  ceramicHost?: string

  [index: string]: any // allow arbitrary properties
}

/**
 * Ceramic CLI utility functions
 */
export class CeramicCliUtils {
  /**
   * Create CeramicDaemon instance
   * @param configFilePath - Path to daemon config file
   * @param ipfsApi - IPFS api
   * @param ethereumRpc - Ethereum RPC URL. Deprecated, use config file if you want to configure this.
   * @param anchorServiceApi - Anchor service API URL. Deprecated, use config file if you want to configure this.
   * @param ipfsPinningEndpoints - Ipfs pinning endpoints. Deprecated, use config file if you want to configure this.
   * @param stateStoreDirectory - Path to the directory that will be used for storing pinned stream state. Deprecated, use config file if you want to configure this.
   * @param stateStoreS3Bucket - S3 bucket name for storing pinned stream state. Deprecated, use config file if you want to configure this.
   * @param gateway - read only endpoints available. It is disabled by default
   * @param port - port on which daemon is available. Default is 7007
   * @param hostname - hostname to listen on.
   * @param debug - Enable debug logging level
   * @param verbose - Enable verbose logging
   * @param logToFiles - Enable writing logs to files. Deprecated, use config file if you want to configure this.
   * @param logDirectory - Store log files in this directory. Deprecated, use config file if you want to configure this.
   * @param network - The Ceramic network to connect to
   * @param pubsubTopic - Pub/sub topic to use for protocol messages.
   * @param corsAllowedOrigins - Origins for Access-Control-Allow-Origin header. Default is all. Deprecated, use config file if you want to configure this.
   * @param syncOverride - Global forced mode for syncing all streams. Defaults to "prefer-cache". Deprecated, use config file if you want to configure this.
   */
  static async createDaemon(
    configFilePath: string,
    ipfsApi: string,
    ethereumRpc: string,
    anchorServiceApi: string,
    ipfsPinningEndpoints: string[],
    stateStoreDirectory: string,
    stateStoreS3Bucket: string,
    gateway: boolean,
    port: number,
    hostname: string,
    debug: boolean,
    verbose: boolean,
    logToFiles: boolean,
    logDirectory: string,
    network: string,
    pubsubTopic: string,
    corsAllowedOrigins: string,
    syncOverride: string
  ): Promise<CeramicDaemon> {
    const config = await this._loadDaemonConfig()

    {
      // CLI flags override values from config file
      // todo: Make interface for CLI flags, separate flag validation into helper function, separate
      // overriding DaemonConfig with CLI flags into another helper function.
      if (stateStoreDirectory && stateStoreS3Bucket) {
        throw new Error(
          'Cannot specify both --state-store-directory and --state-store-s3-bucket. Only one state store - either on local storage or on S3 - can be used at a time'
        )
      }

      if (anchorServiceApi) {
        config.anchor.anchorServiceUrl = anchorServiceApi
      }
      if (ethereumRpc) {
        config.anchor.ethereumRpcUrl = ethereumRpc
      }
      if (corsAllowedOrigins) {
        config.httpApi.corsAllowedOrigins = corsAllowedOrigins
          .split(' ')
          .map((origin) => new RegExp(origin))
      }
      if (hostname) {
        config.httpApi.hostname = hostname
      }
      if (port) {
        config.httpApi.port = port
      }
      if (ipfsApi) {
        config.ipfs.mode = IpfsMode.REMOTE
        config.ipfs.host = ipfsApi
      }
      if (ipfsPinningEndpoints) {
        config.ipfs.pinningEndpoints = ipfsPinningEndpoints
      }
      if (verbose || debug) {
        const logLevel = verbose ? LogLevel.verbose : debug ? LogLevel.debug : LogLevel.important
        config.logger.logLevel = logLevel
      }
      if (logDirectory) {
        config.logger.logDirectory = logDirectory
      }
      if (logToFiles) {
        config.logger.logToFiles = logToFiles
      }
      if (network) {
        config.network.name = network
      }
      if (pubsubTopic) {
        config.network.pubsubTopic = pubsubTopic
      }
      if (gateway) {
        config.node.gateway = gateway
      }
      if (syncOverride) {
        config.node.syncOverride = syncOverride
      }
      if (stateStoreDirectory) {
        config.stateStore.mode = StateStoreMode.FS
        config.stateStore.localDirectory = stateStoreDirectory
      }
      if (stateStoreS3Bucket) {
        config.stateStore.mode = StateStoreMode.S3
        config.stateStore.s3Bucket = stateStoreS3Bucket
      }
    }

    return CeramicDaemon.create(config)
  }

  /**
   * Internal helper for creating documents
   * @param content - Document content
   * @param controllers - Document controllers
   * @param onlyGenesis - Create only a genesis commit (no publish or anchor)
   * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
   * @param schemaStreamId - Schema document ID
   */
  static async _createDoc(
    content: string,
    controllers: string,
    onlyGenesis: boolean,
    deterministic: boolean,
    schemaStreamId: string = null
  ): Promise<void> {
    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicClient) => {
      const parsedControllers = CeramicCliUtils._parseControllers(controllers)
      const parsedContent = CeramicCliUtils._parseContent(content)
      const metadata = { controllers: parsedControllers, schema: schemaStreamId, deterministic }

      const doc = await TileDocument.create(ceramic, parsedContent, metadata, {
        anchor: !onlyGenesis,
        publish: !onlyGenesis,
      })

      console.log(doc.id)
      console.log(JSON.stringify(doc.content, null, 2))
      depreciationNotice()
    })
  }

  /**
   * Update document
   * @param streamId - Document ID
   * @param content - Document content
   * @param controllers - Document controllers
   * @param schemaCommitId - Optional schema document CommitID
   */
  static async update(
    streamId: string,
    content: string,
    controllers: string,
    schemaCommitId?: string
  ): Promise<void> {
    const id = StreamID.fromString(streamId)
    if (id.type != TileDocument.STREAM_TYPE_ID) {
      throw new Error(
        `CLI does not currently support updating stream types other than 'tile'. StreamID ${id.toString()} has streamtype '${
          id.typeName
        }'`
      )
    }
    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicClient) => {
      const parsedControllers = CeramicCliUtils._parseControllers(controllers)
      const parsedContent = CeramicCliUtils._parseContent(content)

      const doc = await TileDocument.load(ceramic, id)
      const metadata: TileMetadataArgs = { controllers: parsedControllers }
      if (schemaCommitId) {
        const schemaId = CommitID.fromString(schemaCommitId)
        metadata.schema = schemaId
      }
      await doc.update(parsedContent, metadata)

      console.log(JSON.stringify(doc.content, null, 2))
      depreciationNotice()
    })
  }

  /**
   * Show document content
   * @param streamRef - Stream ID
   */
  static async show(streamRef: string): Promise<void> {
    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicApi) => {
      const stream = await TileDocument.load(ceramic, streamRef)
      console.log(JSON.stringify(stream.content, null, 2))
      depreciationNotice()
    })
  }

  /**
   * Show stream state
   * @param streamRef - Stream ID or Commit ID
   */
  static async state(streamRef: string): Promise<void> {
    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicApi) => {
      const stream = await ceramic.loadStream(streamRef)
      console.log(JSON.stringify(StreamUtils.serializeState(stream.state), null, 2))
      depreciationNotice()
    })
  }

  /**
   * Watch document state periodically
   * @param streamId - Stream ID
   */
  static async watch(streamId: string): Promise<void> {
    const id = StreamID.fromString(streamId)

    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicApi) => {
      const doc = await TileDocument.load(ceramic, id)
      console.log(JSON.stringify(doc.content, null, 2))
      depreciationNotice()
      doc.subscribe(() => {
        console.log('--- document changed ---')
        console.log(JSON.stringify(doc.content, null, 2))
      })
    })
  }

  /**
   * Get stream commits
   * @param streamId - Stream ID
   */
  static async commits(streamId: string): Promise<void> {
    const id = StreamID.fromString(streamId)

    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicApi) => {
      const stream = await ceramic.loadStream(id)
      const commits = stream.allCommitIds.map((v) => v.toString())
      console.log(JSON.stringify(commits, null, 2))
      depreciationNotice()
    })
  }

  /**
   * Create non-schema document
   * @param content - Document content
   * @param controllers - Document controllers
   * @param onlyGenesis - Create only a genesis commit (no publish or anchor)
   * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
   * @param schemaStreamId - Schema document ID
   */
  static async nonSchemaCreateDoc(
    content: string,
    controllers: string,
    onlyGenesis: boolean,
    deterministic: boolean,
    schemaStreamId: string = null
  ): Promise<void> {
    return CeramicCliUtils._createDoc(
      content,
      controllers,
      onlyGenesis,
      deterministic,
      schemaStreamId
    )
  }

  /**
   * Create schema document
   * @param content - Schema content
   * @param controllers - Schema controllers
   * @param onlyGenesis - Create only a genesis commit (no publish or anchor)
   * @param deterministic - If true, documents will not be guaranteed to be unique. Documents with identical content will get de-duped.
   */
  static async schemaCreateDoc(
    content: string,
    controllers: string,
    onlyGenesis: boolean,
    deterministic: boolean
  ): Promise<void> {
    // TODO validate schema on the client side
    return CeramicCliUtils._createDoc(content, controllers, onlyGenesis, deterministic)
  }

  /**
   * Update schema document
   * @param schemaStreamId - Schema document ID
   * @param content - Schema document content
   * @param controllers - Schema document controllers
   */
  static async schemaUpdateDoc(
    schemaStreamId: string,
    content: string,
    controllers: string
  ): Promise<void> {
    StreamID.fromString(schemaStreamId)
    // TODO validate schema on the client side
    return CeramicCliUtils.update(schemaStreamId, content, controllers, null)
  }

  /**
   * Pin stream
   * @param streamId - Stream ID
   */
  static async pinAdd(streamId: string): Promise<void> {
    const id = StreamID.fromString(streamId)

    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicApi) => {
      const result = await ceramic.pin.add(id)
      console.log(JSON.stringify(result, null, 2))
      depreciationNotice()
    })
  }

  /**
   * Unpin stream
   * @param streamId - Stream ID
   */
  static async pinRm(streamId: string): Promise<void> {
    const id = StreamID.fromString(streamId)

    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicApi) => {
      const result = await ceramic.pin.rm(id)
      console.log(JSON.stringify(result, null, 2))
      depreciationNotice()
    })
  }

  /**
   * List pinned streams
   * @param streamId - optional stream ID filter
   */
  static async pinLs(streamId?: string): Promise<void> {
    const id = streamId ? StreamID.fromString(streamId) : null

    await CeramicCliUtils._runWithCeramicClient(async (ceramic: CeramicApi) => {
      const pinnedStreamIds = []
      const iterator = await ceramic.pin.ls(id)
      for await (const id of iterator) {
        pinnedStreamIds.push(id)
      }
      console.log(JSON.stringify(pinnedStreamIds, null, 2))
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
      ...threeIdResolver,
      ...keyDidResolver,
    })
    return new DID({ provider, resolver })
  }

  /**
   * Open Ceramic http client and execute function
   * @param fn - Function to be executed
   * @private
   */
  static async _runWithCeramicClient(fn: (ceramic: CeramicClient) => Promise<void>): Promise<void> {
    const cliConfig = await CeramicCliUtils._loadCliConfig()

    if (!cliConfig.seed) {
      cliConfig.seed = u8a.toString(randomBytes(32), 'base16')
      console.log('Identity wallet seed generated')
      await CeramicCliUtils._saveConfig(cliConfig, DEFAULT_CLI_CONFIG_FILENAME)
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
   * Show config used by CLI client.
   */
  static async showCliConfig(): Promise<void> {
    const cliConfig = await this._loadCliConfig()

    console.log(JSON.stringify(cliConfig, null, 2))
    depreciationNotice()
  }

  /**
   * Set field in CLI client config.
   * @param variable - CLI config variable
   * @param value - CLI config variable value
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static async setCliConfig(variable: string, value: any): Promise<void> {
    let cliConfig = await this._loadCliConfig()

    if (cliConfig == null) {
      cliConfig = {}
    }

    Object.assign(cliConfig, {
      [variable]: value,
    })
    await this._saveConfig(cliConfig, DEFAULT_CLI_CONFIG_FILENAME)

    console.log(`Ceramic CLI configuration ${variable} set to ${value}`)
    console.log(JSON.stringify(cliConfig))
    depreciationNotice()
  }

  /**
   * Unset field in CLI client config.
   * @param variable - Name of the configuration variable
   */
  static async unsetCliConfig(variable: string): Promise<void> {
    const cliConfig = await this._loadCliConfig()

    delete cliConfig[variable]
    await this._saveConfig(cliConfig, DEFAULT_CLI_CONFIG_FILENAME)

    console.log(`Ceramic CLI configuration ${variable} unset`)
    console.log(JSON.stringify(cliConfig, null, 2))
    depreciationNotice()
  }

  /**
   * Load configuration file for CLI client.
   * @private
   */
  private static async _loadCliConfig(): Promise<CliConfig> {
    const configFileContents = await CeramicCliUtils._loadCliConfigFileContents()
    if (configFileContents == '') {
      await this._saveConfig({}, DEFAULT_CLI_CONFIG_FILENAME)
      return {}
    }
    return JSON.parse(configFileContents)
  }

  /**
   * Helper function for _loadCliConfig()
   * @private
   */
  private static async _loadCliConfigFileContents(): Promise<string> {
    const fullCliConfigPath = path.join(DEFAULT_CONFIG_PATH, DEFAULT_CLI_CONFIG_FILENAME)
    try {
      await fs.access(fullCliConfigPath)
      return await fs.readFile(fullCliConfigPath, { encoding: 'utf8' })
    } catch (e) {
      // Swallow error
    }

    // If nothing found in default config file path, check legacy path too
    // TODO(1615): Remove this backwards compatibility code
    const legacyCliConfigPath = path.join(DEFAULT_CONFIG_PATH, LEGACY_CLI_CONFIG_FILENAME)
    try {
      await fs.access(legacyCliConfigPath)
      const fileContents = await fs.readFile(legacyCliConfigPath, { encoding: 'utf8' })

      console.warn(
        `Legacy client config file detected at '${legacyCliConfigPath}', renaming to ${fullCliConfigPath}`
      )
      try {
        await fs.rename(legacyCliConfigPath, fullCliConfigPath)
      } catch (err) {
        console.error(`Rename failed: ${err}`)
        throw err
      }
      return fileContents
    } catch (e) {
      // Swallow error
    }
    return ''
  }

  /**
   * Load configuration file for the Ceramic Daemon.
   * @private
   */
  static async _loadDaemonConfig(): Promise<DaemonConfig> {
    const fullDaemonConfigPath = path.join(DEFAULT_CONFIG_PATH, DEFAULT_DAEMON_CONFIG_FILENAME)
    try {
      await fs.access(fullDaemonConfigPath)
    } catch (err) {
      await this._saveConfig(DEFAULT_DAEMON_CONFIG, DEFAULT_DAEMON_CONFIG_FILENAME)
      return DEFAULT_DAEMON_CONFIG
    }

    const fileContents = await fs.readFile(fullDaemonConfigPath, { encoding: 'utf8' })
    return DaemonConfig.fromString(fileContents)
  }

  /**
   * Save configuration file
   * @param config - CLI configuration
   * @param filename - name of the config file
   * @private
   */
  static async _saveConfig(config: Record<string, any>, filename: string): Promise<void> {
    await fs.mkdir(DEFAULT_CONFIG_PATH, { recursive: true }) // create dirs if there are no
    const fullCliConfigPath = path.join(DEFAULT_CONFIG_PATH, filename)

    await fs.writeFile(fullCliConfigPath, JSON.stringify(config, null, 2))
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

const depreciationNotice = () => {
  console.log(
    `${pc.red(pc.bold('This command has been deprecated.'))}
Please use the upgraded Glaze CLI instead. 
Please test with the new CLI before reporting any problems. 
${pc.green('npm i -g @glazed/cli')}`
  )
}
