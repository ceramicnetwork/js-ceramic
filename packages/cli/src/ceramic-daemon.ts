import * as fs from 'fs'
import express, { Request, Response } from 'express'
import { Ceramic, CeramicConfig } from '@ceramicnetwork/core'
import { RotatingFileStream } from '@ceramicnetwork/logger'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import { buildIpfsConnection } from './build-ipfs-connection.util.js'
import {
  DiagnosticsLogger,
  LoggerProvider,
  LogStyle,
  MultiQuery,
  StreamUtils,
  SyncOptions,
} from '@ceramicnetwork/common'
import { StreamID, StreamType } from '@ceramicnetwork/streamid'
import * as ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import * as PkhDidResolver from 'pkh-did-resolver'
import EthrDidResolver from 'ethr-did-resolver'
import * as NftDidResolver from 'nft-did-resolver'
import * as SafeDidResolver from 'safe-did-resolver'

import { DID } from 'dids'
import cors from 'cors'
import { errorHandler } from './daemon/error-handler.js'
import { addAsync, ExpressWithAsync } from '@awaitjs/express'
import { instrumentRequests } from './daemon/instrument-requests.js'
import { logRequests } from './daemon/log-requests.js'
import type { Server } from 'http'
import { DaemonConfig, StateStoreMode } from './daemon-config.js'
import type { ResolverRegistry } from 'did-resolver'
import { ErrorHandlingRouter } from './error-handling-router.js'
import { collectionQuery, countQuery } from './daemon/collection-queries.js'
import { StatusCodes } from 'http-status-codes'
import crypto from 'crypto'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
import lru from 'lru_map'
import { S3Store } from './s3-store.js'

const DEFAULT_HOSTNAME = '0.0.0.0'
const DEFAULT_PORT = 7007
const HEALTHCHECK_RETRIES = 3
const CALLER_NAME = 'js-ceramic'

const ADMIN_CODE_EXPIRATION_TIMEOUT = 1000 * 60 * 1 // 1 min
const ADMIN_CODE_CACHE_CAPACITY = 50

const STREAM_PINNED = 'stream_pinned'
const STREAM_UNPINNED = 'stream_unpinned'

type AdminCode = string
type Timestamp = number

interface MultiQueryWithDocId extends MultiQuery {
  docId?: string
}

interface MultiQueries {
  queries: Array<MultiQueryWithDocId>
  timeout?: number
}

const SYNC_OPTIONS_MAP = {
  'prefer-cache': SyncOptions.PREFER_CACHE,
  'sync-always': SyncOptions.SYNC_ALWAYS,
  'never-sync': SyncOptions.NEVER_SYNC,
}

export function makeCeramicConfig(opts: DaemonConfig): CeramicConfig {
  const loggerProvider = new LoggerProvider(opts.logger, (logPath: string) => {
    return new RotatingFileStream(logPath, true)
  })

  // If desired, enable metrics
  if (opts.metrics?.metricsExporterEnabled && opts.metrics?.collectorHost) {
    Metrics.start(opts.metrics.collectorHost, CALLER_NAME)
  }

  const ceramicConfig: CeramicConfig = {
    loggerProvider,
    gateway: opts.node.gateway || false,
    anchorServiceUrl: opts.anchor.anchorServiceUrl,
    ethereumRpcUrl: opts.anchor.ethereumRpcUrl,
    ipfsPinningEndpoints: opts.ipfs.pinningEndpoints,
    networkName: opts.network.name,
    pubsubTopic: opts.network.pubsubTopic,
    syncOverride: SYNC_OPTIONS_MAP[opts.node.syncOverride],
    streamCacheLimit: opts.node.streamCacheLimit,
    indexing: opts.indexing,
  }
  if (opts.stateStore?.mode == StateStoreMode.FS) {
    ceramicConfig.stateStoreDirectory = opts.stateStore.localDirectory
  }

  return ceramicConfig
}

/**
 * Takes a query object and parses the values to give them proper types instead of having everything
 * as strings
 * @param opts
 */
