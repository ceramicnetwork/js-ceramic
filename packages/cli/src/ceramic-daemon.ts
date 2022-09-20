import * as fs from 'fs'
import express, { Request, Response } from 'express'
import type { CeramicConfig } from '@ceramicnetwork/core'
import { Ceramic } from '@ceramicnetwork/core'
import { RotatingFileStream } from '@ceramicnetwork/logger'
import { Metrics } from '@ceramicnetwork/metrics'
import { buildIpfsConnection } from './build-ipfs-connection.util.js'
import { S3StateStore } from './s3-state-store.js'
import {
  DiagnosticsLogger,
  LoggerProvider,
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
import { logRequests } from './daemon/log-requests.js'
import type { Server } from 'http'
import { DaemonConfig, StateStoreMode } from './daemon-config.js'
import type { ResolverRegistry } from 'did-resolver'
import { ErrorHandlingRouter } from './error-handling-router.js'
import { collectionQuery } from './daemon/collection-query.js'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const DEFAULT_HOSTNAME = '0.0.0.0'
const DEFAULT_PORT = 7007
const HEALTHCHECK_RETRIES = 3
const CALLER_NAME = 'js-ceramic'

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
  if (opts.metrics?.metricsExporterEnabled) {
    Metrics.start(opts.metrics, CALLER_NAME)
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
      if (value === 'true') {
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
 * Ceramic daemon implementation
 */
export class CeramicDaemon {
  private server?: Server
  private readonly app: ExpressWithAsync
  readonly diagnosticsLogger: DiagnosticsLogger
  public hostname: string
  public port: number

  constructor(public ceramic: Ceramic, private readonly opts: DaemonConfig) {
    this.diagnosticsLogger = ceramic.loggerProvider.getDiagnosticsLogger()
    this.port = validatePort(this.opts.httpApi?.port) || DEFAULT_PORT
    this.hostname = this.opts.httpApi?.hostname || DEFAULT_HOSTNAME

    this.app = addAsync(express())
    this.app.set('trust proxy', true)
    this.app.use(express.json({ limit: '1mb' }))
    this.app.use(
      cors({
        origin: opts.httpApi?.corsAllowedOrigins,
        maxAge: 7200, // 2 hours
      })
    )

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
    modules.loggerProvider
      .getDiagnosticsLogger()
      .imp(
        `Starting Ceramic Daemon at version ${packageJson.version} with config: \n${JSON.stringify(
          opts,
          null,
          2
        )}`
      )

    if (opts.stateStore?.mode == StateStoreMode.S3) {
      const s3StateStore = new S3StateStore(opts.stateStore?.s3Bucket)
      modules.pinStoreFactory.setStateStore(s3StateStore)
    }

    const ceramic = new Ceramic(modules, params)
    await ceramic._init(true)
    const did = new DID({ resolver: makeResolvers(ceramic, ceramicConfig, opts) })
    await ceramic.setDID(did)

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
    collectionRouter.getAsync('/', this.getCollection.bind(this))
    adminModelRouter.getAsync('/', this.getModelsFromIndex.bind(this))
    adminModelRouter.postAsync('/', this.addModelsToIndex.bind(this))
    adminModelRouter.deleteAsync('/', this.removeModelsFromIndex.bind(this))
    adminModelRouter.putAsync('/', this.replaceModelsInIndex.bind(this))

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

  /**
   * Checks for availability of subsystems that Ceramic depends on (e.g. IPFS)
   * @dev Only checking for IPFS right now but checks for other subsystems can go here in the future
   */
  async healthcheck(req: Request, res: Response): Promise<void> {
    const { checkIpfs } = parseQueryObject(req.query)
    if (checkIpfs === false) {
      res.status(200).send('Alive!')
      return
    }

    // By default, check for health of the IPFS node
    for (let i = 0; i < HEALTHCHECK_RETRIES; i++) {
      try {
        if (await this.ceramic.ipfs.isOnline()) {
          res.status(200).send('Alive!')
          return
        }
      } catch (e) {
        this.diagnosticsLogger.err(`Error checking IPFS status: ${e}`)
      }
    }
    res.status(503).send('IPFS unreachable')
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
   * Create document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
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

  async getCollection(req: Request, res: Response): Promise<void> {
    const httpQuery = parseQueryObject(req.query)
    const query = collectionQuery(httpQuery)
    const indexResponse = await this.ceramic.index.query(query)

    res.json({
      edges: indexResponse.edges.map((e) => {
        return {
          cursor: e.cursor,
          node: e.node ? StreamUtils.serializeState(e.node) : null,
        }
      }),
      pageInfo: indexResponse.pageInfo,
    })
  }

  async getModelsFromIndex(req: Request, res: Response): Promise<void> {
    throw Error('Not Implemented')
    return
  }

  async addModelsToIndex(req: Request, res: Response): Promise<void> {
    throw Error('Not Implemented')
    return
  }

  async removeModelsFromIndex(req: Request, res: Response): Promise<void> {
    throw Error('Not Implemented')
    return
  }

  async replaceModelsInIndex(req: Request, res: Response): Promise<void> {
    throw Error('Not Implemented')
    return
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
    res.status(400).json({ error: 'Method not supported by read only Ceramic Gateway' })
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
