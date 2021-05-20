import express, { Request, Response } from 'express'
import Ceramic from '@ceramicnetwork/core'
import type { CeramicConfig} from "@ceramicnetwork/core"
import { RotatingFileStream } from "@ceramicnetwork/logger"
import { buildIpfsConnection } from "./build-ipfs-connection.util";
import { S3StateStore } from "./s3-state-store";
import {
  StreamUtils,
  MultiQuery,
  LoggerConfig,
  LoggerProvider,
  DiagnosticsLogger,
  SyncOptions
} from "@ceramicnetwork/common"
import StreamID, {StreamType} from "@ceramicnetwork/streamid"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { DID } from 'dids'
import cors from 'cors'
import { errorHandler } from './daemon/error-handler';
import { addAsync, ExpressWithAsync, Router } from '@awaitjs/express'
import { logRequests } from './daemon/log-requests';
import type { Server } from 'http';

const DEFAULT_HOSTNAME = '0.0.0.0'
const DEFAULT_PORT = 7007

/**
 * Daemon create options
 */
export interface CreateOpts {
  ipfsHost?: string;
  port?: number;
  hostname?: string;
  corsAllowedOrigins?: string | RegExp[];

  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStoreDirectory?: string;
  s3StateStoreBucket?: string;

  validateStreams?: boolean;
  ipfsPinningEndpoints?: string[];
  gateway?: boolean;
  loggerConfig?: LoggerConfig,
  network?: string;
  pubsubTopic?: string;
}

interface MultiQueryWithDocId extends MultiQuery {
  docId?: string
}

interface MultiQueries {
  queries: Array<MultiQueryWithDocId>
}