function parseQueryObject(opts: Record<string, any>): Record<string, string | boolean | number> {
  const typedOpts = {}
  for (const [key, value] of Object.entries(opts)) {
    if (typeof value == 'string') {
      if (value[0] == '{') {
        // value is a sub-object
        typedOpts[key] = parseQueryObject(JSON.parse(value))
      } else if (value === 'true') {
        typedOpts[key] = true
      } else if (value === 'false') {
        typedOpts[key] = false
      } else if (!isNaN(parseInt(value))) {
        typedOpts[key] = parseInt(value)
      } else {
        typedOpts[key] = value
      }
    } else {
      typedOpts[key] = value
    }
  }
  return typedOpts
}

/**
 * Converts 'sync' option sent as a bool by outdated http-clients to the current format of an enum.
 * The old behaviors don't map directly to the new behaviors, so we take the best approximation.
 * TODO remove this once we no longer need to support clients older than v1.0.0
 * @param opts
 */
function upconvertLegacySyncOption(opts: Record<string, any> | undefined) {
  if (typeof opts?.sync == 'boolean') {
    if (opts.sync) {
      opts.sync = SyncOptions.SYNC_ALWAYS
    } else {
      opts.sync = SyncOptions.PREFER_CACHE
    }
  }
}

/**
 * Prepare DID resolvers to use in the daemon.
 */
function makeResolvers(
  ceramic: Ceramic,
  ceramicConfig: CeramicConfig,
  opts: DaemonConfig
): ResolverRegistry {
  let result = {
    ...KeyDidResolver.getResolver(),
    ...PkhDidResolver.getResolver(),
    ...ThreeIdResolver.getResolver(ceramic),
    ...NftDidResolver.getResolver({
      ceramic: ceramic,
      ...opts.didResolvers?.nftDidResolver,
    }),
    ...SafeDidResolver.getResolver({
      ceramic: ceramic,
      ...opts.didResolvers?.safeDidResolver,
    }),
  }
  if (
    opts.didResolvers?.ethrDidResolver?.networks &&
    opts.didResolvers?.ethrDidResolver?.networks.length > 0
  ) {
    // Custom ethr-did-resolver configuration passed
    result = { ...result, ...EthrDidResolver.getResolver(opts.didResolvers.ethrDidResolver) }
  } else if (ceramicConfig.ethereumRpcUrl) {
    // Use default network from ceramic config's ethereumRpcUrl
    result = {
      ...result,
      ...EthrDidResolver.getResolver({
        networks: [
          {
            rpcUrl: ceramicConfig.ethereumRpcUrl,
          },
        ],
      }),
    }
  }
  return result
}

/**
 * Helper function: Parse provided port and verify validity or exit process
 * @param inPort
 */
function validatePort(inPort) {
  const validPort = Number(inPort)
  if (inPort == null) {
    return inPort
  } else if (isNaN(validPort) || validPort > 65535) {
    console.error('Invalid port number passed.')
    process.exit(1)
  }
  return validPort
}

/**
 * Contents an authorization header signed by an admin DID
 */
type AdminAPIJWSContents = {
  kid: string
  code: string
  requestPath: string
  models: Array<string>
}

type AdminApiJWSValidationResult = {
  kid?: string
  code?: string
  models?: Array<StreamID>
  error?: string
}

type AdminApiModelMutationMethod = (modelIDs: Array<StreamID>) => Promise<void>

/**
 * Ceramic daemon implementation
 */
export class CeramicDaemon {
  private server?: Server
  private readonly app: ExpressWithAsync
  readonly diagnosticsLogger: DiagnosticsLogger
  public hostname: string
  public port: number
  private readonly adminDids: Array<string>
  private readonly adminCodeCache = new lru.LRUMap<AdminCode, Timestamp>(ADMIN_CODE_CACHE_CAPACITY)

  constructor(public ceramic: Ceramic, private readonly opts: DaemonConfig) {
    this.diagnosticsLogger = ceramic.loggerProvider.getDiagnosticsLogger()
    this.port = validatePort(this.opts.httpApi?.port) || DEFAULT_PORT
    this.hostname = this.opts.httpApi?.hostname || DEFAULT_HOSTNAME
    this.adminDids = this.opts.httpApi?.adminDids || []

    this.app = addAsync(express())
    this.app.set('trust proxy', true)
    this.app.use(express.json({ limit: '1mb' }))
    this.app.use(
      cors({
        origin: opts.httpApi?.corsAllowedOrigins,
        maxAge: 7200, // 2 hours
      })
    )

    this.app.use(instrumentRequests)

    this.app.use(logRequests(ceramic.loggerProvider))

    this.registerAPIPaths(this.app, opts.node?.gateway)

    this.app.use(errorHandler(this.diagnosticsLogger))
  }

