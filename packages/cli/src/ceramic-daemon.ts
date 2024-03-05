import express, { Request, Response, NextFunction } from 'express'
import { Ceramic, CeramicConfig } from '@ceramicnetwork/core'
import { RotatingFileStream } from '@ceramicnetwork/logger'
import {
  DEFAULT_TRACE_SAMPLE_RATIO,
  ServiceMetrics as Metrics,
} from '@ceramicnetwork/observability'
import { ModelMetrics } from '@ceramicnetwork/model-metrics'
import { IpfsConnectionFactory } from './ipfs-connection-factory.js'
import {
  DiagnosticsLogger,
  FieldsIndex,
  LoggerProvider,
  LogStyle,
  ModelData,
  MultiQuery,
  Networks,
  StreamUtils,
  SyncOptions,
  UnreachableCaseError,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import * as ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import * as KeyDidResolver from 'key-did-resolver'
import * as PkhDidResolver from 'pkh-did-resolver'

import { DID, DIDOptions, DIDProvider } from 'dids'
import cors from 'cors'
import { errorHandler } from './daemon/error-handler.js'
import { addAsync, ExpressWithAsync } from '@awaitjs/express'
import { instrumentRequests } from './daemon/instrument-requests.js'
import { logRequests } from './daemon/log-requests.js'
import type { Server } from 'http'
import { DaemonConfig, IpfsMode, StateStoreMode } from './daemon-config.js'
import type { ResolverRegistry } from 'did-resolver'
import { ErrorHandlingRouter } from './error-handling-router.js'
import { collectionQuery, countQuery } from './daemon/collection-queries.js'
import { makeNodeDIDProvider, parseSeedUrl } from './daemon/did-utils.js'
import { StatusCodes } from 'http-status-codes'
import crypto from 'crypto'
import { version } from './version.js'
import { LRUCache } from 'least-recent'
import { S3Store } from './s3-store.js'
import { commitHash } from './commitHash.js'
import { parseQueryObject } from './daemon/parse-query-object.js'
import { SseFeed } from './daemon/sse-feed.js'
import { JsonAsString, AggregationDocument } from '@ceramicnetwork/codecs'

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

interface MultiQueries {
  queries: Array<MultiQuery>
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

  const metricsExporterEnabled = opts.metrics?.metricsExporterEnabled && opts.metrics?.collectorHost
  const prometheusExporterEnabled =
    opts.metrics?.prometheusExporterEnabled && opts.metrics?.prometheusExporterPort
  const metricsPublisherEnabled = opts.metrics?.metricsPublisherEnabled


  // If desired, enable OTLP metrics
  if (metricsExporterEnabled && prometheusExporterEnabled) {
    Metrics.start(
      opts.metrics.collectorHost,
      CALLER_NAME,
      DEFAULT_TRACE_SAMPLE_RATIO,
      null,
      true,
      opts.metrics.prometheusExporterPort
    )
  } else if (metricsExporterEnabled) {
    Metrics.start(opts.metrics.collectorHost, CALLER_NAME)
  } else if (prometheusExporterEnabled) {
    Metrics.start(
      '',
      CALLER_NAME,
      DEFAULT_TRACE_SAMPLE_RATIO,
      null,
      true,
      opts.metrics.prometheusExporterPort
    )
  }

  // If desired, publish metrics to ceramic network
  if (metricsPublisherEnabled) {
    ModelMetrics.start(

    )
  } 

  const ceramicConfig: CeramicConfig = {
    loggerProvider,
    readOnly: opts.node.readOnly || false,
    anchorServiceUrl: opts.anchor.anchorServiceUrl,
    anchorServiceAuthMethod: opts.anchor.authMethod,
    ethereumRpcUrl: opts.anchor.ethereumRpcUrl,
    ipfsPinningEndpoints: opts.ipfs.pinningEndpoints,
    networkName: opts.network.name,
    pubsubTopic: opts.network.pubsubTopic,
    syncOverride: SYNC_OPTIONS_MAP[opts.node.syncOverride],
    streamCacheLimit: opts.node.streamCacheLimit,
    indexing: opts.indexing,
    disablePeerDataSync: opts.ipfs.disablePeerDataSync,
  }
  if (opts.stateStore?.mode == StateStoreMode.FS) {
    ceramicConfig.stateStoreDirectory = opts.stateStore.localDirectory
  }

  return ceramicConfig
}

/**
 * Prepare DID resolvers to use in the daemon.
 */
function makeResolvers(ceramic: Ceramic): ResolverRegistry {
  return {
    ...KeyDidResolver.getResolver(),
    ...PkhDidResolver.getResolver(),
    ...ThreeIdResolver.getResolver(ceramic),
  }
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
 * ModelData contents in JWS
 */
type AdminAPIJWSModelData = {
  streamID: string
  indices: Array<FieldsIndex>
}

/**
 * Contents an authorization header signed by an admin DID
 */
type AdminAPIJWSContents = {
  kid: string
  code: string
  requestPath: string
  models?: Array<string>
  modelData?: Array<AdminAPIJWSModelData>
  force?: boolean
}

type AdminApiJWSValidationResult = {
  kid?: string
  code?: string
  error?: string
  statusCode?: number
  onSuccess?: () => Promise<void>
}

enum AdminApiSuccessCallbackType {
  shutdownServer,
  modelData,
  modelIDs,
}

/**
 * Admin API method that shuts down the server
 */
type AdminApiShutdownServerMethod = {
  type: AdminApiSuccessCallbackType.shutdownServer
  method: (force: boolean) => Promise<void>
}

/**
 * Admin API methods that mutate the node state and take as input a list of ModelData about some Models
 */
type AdminApiModelDataMutationMethod = {
  type: AdminApiSuccessCallbackType.modelData
  method: (modelData: Array<ModelData>) => Promise<void>
}

/**
 * Admin API methods that mutate the node state and take as input a list of Model StreamIDs.
 */
type AdminApiModelIdsMutationMethod = {
  type: AdminApiSuccessCallbackType.modelIDs
  method: (modelsIDs: Array<StreamID>) => Promise<void>
}

type AdminApiMutationMethod =
  | AdminApiModelIdsMutationMethod
  | AdminApiModelDataMutationMethod
  | AdminApiShutdownServerMethod

const MODELS_DEPRECATION_AT = 'Thu, 29 Jun 2023 23:59:59 GMT'

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
  private readonly adminCodeCache = new LRUCache<AdminCode, Timestamp>(ADMIN_CODE_CACHE_CAPACITY)

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
        credentials: true,
        maxAge: 7200, // 2 hours
      })
    )

    this.app.use(instrumentRequests)

    this.app.use(logRequests(ceramic.loggerProvider))

    this.registerAPIPaths(this.app, opts.node?.readOnly)

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

    if (opts.ipfs.mode != IpfsMode.REMOTE && opts.network?.name == Networks.MAINNET) {
      throw new Error(
        "Cannot run IPFS in 'bundled' mode on Mainnet. Bundled IPFS is for testing only and not suitable for production deployments.  Please set up a dedicated IPFS node and provide the URL for a REMOTE connection"
      )
    }
    const ipfs = await IpfsConnectionFactory.buildIpfsConnection(
      opts.ipfs.mode,
      opts.network?.name,
      ceramicConfig.loggerProvider.getDiagnosticsLogger(),
      opts.ipfs?.host
    )

    const [modules, params] = Ceramic._processConfig(ipfs, ceramicConfig)
    const diagnosticsLogger = modules.loggerProvider.getDiagnosticsLogger()
    diagnosticsLogger.imp(
      `Starting Ceramic Daemon with @ceramicnetwork/cli package version ${version}, with js-ceramic repo git hash ${commitHash}, and with config: \n${JSON.stringify(
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
    let didOptions: DIDOptions = { resolver: makeResolvers(ceramic) }
    let provider: DIDProvider

    if (opts.node.sensitive_privateSeedUrl()) {
      let seed: Uint8Array
      try {
        const privateSeedUrl = new URL(opts.node.sensitive_privateSeedUrl())
        seed = parseSeedUrl(privateSeedUrl)
      } catch (err) {
        // Do not log URL errors here to prevent leaking seed
        throw Error('Invalid format for node.private-seed-url in daemon.config.json')
      }
      provider = makeNodeDIDProvider(seed)
      didOptions = { ...didOptions, provider }
    }

    const did = new DID(didOptions)
    if (provider) {
      await did.authenticate()
      diagnosticsLogger.imp(
        `Node DID set to '${did.id}. This DID will be used to authenticate to the anchor service'`
      )
    }
    ceramic.did = did

    if (opts.stateStore?.mode == StateStoreMode.S3) {
      const s3Store = new S3Store(
        params.networkOptions.name,
        diagnosticsLogger,
        opts.stateStore?.s3Bucket,
        opts.stateStore?.s3Endpoint
      )

      await ceramic.repository.injectKeyValueStore(s3Store)
    }

    await ceramic._init(true)

    // here we can start publishing
    ModelMetrics.start(ceramic,
                       interval= // configured interval or default
                       ceramic_version= // get from daemon
                       ipfs_version= // from ipfs object here
                       node_id = // ??? is there such a thing - remove this?
                       node_name = // arbitrary can name ourselves
                       node_auth_did = // did to string
                       node_ip_address = // ?? do we know this ??
                       node_peer_id = // can get from ipfs (ipfs peer id OR rust ceramic peer id?)
                       logger = // this.logger
                     )                     

    const daemon = new CeramicDaemon(ceramic, opts)
    await daemon.listen()
    return daemon
  }

  registerAPIPaths(app: ExpressWithAsync, readOnly: boolean): void {
    const baseRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const commitsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const multiqueriesRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const nodeRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const streamsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const collectionRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminCodesRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminModelRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminModelDataRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminPinsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const legacyPinsRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminNodeStatusRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const adminShutdownRouter = ErrorHandlingRouter(this.diagnosticsLogger)
    const feedRouter = ErrorHandlingRouter(this.diagnosticsLogger)

    app.use('/api/v0', baseRouter)
    baseRouter.use('/commits', commitsRouter)
    baseRouter.use('/multiqueries', multiqueriesRouter)
    baseRouter.use('/node', nodeRouter)
    baseRouter.use('/streams', streamsRouter)
    baseRouter.use('/collection', collectionRouter)
    baseRouter.use('/admin/getCode', adminCodesRouter)
    baseRouter.use('/admin/models', adminModelRouter)
    baseRouter.use('/admin/modelData', adminModelDataRouter)
    baseRouter.use('/admin/status', adminNodeStatusRouter)
    baseRouter.use('/admin/shutdown', adminShutdownRouter)
    // Admin Pins Validate JWS Middleware
    baseRouter.use('/admin/pins', this.validateAdminRequest.bind(this))
    baseRouter.use('/admin/pins', adminPinsRouter)
    baseRouter.use('/feed', feedRouter)

    // Original pins paths not supported error, to be fuly removed/deprecated after
    // pin add returns empty 200 for now, to support 3id-connect, to be removed
    baseRouter.use('/pins', legacyPinsRouter)
    legacyPinsRouter.getAsync('/:streamid', this._pinNotSupported.bind(this))
    legacyPinsRouter.getAsync('/', this._pinNotSupported.bind(this))
    legacyPinsRouter.postAsync('/:streamid', this._pinWarningOk.bind(this))
    legacyPinsRouter.deleteAsync('/:streamid', this._pinNotSupported.bind(this))

    commitsRouter.getAsync('/:streamid', this.commits.bind(this))
    multiqueriesRouter.postAsync('/', this.multiQuery.bind(this))
    streamsRouter.getAsync('/:streamid', this.state.bind(this))
    streamsRouter.getAsync('/:streamid/content', this.content.bind(this))
    nodeRouter.getAsync('/chains', this.getSupportedChains.bind(this))
    nodeRouter.getAsync('/healthcheck', this.healthcheck.bind(this))
    collectionRouter.postAsync('/', this.getCollection_post.bind(this))
    collectionRouter.postAsync('/count', this.getCollectionCount_post.bind(this))
    adminCodesRouter.getAsync('/', this.getAdminCode.bind(this))
    adminNodeStatusRouter.getAsync('/', this.nodeStatus.bind(this))
    adminModelRouter.getAsync('/', this.getIndexedModels.bind(this))
    adminModelRouter.postAsync('/', this.startIndexingModels.bind(this))
    adminModelRouter.deleteAsync('/', this.stopIndexingModels.bind(this))
    adminModelDataRouter.getAsync('/', this.getIndexedModelData.bind(this))
    adminModelDataRouter.postAsync('/', this.startIndexingModelData.bind(this))
    adminModelDataRouter.deleteAsync('/', this.stopIndexingModelData.bind(this))
    adminPinsRouter.getAsync('/:streamid', this.listPinned.bind(this))
    adminPinsRouter.getAsync('/', this.listPinned.bind(this))
    adminShutdownRouter.postAsync('/', this.shutdownServer.bind(this))
    feedRouter.get('/aggregation/documents', this.documentsFeed.bind(this))

    if (!readOnly) {
      streamsRouter.postAsync('/', this.createStreamFromGenesis.bind(this))
      streamsRouter.postAsync('/:streamid/anchor', this.requestAnchor.bind(this))
      commitsRouter.postAsync('/', this.applyCommit.bind(this))
      adminPinsRouter.postAsync('/:streamid', this.pinStream.bind(this))
      adminPinsRouter.deleteAsync('/:streamid', this.unpinStream.bind(this))
    } else {
      streamsRouter.postAsync('/', this.createReadOnlyStreamFromGenesis.bind(this))
      commitsRouter.postAsync('/', this._notSupported.bind(this))
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
   * Returns diagnostic/introspection information
   */
  async nodeStatus(req: Request, res: Response): Promise<void> {
    const authorized = await this._checkAdminAPIGETRequestAuthorization(req, res)
    if (!authorized) {
      return
    }

    const statusResult = await this.ceramic.admin.nodeStatus()
    res.json(statusResult)
  }

  /**
   * Create stream from init commit
   * @dev Useful when the streamId is unknown, but you have the init contents
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
   * Create read-only stream from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   * @TODO Should return null if stream does not already exist instead of
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
   * Get all stream commits
   */
  async commits(req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid)
    const commits = await this.ceramic.loadStreamCommits(streamId)
    const serializedCommits = commits.map((r: any) => {
      return {
        cid: r.cid,
        value: StreamUtils.serializeCommit(r.value),
      }
    })

    res.json({
      streamId: streamId.toString(),
      commits: serializedCommits,
    })
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
      modelData: result.payload.requestBody ? result.payload.requestBody.modelData : undefined,
      force: result.payload.requestBody ? result.payload.requestBody.force : undefined,
    }
  }

  private async _validateAdminApiJWS(
    basePath: string,
    jws: string | undefined,
    successCallback?: AdminApiMutationMethod
  ): Promise<AdminApiJWSValidationResult> {
    if (!jws) return { error: `Missing authorization jws` }

    let parsedJWS
    try {
      parsedJWS = await this._parseAdminApiJWS(jws)
    } catch (e) {
      return { error: `Error while processing the authorization header ${e.message}` }
    }
    if (parsedJWS.requestPath !== basePath) {
      return {
        error: `The jws block contains a request path (${parsedJWS.requestPath}) that doesn't match the request (${basePath})`,
      }
    } else if (!parsedJWS.code) {
      return { error: 'Admin code is missing from the the jws block' }
    } else {
      let onSuccess
      if (successCallback) {
        const callbackType: AdminApiSuccessCallbackType = successCallback.type
        switch (callbackType) {
          case AdminApiSuccessCallbackType.modelData: {
            const modelData = parsedJWS.modelData?.map((idx) => {
              return {
                streamID: StreamID.fromString(idx.streamID),
                indices: idx.indices,
              }
            })
            if (!modelData || modelData.length == 0) {
              return {
                statusCode: StatusCodes.BAD_REQUEST,
                error: `Expected modelData to be present and contain at least one ModelData element, e.g. '{ streamID: <id>}': ${JSON.stringify(
                  parsedJWS
                )}`,
              }
            }
            onSuccess = () => successCallback.method(modelData)
            break
          }
          case AdminApiSuccessCallbackType.modelIDs: {
            const models = parsedJWS.models?.map((modelIDString) =>
              StreamID.fromString(modelIDString)
            )
            if (!models || models.length == 0) {
              return {
                statusCode: StatusCodes.BAD_REQUEST,
                error: `Expected models to be present and contain at least one StreamID: : ${JSON.stringify(
                  parsedJWS
                )}`,
              }
            }
            onSuccess = () => successCallback.method(models)
            break
          }
          case AdminApiSuccessCallbackType.shutdownServer: {
            const force = parsedJWS.force
            onSuccess = () => successCallback.method(force)
            break
          }
          default:
            throw new UnreachableCaseError(
              callbackType,
              'Unsupported admin API success callback type'
            )
        }
      }
      return {
        kid: parsedJWS.kid,
        code: parsedJWS.code,
        onSuccess,
      }
    }
  }

  private async _processAdminModelsMutationRequest(
    req: Request,
    res: Response,
    successCallback: AdminApiMutationMethod
  ): Promise<void> {
    // Parse request
    const jwsValidation = await this._validateAdminApiJWS(
      req.baseUrl,
      req.body.jws,
      successCallback
    )
    if (jwsValidation.error) {
      if (jwsValidation.statusCode) {
        res.status(jwsValidation.statusCode)
      } else {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY)
      }
      res.json({ error: jwsValidation.error })
      return
    }

    // Authorize request
    try {
      this._verifyAndDiscardAdminCode(jwsValidation.code)
      this._verifyActingDid(jwsValidation.kid)
    } catch (e) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: e.message })
    }

    await jwsValidation.onSuccess()
    res.status(StatusCodes.OK).json({ result: 'success' })
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

  async getAdminCode(req: Request, res: Response): Promise<void> {
    res.json({ code: await this.generateAdminCode() })
  }

  /**
   * Ensures the given adminAPI request has the appropriate authorization header for an Admin DID.
   * Returns true if the request is authorized.  Returns false and writes an error status into the
   * 'res' object if the request is not valid for any reason.
   * @param req
   * @param res
   * @private
   */
  private async _checkAdminAPIGETRequestAuthorization(
    req: Request,
    res: Response
  ): Promise<boolean> {
    if (!req.headers.authorization) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Missing authorization header' })
      return false
    }
    const jwsString = req.headers.authorization.split('Basic ')[1]
    if (!jwsString) {
      res.status(StatusCodes.BAD_REQUEST).json({
        error: `Invalid authorization header format. It needs to be 'Authorization: Basic <JWS BLOCK>'`,
      })
      return false
    }
    const jwsValidation = await this._validateAdminApiJWS(req.baseUrl, jwsString)
    if (jwsValidation.error) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: jwsValidation.error })
      return false
    }
    try {
      this._verifyAndDiscardAdminCode(jwsValidation.code)
      this._verifyActingDid(jwsValidation.kid)
    } catch (e) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: e.message })
    }
    return true
  }

  async getIndexedModels(req: Request, res: Response): Promise<void> {
    res.header('Deprecation', MODELS_DEPRECATION_AT)
    const authorized = await this._checkAdminAPIGETRequestAuthorization(req, res)
    if (!authorized) {
      return
    }

    const indexedModels = await this.ceramic.admin.getIndexedModels()
    const body = {
      models: indexedModels.map((id) => id.toString()),
    }
    res.json(body)
  }

  async getIndexedModelData(req: Request, res: Response): Promise<void> {
    const authorized = await this._checkAdminAPIGETRequestAuthorization(req, res)
    if (!authorized) {
      return
    }

    const indexedModels = await this.ceramic.admin.getIndexedModelData()
    const body = {
      modelData: indexedModels.map((idx) => {
        return {
          streamID: idx.streamID.toString(),
          indices: idx.indices,
        }
      }),
    }
    res.json(body)
  }

  async validateAdminRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    const jwsValidation = await this._validateAdminApiJWS(req.baseUrl, jwsString)
    if (jwsValidation.error) {
      res.status(StatusCodes.UNAUTHORIZED).json({ error: jwsValidation.error })
    } else {
      try {
        this._verifyAndDiscardAdminCode(jwsValidation.code)
        this._verifyActingDid(jwsValidation.kid)
      } catch (e) {
        res.status(StatusCodes.UNAUTHORIZED).json({ error: e.message })
      }
      next()
    }
  }

  async startIndexingModels(req: Request, res: Response): Promise<void> {
    res.header('Deprecation', MODELS_DEPRECATION_AT)
    await this._processAdminModelsMutationRequest(req, res, {
      type: AdminApiSuccessCallbackType.modelIDs,
      method: (modelIDs) => this.ceramic.admin.startIndexingModels(modelIDs),
    })
  }

  async startIndexingModelData(req: Request, res: Response): Promise<void> {
    await this._processAdminModelsMutationRequest(req, res, {
      type: AdminApiSuccessCallbackType.modelData,
      method: (modelData) => this.ceramic.admin.startIndexingModelData(modelData),
    })
  }

  async stopIndexingModels(req: Request, res: Response): Promise<void> {
    res.header('Deprecation', MODELS_DEPRECATION_AT)
    await this._processAdminModelsMutationRequest(req, res, {
      type: AdminApiSuccessCallbackType.modelIDs,
      method: (modelsIDs) => this.ceramic.admin.stopIndexingModels(modelsIDs),
    })
  }

  async stopIndexingModelData(req: Request, res: Response): Promise<void> {
    await this._processAdminModelsMutationRequest(req, res, {
      type: AdminApiSuccessCallbackType.modelData,
      method: (modelData) => this.ceramic.admin.stopIndexingModelData(modelData),
    })
  }

  documentsFeed(_: Request, res: Response): void {
    const source = this.ceramic.feed.aggregation.documents
    const feed = new SseFeed(
      this.diagnosticsLogger,
      source,
      JsonAsString.pipe(AggregationDocument).encode
    )
    feed.send(res)
  }

  async shutdownServer(req: Request, res: Response): Promise<void> {
    const closeClosure = this.close.bind(this)
    const successCallback = async function (force: boolean) {
      if (force) {
        process.exit(1)
      } else {
        await closeClosure()
        process.exit(0)
      }
    }
    await this._processAdminModelsMutationRequest(req, res, {
      type: AdminApiSuccessCallbackType.shutdownServer,
      method: successCallback,
    })
  }

  /**
   * Apply one commit to the existing stream
   */
  async applyCommit(req: Request, res: Response): Promise<void> {
    const { commit } = req.body
    const opts = req.body.opts

    const streamId = req.body.streamId
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
      state: StreamUtils.serializeState(stream.state),
    })
  }

  /**
   * Load multiple streams and paths using an array of multiqueries
   */
  async multiQuery(req: Request, res: Response): Promise<void> {
    const body = req.body as MultiQueries
    const queries = body.queries.map((q) => ({
      ...q,
      genesis: q.genesis ? StreamUtils.deserializeCommit(q.genesis) : undefined,
    }))
    const results = await this.ceramic.multiQuery(queries, body.timeout)
    const response = Object.entries(results).reduce((acc, [k, v]) => {
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
    const streamId = StreamID.fromString(req.params.streamid)
    const { force } = req.body
    await this.ceramic.admin.pin.add(streamId, force)
    Metrics.count(STREAM_PINNED, 1)
    res.json({
      streamId: streamId.toString(),
      isPinned: true,
    })
  }

  /**
   * Unpin stream
   */
  async unpinStream(req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid)
    const { opts } = req.body
    await this.ceramic.admin.pin.rm(streamId, opts)
    Metrics.count(STREAM_UNPINNED, 1)
    res.json({
      streamId: streamId.toString(),
      isPinned: false,
    })
  }

  /**
   * List pinned streams
   */
  async listPinned(req: Request, res: Response): Promise<void> {
    let streamId: StreamID | undefined = undefined
    if (req.params.streamid) {
      streamId = StreamID.fromString(req.params.streamid)
    }
    const pinnedStreamIds = []
    const iterator = await this.ceramic.admin.pin.ls(streamId)
    for await (const id of iterator) {
      pinnedStreamIds.push(id)
    }

    res.json({ pinnedStreamIds })
  }

  async _notSupported(req: Request, res: Response): Promise<void> {
    res.status(StatusCodes.BAD_REQUEST).json({ error: 'Method not supported by read only Ceramic' })
  }

  async _pinNotSupported(req: Request, res: Response): Promise<void> {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: 'Method not supported: pin requests have moved to the admin API /admin/pins' })
  }

  async _pinWarningOk(req: Request, res: Response): Promise<void> {
    res.status(StatusCodes.OK).json({
      warn: 'Pin requests have moved to the admin API /admin/pins, please make requests there. Any requests here will not pin, API returns 200 for tooling backwards compatibility, and will be removed soon.',
    })
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
      this.server.closeAllConnections()
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