export function makeCeramicConfig (opts: CreateOpts): CeramicConfig {
  const loggerProvider = new LoggerProvider(opts.loggerConfig, (logPath: string) => { return new RotatingFileStream(logPath, true)})
  const ceramicConfig: CeramicConfig = {
    loggerProvider,
    gateway: opts.gateway || false,
    anchorServiceUrl: opts.anchorServiceUrl,
    ethereumRpcUrl: opts.ethereumRpcUrl,
    ipfsPinningEndpoints: opts.ipfsPinningEndpoints,
    networkName: opts.network,
    pubsubTopic: opts.pubsubTopic,
    stateStoreDirectory: opts.stateStoreDirectory,
    validateStreams: opts.validateStreams,
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
      if (value === "true") {
        typedOpts[key] = true
      } else if (value === "false") {
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
  if (typeof opts?.sync == "boolean") {
    if (opts.sync) {
      opts.sync = SyncOptions.SYNC_ALWAYS
    } else {
      opts.sync = SyncOptions.PREFER_CACHE
    }
  }
}

/**
 * Ceramic daemon implementation
 */
export class CeramicDaemon {
  private server?: Server;
  private readonly app: ExpressWithAsync;
  private readonly diagnosticsLogger: DiagnosticsLogger;

  constructor (public ceramic: Ceramic, private readonly opts: CreateOpts) {
    this.diagnosticsLogger = ceramic.loggerProvider.getDiagnosticsLogger()
    this.app = addAsync(express());
    this.app.set('trust proxy', true)
    this.app.use(express.json({limit: '1mb'}))
    this.app.use(cors({ origin: opts.corsAllowedOrigins }))

    this.app.use(logRequests(ceramic.loggerProvider))

    this.registerAPIPaths(this.app, opts.gateway)

    this.app.use(errorHandler(this.diagnosticsLogger))
  }

  async listen(): Promise<void> {
    return new Promise<void>((resolve) => {
      const port = this.opts.port || DEFAULT_PORT
      const hostname = this.opts.hostname || DEFAULT_HOSTNAME
      this.server = this.app.listen(port, hostname, () => {
        this.diagnosticsLogger.imp(`Ceramic API running on ${hostname}:${port}'`)
        resolve()
      })
      this.server.keepAliveTimeout = 60 * 1000
    })
  }

  /**
   * Create Ceramic daemon
   * @param opts - Ceramic daemon options
   */
  static async create (opts: CreateOpts): Promise<CeramicDaemon> {
    const ceramicConfig = makeCeramicConfig(opts)

    const ipfs = await buildIpfsConnection(
      opts.network, ceramicConfig.loggerProvider.getDiagnosticsLogger(), opts.ipfsHost)

    const [modules, params] = await Ceramic._processConfig(ipfs, ceramicConfig)

    if (opts.s3StateStoreBucket) {
      const s3StateStore = new S3StateStore(opts.s3StateStoreBucket)
      modules.pinStoreFactory.setStateStore(s3StateStore)
    }

    const ceramic = new Ceramic(modules, params)
    await ceramic._init(true, true)

    const did = new DID({ resolver: {
      ...KeyDidResolver.getResolver(),
      ...ThreeIdResolver.getResolver(ceramic)
    }})
    await ceramic.setDID(did)

    const daemon = new CeramicDaemon(ceramic, opts)
    await daemon.listen()
    return daemon
  }

  registerAPIPaths (app: ExpressWithAsync, gateway: boolean): void {
    const baseRouter = Router()
    const commitsRouter = Router()
    const documentsRouter = Router()
    const multiqueriesRouter = Router()
    const nodeRouter = Router()
    const pinsRouter = Router()
    const recordsRouter = Router()
    const streamsRouter = Router()
    const dataRouter = Router()

    commitsRouter.getAsync('/:streamid', this.commits.bind(this))
    multiqueriesRouter.postAsync('/', this.multiQuery.bind(this))
    streamsRouter.getAsync('/:streamid', this.state.bind(this))
    dataRouter.getAsync('/:streamid', this.rawData.bind(this))
    pinsRouter.getAsync('/:streamid', this.listPinned.bind(this))
    pinsRouter.getAsync('/', this.listPinned.bind(this))
    nodeRouter.getAsync('/chains', this.getSupportedChains.bind(this))
    nodeRouter.getAsync('/healthcheck', this.healthcheck.bind(this))
    documentsRouter.getAsync('/:docid', this.stateOld.bind(this)) // Deprecated
    recordsRouter.getAsync('/:streamid', this.commits.bind(this)) // Deprecated

    if (!gateway) {
      streamsRouter.postAsync('/', this.createStreamFromGenesis.bind(this))
      commitsRouter.postAsync('/', this.applyCommit.bind(this))
      pinsRouter.postAsync('/:streamid', this.pinStream.bind(this))
      pinsRouter.deleteAsync('/:streamid', this.unpinStream.bind(this))

      documentsRouter.postAsync('/', this.createDocFromGenesis.bind(this)) // Deprecated
      recordsRouter.postAsync('/', this.applyCommit.bind(this)) // Deprecated
    } else {
      streamsRouter.postAsync('/', this.createReadOnlyStreamFromGenesis.bind(this))
      commitsRouter.postAsync('/',  this._notSupported.bind(this))
      pinsRouter.postAsync('/:streamid',  this._notSupported.bind(this))
      pinsRouter.deleteAsync('/:streamid',  this._notSupported.bind(this))

      documentsRouter.postAsync('/', this.createReadOnlyDocFromGenesis.bind(this)) // Deprecated
      recordsRouter.postAsync('/',  this._notSupported.bind(this)) // Deprecated
    }

    commitsRouter.use(errorHandler(this.diagnosticsLogger))
    documentsRouter.use(errorHandler(this.diagnosticsLogger))
    multiqueriesRouter.use(errorHandler(this.diagnosticsLogger))
    nodeRouter.use(errorHandler(this.diagnosticsLogger))
    pinsRouter.use(errorHandler(this.diagnosticsLogger))
    recordsRouter.use(errorHandler(this.diagnosticsLogger))
    streamsRouter.use(errorHandler(this.diagnosticsLogger))
    dataRouter.use(errorHandler(this.diagnosticsLogger))

    baseRouter.use('/commits', commitsRouter)
    baseRouter.use('/documents', documentsRouter)
    baseRouter.use('/multiqueries', multiqueriesRouter)
    baseRouter.use('/node', nodeRouter)
    baseRouter.use('/pins', pinsRouter)
    baseRouter.use('/records', recordsRouter)
    baseRouter.use('/streams', streamsRouter)
    baseRouter.use('/raw_data', dataRouter)
    baseRouter.use(errorHandler(this.diagnosticsLogger))

    app.use('/api/v0', baseRouter)
  }

  healthcheck (req: Request, res: Response): void {
    res.status(200).send('Alive!')
  }

  /**
   * Create document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   * @deprecated
   */
  async createDocFromGenesis (req: Request, res: Response): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    upconvertLegacySyncOption(docOpts)
    const type = StreamType.codeByName(doctype)
    const doc = await this.ceramic.createStreamFromGenesis(type, StreamUtils.deserializeCommit(genesis), docOpts)
    res.json({
      streamId: doc.id.toString(),
      docId: doc.id.toString(),
      state: StreamUtils.serializeState(doc.state)
    })
  }

  /**
   * Create document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   */
  async createStreamFromGenesis (req: Request, res: Response): Promise<void> {
    const { type, genesis, opts } = req.body
    const stream = await this.ceramic.createStreamFromGenesis(type, StreamUtils.deserializeCommit(genesis), opts)
    res.json({ streamId: stream.id.toString(), state: StreamUtils.serializeState(stream.state) })
  }

  /**
   * Create read-only document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   * @TODO Should return null if document does not already exist instead of
   * current behavior, publishing to IPFS. With that change it will make sense
   * to rename this, e.g. `loadStreamFromGenesis`
   * @deprecated
   */
  async createReadOnlyDocFromGenesis (req: Request, res: Response): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    upconvertLegacySyncOption(docOpts)
    const type = StreamType.codeByName(doctype)
    const readOnlyDocOpts = { ...docOpts, anchor: false, publish: false }
    const doc = await this.ceramic.createStreamFromGenesis(type, StreamUtils.deserializeCommit(genesis), readOnlyDocOpts)
    res.json({
      streamId: doc.id.toString(),
      docId: doc.id.toString(),
      state: StreamUtils.serializeState(doc.state)
    })
  }

  /**
   * Create read-only document from genesis commit
   * @dev Useful when the docId is unknown, but you have the genesis contents
   * @TODO Should return null if document does not already exist instead of
   * current behavior, publishing to IPFS. With that change it will make sense
   * to rename this, e.g. `loadStreamFromGenesis`
   */
  async createReadOnlyStreamFromGenesis (req: Request, res: Response): Promise<void> {
    const { type, genesis, opts } = req.body
    const readOnlyOpts = { ...opts, anchor: false, publish: false }
    const stream = await this.ceramic.createStreamFromGenesis(type, StreamUtils.deserializeCommit(genesis), readOnlyOpts)
    res.json({ streamId: stream.id.toString(), state: StreamUtils.serializeState(stream.state) })
  }

  /**
   * Get stream state
   */
  async state (req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    const stream = await this.ceramic.loadStream(req.params.streamid, opts)
    res.json({ streamId: stream.id.toString(), state: StreamUtils.serializeState(stream.state) })
  }

  /**
   * Get document state
   * @deprecated
   * // todo remove when 'documents' endpoint is removed
   */
  async stateOld (req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    upconvertLegacySyncOption(opts)
    const doc = await this.ceramic.loadStream(req.params.docid, opts)
    res.json({ docId: doc.id.toString(), state: StreamUtils.serializeState(doc.state) })
  }

  /**
   * Get all document commits
   */
  async commits (req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    const commits = await this.ceramic.loadStreamCommits(streamId)
    const serializedCommits = commits.map((r: any) => {
      return {
        cid: r.cid,
        value: StreamUtils.serializeCommit(r.value)
      }
    })

    // TODO remove docId from output when we are no longer supporting clients older than v1.0.0
    res.json({
      streamId: streamId.toString(),
      docId: streamId.toString(),
      commits: serializedCommits
    })
  }

  /**
   * Apply one commit to the existing document
   */
  async applyCommit (req: Request, res: Response): Promise<void> {
    const { docId, commit, docOpts } = req.body
    const opts = req.body.opts || docOpts
    upconvertLegacySyncOption(opts)
    const streamId = req.body.streamId || docId
    if (!(streamId && commit)) {
      throw new Error('streamId and commit are required in order to apply commit')
    }

    const stream = await this.ceramic.applyCommit(streamId, StreamUtils.deserializeCommit(commit), opts)
    res.json({
      streamId: stream.id.toString(),
      docId: stream.id.toString(),
      state: StreamUtils.serializeState(stream.state)
    })
  }

  /**
   * Load multiple documents and paths using an array of multiqueries
   */
  async multiQuery (req: Request, res: Response): Promise<void> {
    let { queries } = <MultiQueries>req.body
    // Handle queries from old clients by replacing the `docId` arguments with `streamId`.
    // TODO: Remove this once we no longer need to support http clients older than version 1.0.0
    queries = queries.map((q: MultiQueryWithDocId): MultiQuery => {
      if (q.docId) {
        q.streamId = q.docId
        delete q.docId
      }
      return q
    })

    const results = await this.ceramic.multiQuery(queries)
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
  async rawData (req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    const stream = await this.ceramic.loadStream(req.params.streamid, opts)
    const state = StreamUtils.serializeState(stream.state)
    if (state.content) {
      res.json(state.content)
    } else {
      res.status(501).json({ error: 'Stream serialization lacks content.' })
    }
  }

  /**
   * Pin stream
   */
  async pinStream (req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    await this.ceramic.pin.add(streamId)
    res.json({
      streamId: streamId.toString(),
      docId: streamId.toString(),
      isPinned: true
    })
  }

  /**
   * Unpin stream
   */
  async unpinStream (req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    await this.ceramic.pin.rm(streamId)
    res.json({
      streamId: streamId.toString(),
      docId: streamId.toString(),
      isPinned: false
    })
  }

  /**
   * List pinned streams
   */
  async listPinned (req: Request, res: Response): Promise<void> {
    let streamId: StreamID;
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

  async _notSupported (req: Request, res: Response): Promise<void> {
    res.status(400).json({ error: 'Method not supported by read only Ceramic Gateway' })
  }

  async getSupportedChains (req: Request, res: Response): Promise<void> {
    const supportedChains = await this.ceramic.getSupportedChains()
    res.json({ supportedChains })
  }

  /**
   * Close Ceramic daemon
   */
  async close (): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.server) resolve();
      this.server.close(err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