  async listen(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.server = this.app.listen(this.port, this.hostname, () => {
        this.diagnosticsLogger.imp(`Ceramic API running on ${this.hostname}:${this.port}'`)
        resolve()
      })
      this.server.keepAliveTimeout = 60 * 1000
    })
  }

  /**
   * Create Ceramic daemon
   * @param opts - Ceramic daemon options
   */
  static async create(opts: DaemonConfig): Promise<CeramicDaemon> {
    const ceramicConfig = makeCeramicConfig(opts)

    const ipfs = await buildIpfsConnection(
      opts.ipfs.mode,
      opts.network?.name,
      ceramicConfig.loggerProvider.getDiagnosticsLogger(),
      opts.ipfs?.host
    )

    const [modules, params] = Ceramic._processConfig(ipfs, ceramicConfig)
    const diagnosticsLogger = modules.loggerProvider.getDiagnosticsLogger()
    diagnosticsLogger.imp(
      `Starting Ceramic Daemon at version ${packageJson.version} with config: \n${JSON.stringify(
        opts,
        null,
        2
      )}`
    )
    const ipfsId = await ipfs.id()
    diagnosticsLogger.imp(
      `Connecting to IPFS node available as ${ipfsId.addresses.map(String).join(', ')}`
    )

    const ceramic = new Ceramic(modules, params)
    if (opts.stateStore?.mode == StateStoreMode.S3) {
      const s3Store = new S3Store(opts.stateStore?.s3Bucket, params.networkOptions.name)
      await ceramic.repository.injectStateStore(s3Store)
    }
    const did = new DID({ resolver: makeResolvers(ceramic, ceramicConfig, opts) })
    ceramic.did = did
    await ceramic._init(true)

    const daemon = new CeramicDaemon(ceramic, opts)
    await daemon.listen()
    return daemon
  }

  registerAPIPaths(app: ExpressWithAsync, gateway: boolean): void {
    const baseRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const commitsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const documentsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const multiqueriesRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const nodeRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const pinsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const recordsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const streamsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const collectionRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminCodesRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminModelRouter = ErrorHandlingRouter(this.diagnosticsLogger)

    app.use('/api/v0', baseRouter)
    baseRouter.use('/commits', commitsRouter)
    baseRouter.use('/documents', documentsRouter)
    baseRouter.use('/multiqueries', multiqueriesRouter)
    baseRouter.use('/node', nodeRouter)
    baseRouter.use('/pins', pinsRouter)
    baseRouter.use('/records', recordsRouter)
    baseRouter.use('/streams', streamsRouter)
    baseRouter.use('/collection', collectionRouter)
    baseRouter.use('/admin/getCode', adminCodesRouter)
    baseRouter.use('/admin/models', adminModelRouter)

    commitsRouter.getAsync('/:streamid', this.commits.bind(this))
    multiqueriesRouter.postAsync('/', this.multiQuery.bind(this))
    streamsRouter.getAsync('/:streamid', this.state.bind(this))
    streamsRouter.getAsync('/:streamid/content', this.content.bind(this))
    pinsRouter.getAsync('/:streamid', this.listPinned.bind(this))
    pinsRouter.getAsync('/', this.listPinned.bind(this))
    nodeRouter.getAsync('/chains', this.getSupportedChains.bind(this))
    nodeRouter.getAsync('/healthcheck', this.healthcheck.bind(this))
    documentsRouter.getAsync('/:docid', this.stateOld.bind(this)) // Deprecated
    recordsRouter.getAsync('/:streamid', this.commits.bind(this)) // Deprecated
    collectionRouter.getAsync('/', this.getCollection_get.bind(this)) // Deprecated
    collectionRouter.postAsync('/', this.getCollection_post.bind(this))
    collectionRouter.getAsync('/count', this.getCollectionCount_get.bind(this)) // Deprecated
    collectionRouter.postAsync('/count', this.getCollectionCount_post.bind(this))
    adminCodesRouter.getAsync('/', this.getAdminCode.bind(this))
    adminModelRouter.getAsync('/', this.getIndexedModels.bind(this))
    adminModelRouter.postAsync('/', this.startIndexingModels.bind(this))
    adminModelRouter.deleteAsync('/', this.stopIndexingModels.bind(this))

    if (!gateway) {
      streamsRouter.postAsync('/', this.createStreamFromGenesis.bind(this))
      streamsRouter.postAsync('/:streamid/anchor', this.requestAnchor.bind(this))
      commitsRouter.postAsync('/', this.applyCommit.bind(this))
      pinsRouter.postAsync('/:streamid', this.pinStream.bind(this))
      pinsRouter.deleteAsync('/:streamid', this.unpinStream.bind(this))

      documentsRouter.postAsync('/', this.createDocFromGenesis.bind(this)) // Deprecated
      recordsRouter.postAsync('/', this.applyCommit.bind(this)) // Deprecated
    } else {
      streamsRouter.postAsync('/', this.createReadOnlyStreamFromGenesis.bind(this))
      commitsRouter.postAsync('/', this._notSupported.bind(this))
      pinsRouter.postAsync('/:streamid', this._notSupported.bind(this))
      pinsRouter.deleteAsync('/:streamid', this._notSupported.bind(this))

      documentsRouter.postAsync('/', this.createReadOnlyDocFromGenesis.bind(this)) // Deprecated
      recordsRouter.postAsync('/', this._notSupported.bind(this)) // Deprecated
    }
  }

  async generateAdminCode(): Promise<string> {
    const newCode = crypto.randomUUID()
    const now = new Date().getTime()
    this.adminCodeCache.set(newCode, now)
    return newCode
  }

  _verifyAndDiscardAdminCode(code: string) {
    const now = new Date().getTime()
    if (!this.adminCodeCache.get(code)) {
      this.diagnosticsLogger.log(
        LogStyle.warn,
        `Unauthorized access attempt to Admin Api with admin code missing from registry`
      )
      throw Error(`Unauthorized access: invalid/already used admin code`)
    } else if (now - this.adminCodeCache.get(code) > ADMIN_CODE_EXPIRATION_TIMEOUT) {
      this.diagnosticsLogger.log(
        LogStyle.warn,
        `Unauthorized access attempt to Admin Api with expired admin code`
      )
      throw Error(
        `Unauthorized access: expired admin code - admin codes are only valid for ${
          ADMIN_CODE_EXPIRATION_TIMEOUT / 1000
        } seconds`
      )
    } else {
      this.adminCodeCache.delete(code)
    }
  }

  /**
   * Checks for availability of subsystems that Ceramic depends on (e.g. IPFS)
   * @dev Only checking for IPFS right now but checks for other subsystems can go here in the future
   */
  async healthcheck(req: Request, res: Response): Promise<void> {
    const { checkIpfs } = parseQueryObject(req.query)
    if (checkIpfs === false) {
      res.status(StatusCodes.OK).send('Alive!')
      return
    }

    // By default, check for health of the IPFS node
    for (let i = 0; i < HEALTHCHECK_RETRIES; i++) {
      try {
        if (await this.ceramic.ipfs.isOnline()) {
          res.status(StatusCodes.OK).send('Alive!')
          return
        }
      } catch (e) {
        this.diagnosticsLogger.err(`Error checking IPFS status: ${e}`)
      }
    }
    res.status(StatusCodes.SERVICE_UNAVAILABLE).send('IPFS unreachable')
  }

  /**
   * Create document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   * @deprecated
   */
  async createDocFromGenesis(req: Request, res: Response): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    upconvertLegacySyncOption(docOpts)
    const type = StreamType.codeByName(doctype)
    const doc = await this.ceramic.createStreamFromGenesis(
      type,
      StreamUtils.deserializeCommit(genesis),
      docOpts
    )
    res.json({
      streamId: doc.id.toString(),
      docId: doc.id.toString(),
      state: StreamUtils.serializeState(doc.state),
    })
  }

  /**
   * Create document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   */
  async createStreamFromGenesis(req: Request, res: Response): Promise<void> {
    const { type, genesis, opts } = req.body
    const stream = await this.ceramic.createStreamFromGenesis(
      type,
      StreamUtils.deserializeCommit(genesis),
      opts
    )
    res.json({ streamId: stream.id.toString(), state: StreamUtils.serializeState(stream.state) })
  }

  /**
   * Request stream to be anchored
   */
  async requestAnchor(req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid)
    const opts = req.body.opts
    const anchorStatus = await this.ceramic.requestAnchor(streamId, opts)
    res.json({ streamId: streamId.toString(), anchorStatus })
  }

  /**
   * Create read-only document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   * @TODO Should return null if document does not already exist instead of
   * current behavior, publishing to IPFS. With that change it will make sense
   * to rename this, e.g. `loadStreamFromGenesis`
   * @deprecated
   */
  async createReadOnlyDocFromGenesis(req: Request, res: Response): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    upconvertLegacySyncOption(docOpts)
    const type = StreamType.codeByName(doctype)
    const readOnlyDocOpts = { ...docOpts, anchor: false, publish: false }
    const doc = await this.ceramic.createStreamFromGenesis(
      type,
      StreamUtils.deserializeCommit(genesis),
      readOnlyDocOpts
    )
    res.json({
      streamId: doc.id.toString(),
      docId: doc.id.toString(),
      state: StreamUtils.serializeState(doc.state),
    })
  }

  /**
   * Create read-only document from genesis commit
   * @dev Useful when the docId is unknown, but you have the genesis contents
   * @TODO Should return null if document does not already exist instead of
   * current behavior, publishing to IPFS. With that change it will make sense
   * to rename this, e.g. `loadStreamFromGenesis`
   */
  async createReadOnlyStreamFromGenesis(req: Request, res: Response): Promise<void> {
    const { type, genesis, opts } = req.body
    const readOnlyOpts = { ...opts, anchor: false, publish: false }
    const stream = await this.ceramic.createStreamFromGenesis(
      type,
      StreamUtils.deserializeCommit(genesis),
      readOnlyOpts
    )
    res.json({ streamId: stream.id.toString(), state: StreamUtils.serializeState(stream.state) })
  }

  /**
   * Get stream state
   */
  async state(req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    const stream = await this.ceramic.loadStream(req.params.streamid, opts)
    res.json({ streamId: stream.id.toString(), state: StreamUtils.serializeState(stream.state) })
  }

  /**
   * Get document state
   * @deprecated
   * // todo remove when 'documents' endpoint is removed
   */
  async stateOld(req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    upconvertLegacySyncOption(opts)
    const doc = await this.ceramic.loadStream(req.params.docid, opts)
    res.json({ docId: doc.id.toString(), state: StreamUtils.serializeState(doc.state) })
  }

  /**
   * Get all document commits
   */
  async commits(req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    const commits = await this.ceramic.loadStreamCommits(streamId)
    const serializedCommits = commits.map((r: any) => {
      return {
        cid: r.cid,
        value: StreamUtils.serializeCommit(r.value),
      }
    })

    // TODO remove docId from output when we are no longer supporting clients older than v1.0.0
    res.json({
      streamId: streamId.toString(),
      docId: streamId.toString(),
      commits: serializedCommits,
    })
  }

  /**
   * Implementation of collection queries (the 'collection' http endpoint) using the HTTP GET method.
   * TODO: Remove this once we no longer need to support version 2.4.0 and earlier of the
   * http-client.
   */
  async getCollection_get(req: Request, res: Response): Promise<void> {
    const httpQuery = parseQueryObject(req.query)
    const response = await this._getCollection(httpQuery)
    res.json(response)
  }

  /**
   * Implementation of collection queries (the 'collection' http endpoint) using the HTTP POST method.
   */
  async getCollection_post(req: Request, res: Response): Promise<void> {
    const httpQuery = req.body
    const response = await this._getCollection(httpQuery)
    res.json(response)
  }

  /**
   * Helper function for the shared implementation of serving a collection query
   */
  async _getCollection(httpQuery: Record<string, any>): Promise<Record<string, any>> {
    const query = collectionQuery(httpQuery)
    const indexResponse = await this.ceramic.index.query(query)

    return {
      edges: indexResponse.edges.map((e) => {
        return {
          cursor: e.cursor,
          node: e.node ? StreamUtils.serializeState(e.node) : null,
        }
      }),
      pageInfo: indexResponse.pageInfo,
    }
  }

  /**
   * Implementation of count queries (the 'collection/count' http endpoint) using the HTTP GET method.
   * TODO: Remove this once we no longer need to support version 2.4.0 and earlier of the
   * http-client.
   */
  async getCollectionCount_get(req: Request, res: Response): Promise<void> {
    const httpQuery = parseQueryObject(req.query)
    const response = await this._getCollectionCount(httpQuery)
    res.json(response)
  }

  /**
   * Implementation of count queries (the 'collection/count' http endpoint) using the HTTP POST method.
   */
  async getCollectionCount_post(req: Request, res: Response): Promise<void> {
    const httpQuery = req.body
    const response = await this._getCollectionCount(httpQuery)
    res.json(response)
  }

  async _getCollectionCount(httpQuery: Record<string, any>): Promise<Record<string, any>> {
    const query = countQuery(httpQuery)
    const count = await this.ceramic.index.count(query)
    return { count }
  }

  private async _parseAdminApiJWS(jws: string | undefined): Promise<AdminAPIJWSContents> {
    const result = await this.ceramic.did.verifyJWS(jws)
    return {
      kid: result.kid,
      code: result.payload.code,
      requestPath: result.payload.requestPath,
      models: result.payload.requestBody ? result.payload.requestBody.models : undefined,
    }
  }

  private async _validateAdminApiJWS(
    basePath: string,
    jws: string | undefined,
    shouldContainModels: boolean
  ): Promise<AdminApiJWSValidationResult> {
    if (!jws) return { error: `Missing authorization jws` }

    let parsedJWS
    try {
      parsedJWS = await this._parseAdminApiJWS(jws)
    } catch (e) {
      return { error: `Error while processing the authorization header ${e.message}` }
    }
    if (parsedJWS.requestPath !== basePath) {
      return { error: `The jws block contains a request path that doesn't match the request` }
    } else if (!parsedJWS.code) {
      return { error: 'Admin code is missing from the the jws block' }
    } else if (shouldContainModels && (!parsedJWS.models || parsedJWS.models.length === 0)) {
      return {
        error: `The 'models' parameter is required and it has to be an array containing at least one model stream id`,
      }
    } else {
      return {
        kid: parsedJWS.kid,
        code: parsedJWS.code,
        models: parsedJWS.models?.map((modelIDString) => StreamID.fromString(modelIDString)),
      }
    }
  }

  /**
   * Checks that the given DID that is being used for a request to an AdminAPI endpoint is actually
   * configured as an Admin DID for this node, and throws if not.
   */
  private _verifyActingDid(actingDid: string) {
    if (!this.adminDids.some((adminDid) => actingDid.startsWith(adminDid))) {
      this.diagnosticsLogger.verbose(
        `Unauthorized access attempt to Admin Api from did: ${actingDid}`
      )
      throw Error(
        `Unauthorized access: DID '${actingDid}' does not have admin access permission to this node`
      )
    }
  }

  private async _processAdminModelsMutationRequest(
    req: Request,
    res: Response,
    successCallback: AdminApiModelMutationMethod
  ): Promise<void> {
    // Parse request
    const jwsValidation = await this._validateAdminApiJWS(req.baseUrl, req.body.jws, true)
    if (jwsValidation.error) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ error: jwsValidation.error })
      return
    }

    // Authorize request
    try {
      this._verifyAndDiscardAdminCode(jwsValidation.code)
      this._verifyActingDid(jwsValidation.kid)
    } catch (e) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: e.message })
    }

    // Process request
    await successCallback(jwsValidation.models)
    res.status(StatusCodes.OK).json({ result: 'success' })
  }

  async getAdminCode(req: Request, res: Response): Promise<void> {
    res.json({ code: await this.generateAdminCode() })
  }

  async getIndexedModels(req: Request, res: Response): Promise<void> {
    if (!req.headers.authorization) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Missing authorization header' })
      return
    }
    const jwsString = req.headers.authorization.split('Basic ')[1]
    if (!jwsString) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: `Invalid authorization header format. It needs to be 'Authorization: Basic <JWS BLOCK>'`,
      })
      return
    }
    const jwsValidation = await this._validateAdminApiJWS(req.baseUrl, jwsString, false)
    if (jwsValidation.error) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: jwsValidation.error })
    } else {
      try {
        this._verifyAndDiscardAdminCode(jwsValidation.code)
        this._verifyActingDid(jwsValidation.kid)
      } catch (e) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: e.message })
      }
      const indexedModelStreamIDs = await this.ceramic.admin.getIndexedModels()
      res.json({
        models: indexedModelStreamIDs.map((modelStreamID) => modelStreamID.toString()),
      })
    }
  }

  async startIndexingModels(req: Request, res: Response): Promise<void> {
    await this._processAdminModelsMutationRequest(
      req,
      res,
      this.ceramic.admin.startIndexingModels.bind(this.ceramic.admin)
    )
  }

  async stopIndexingModels(req: Request, res: Response): Promise<void> {
    await this._processAdminModelsMutationRequest(
      req,
      res,
      this.ceramic.admin.stopIndexingModels.bind(this.ceramic.admin)
    )
  }

  /**
   * Apply one commit to the existing document
   */
  async applyCommit(req: Request, res: Response): Promise<void> {
    const { docId, commit, docOpts } = req.body
    const opts = req.body.opts || docOpts
    upconvertLegacySyncOption(opts)
    // The HTTP client generally only calls applyCommit as part of an app-requested update to a
    // stream, so we want to throw an error if applying that commit fails for any reason.
    opts.throwOnInvalidCommit = opts.throwOnInvalidCommit ?? true

    const streamId = req.body.streamId || docId
    if (!(streamId && commit)) {
      throw new Error('streamId and commit are required in order to apply commit')
    }

    const stream = await this.ceramic.applyCommit(
      streamId,
      StreamUtils.deserializeCommit(commit),
      opts
    )
    res.json({
      streamId: stream.id.toString(),
      docId: stream.id.toString(),
      state: StreamUtils.serializeState(stream.state),
    })
  }

  /**
   * Load multiple documents and paths using an array of multiqueries
   */
  async multiQuery(req: Request, res: Response): Promise<void> {
    let { queries } = <MultiQueries>req.body
    const { timeout } = <MultiQueries>req.body

    // Handle queries from old clients by replacing the `docId` arguments with `streamId`.
    // TODO: Remove this once we no longer need to support http clients older than version 1.0.0
    queries = queries.map((q: MultiQueryWithDocId): MultiQuery => {
      if (q.docId) {
        q.streamId = q.docId
        delete q.docId
      }
      return q
    })

    const results = await this.ceramic.multiQuery(queries, timeout)
    const response = Object.entries(results).reduce((acc, e) => {
      const [k, v] = e
      acc[k] = StreamUtils.serializeState(v.state)
      return acc
    }, {})
    res.json(response)
  }

  /**
   * Render the most recent version of a stream's contents
   */
  async content(req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    const stream = await this.ceramic.loadStream(req.params.streamid, opts)
    res.json(stream.content)
  }

  /**
   * Pin stream
   */
  async pinStream(req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    const { force } = req.body
    await this.ceramic.pin.add(streamId, force)
    Metrics.count(STREAM_PINNED, 1)
    res.json({
      streamId: streamId.toString(),
      docId: streamId.toString(),
      isPinned: true,
    })
  }

  /**
   * Unpin stream
   */
  async unpinStream(req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    const { opts } = req.body
    await this.ceramic.pin.rm(streamId, opts)
    Metrics.count(STREAM_UNPINNED, 1)
    res.json({
      streamId: streamId.toString(),
      docId: streamId.toString(),
      isPinned: false,
    })
  }

  /**
   * List pinned streams
   */
  async listPinned(req: Request, res: Response): Promise<void> {
    let streamId: StreamID
    if (req.params.streamid || req.params.docid) {
      streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    }
    const pinnedStreamIds = []
    const iterator = await this.ceramic.pin.ls(streamId)
    for await (const id of iterator) {
      pinnedStreamIds.push(id)
    }

    // Return the same data in two formats: 'pinnedStreamids' and 'pinnedDocIds', to support old clients
    // TODO: Remove 'pinnedDocIds' once we are okay with no longer supporting applications using a
    // version of '@ceramicnetwork/http-client' older than v1.0.0
    res.json({ pinnedStreamIds, pinnedDocIds: pinnedStreamIds })
  }

  async _notSupported(req: Request, res: Response): Promise<void> {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: 'Method not supported by read only Ceramic Gateway' })
  }

  async getSupportedChains(req: Request, res: Response): Promise<void> {
    const supportedChains = await this.ceramic.getSupportedChains()
    res.json({ supportedChains })
  }

  /**
   * Close Ceramic daemon
   */
  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (!this.server) resolve()
      this.server.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
    await this.ceramic.close()
  }
}
