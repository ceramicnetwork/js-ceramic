import os from 'os'
import path from 'path'
import { randomBytes } from '@stablelib/random'
import * as u8a from 'uint8arrays'

import { promises as fs } from 'fs'

import { Ed25519Provider } from 'key-did-provider-ed25519'
import CeramicClient from '@ceramicnetwork/http-client'
import { CeramicApi, LogLevel, Networks, StreamUtils, SyncOptions } from '@ceramicnetwork/common'
import StreamID, { CommitID } from '@ceramicnetwork/streamid'

import { CeramicDaemon } from './ceramic-daemon'
import { DaemonConfig, StateStoreMode } from './daemon-config'
import { TileDocument, TileMetadataArgs } from '@ceramicnetwork/stream-tile'

import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { DID } from 'dids'

const DEFAULT_DAEMON_CONFIG_FILE = 'daemon.config.json'
const DEFAULT_CLI_CONFIG_FILE = 'client.config.json'
const LEGACY_CLI_CONFIG_FILE = 'config.json' // todo(1615): Remove this backwards compatibility support
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.ceramic')

const DEFAULT_DAEMON_CONFIG: DaemonConfig = {
  network: { name: Networks.TESTNET_CLAY },
}

const SYNC_OPTIONS_MAP = {
  'prefer-cache': SyncOptions.PREFER_CACHE,
  'sync-always': SyncOptions.SYNC_ALWAYS,
  'never-sync': SyncOptions.NEVER_SYNC,
}

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
   * @param ethereumRpc - Ethereum RPC URL
   * @param anchorServiceApi - Anchor service API URL
   * @param validateStreams - Validate streams according to schemas or not
   * @param ipfsPinningEndpoints - Ipfs pinning endpoints
   * @param stateStoreDirectory - Path to the directory that will be used for storing pinned stream state
   * @param stateStoreS3Bucket - S3 bucket name for storing pinned stream state
   * @param gateway - read only endpoints available. It is disabled by default
   * @param port - port on which daemon is available. Default is 7007
   * @param hostname - hostname to listen on.
   * @param debug - Enable debug logging level
   * @param verbose - Enable verbose logging
   * @param logToFiles - Enable writing logs to files
   * @param logDirectory - Store log files in this directory
   * @param network - The Ceramic network to connect to
   * @param pubsubTopic - Pub/sub topic to use for protocol messages.
   * @param corsAllowedOrigins - Origins for Access-Control-Allow-Origin header. Default is all
   * @param syncOverride - Global forced mode for syncing all streams. Defaults to "prefer-cache"
   */
  static async createDaemon(
    configFilePath: string,
    ipfsApi: string,
    ethereumRpc: string,
    anchorServiceApi: string,
    validateStreams: boolean,
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
    const configFromFile = await this._loadDaemonConfig()

    let configFromCli: DaemonConfig
    {
      let _corsAllowedOrigins: string | RegExp[] = '*'
      if (corsAllowedOrigins != null && corsAllowedOrigins != '*') {
        _corsAllowedOrigins = corsAllowedOrigins.split(' ').map((origin) => new RegExp(origin))
      }
      const logLevel = verbose ? LogLevel.verbose : debug ? LogLevel.debug : LogLevel.important
      const _syncOverride = SYNC_OPTIONS_MAP[syncOverride]

      if (stateStoreDirectory && stateStoreS3Bucket) {
        throw new Error(
          'Cannot specify both --state-store-directory and --state-store-s3-bucket. Only one state store - either on local storage or on S3 - can be used at a time'
        )
      }
      const stateStoreMode = stateStoreS3Bucket ? StateStoreMode.S3 : StateStoreMode.FS

      configFromCli = {
        anchor: {
          anchorServiceUrl: anchorServiceApi,
          ethereumRpcUrl: ethereumRpc,
        },
        httpApi: {
          corsAllowedOrigins: _corsAllowedOrigins,
          hostname,
          port,
        },
        ipfs: {
          host: ipfsApi,
          pinningEndpoints: ipfsPinningEndpoints,
        },
        logger: {
          logDirectory,
          logLevel,
          logToFiles,
        },
        network: {
          name: network,
          pubsubTopic,
        },
        node: {
          gateway,
          syncOverride: _syncOverride,
          validateStreams,
        },
        stateStore: {
          mode: stateStoreMode,
          localDirectory: stateStoreDirectory,
          s3Bucket: stateStoreS3Bucket,
        },
      }

      // Filter out undefined flags
      configFromCli = this.removeUndefinedFields(configFromCli)
    }

    const config = Object.assign(configFromFile, configFromCli)
    return CeramicDaemon.create(config)
  }

  static removeUndefinedFields(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => {
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            return [k, this.removeUndefinedFields(v)]
          } else {
            return [k, v]
          }
        })
        .filter(([k, v]) => v !== undefined)
    )
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
      await CeramicCliUtils._saveConfig(cliConfig, DEFAULT_CLI_CONFIG_FILE)
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
    await this._saveConfig(cliConfig, DEFAULT_CLI_CONFIG_FILE)

    console.log(`Ceramic CLI configuration ${variable} set to ${value}`)
    console.log(JSON.stringify(cliConfig))
  }

  /**
   * Unset field in CLI client config.
   * @param variable - Name of the configuration variable
   */
  static async unsetCliConfig(variable: string): Promise<void> {
    const cliConfig = await this._loadCliConfig()

    delete cliConfig[variable]
    await this._saveConfig(cliConfig, DEFAULT_CLI_CONFIG_FILE)

    console.log(`Ceramic CLI configuration ${variable} unset`)
    console.log(JSON.stringify(cliConfig, null, 2))
  }

  /**
   * Load configuration file for CLI client.
   * @private
   */
  private static async _loadCliConfig(): Promise<CliConfig> {
    const configFileContents = await CeramicCliUtils._loadCliConfigFileContents()
    if (configFileContents == '') {
      await this._saveConfig({}, DEFAULT_CLI_CONFIG_FILE)
      return {}
    }
    return JSON.parse(configFileContents)
  }

  /**
   * Helper function for _loadCliConfig()
   * @private
   */
  private static async _loadCliConfigFileContents(): Promise<string> {
    const fullCliConfigPath = path.join(DEFAULT_CONFIG_PATH, DEFAULT_CLI_CONFIG_FILE)
    try {
      await fs.access(fullCliConfigPath)
      return await fs.readFile(fullCliConfigPath, { encoding: 'utf8' })
    } catch (e) {
      // Swallow error
    }

    // If nothing found in default config file path, check legacy path too
    // TODO(1615): Remove this backwards compatibility code
    const legacyCliConfigPath = path.join(DEFAULT_CONFIG_PATH, LEGACY_CLI_CONFIG_FILE)
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
    const fullDaemonConfigPath = path.join(DEFAULT_CONFIG_PATH, DEFAULT_DAEMON_CONFIG_FILE)
    try {
      await fs.access(fullDaemonConfigPath)
    } catch (err) {
      await this._saveConfig(DEFAULT_DAEMON_CONFIG, DEFAULT_DAEMON_CONFIG_FILE)
      return DEFAULT_DAEMON_CONFIG
    }

    return JSON.parse(await fs.readFile(fullDaemonConfigPath, { encoding: 'utf8' }))
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
