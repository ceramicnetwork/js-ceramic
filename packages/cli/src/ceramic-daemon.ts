import express, { Request, Response } from 'express'
import Ceramic from '@ceramicnetwork/core'
import type { CeramicConfig} from "@ceramicnetwork/core"
import { RotatingFileStream } from "@ceramicnetwork/logger"
import { buildIpfsConnection } from "./build-ipfs-connection.util";
import { S3StateStore } from "./s3-state-store";
import {
  DoctypeUtils,
  MultiQuery,
  LoggerConfig,
  LoggerProvider,
  DiagnosticsLogger
} from "@ceramicnetwork/common"
import { LogToFiles } from "./ceramic-logger-plugins"
import StreamID from "@ceramicnetwork/streamid"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { DID } from 'dids'
import cors from 'cors'
import { errorHandler } from './daemon/error-handler';
import { addAsync, ExpressWithAsync } from '@awaitjs/express'
import { logRequests } from './daemon/log-requests';
import type { Server } from 'http';

const DEFAULT_PORT = 7007
const toApiPath = (ending: string): string => '/api/v0' + ending

/**
 * Daemon create options
 */
export interface CreateOpts {
  ipfsHost?: string;
  port?: number;
  corsAllowedOrigins?: string | RegExp[];

  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStoreDirectory?: string;
  s3StateStoreBucket?: string;

  validateDocs?: boolean;
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
    networkName: opts.network
  }

  if (opts.anchorServiceUrl) {
    ceramicConfig.anchorServiceUrl = opts.anchorServiceUrl
  }

  if (opts.ethereumRpcUrl) {
    ceramicConfig.ethereumRpcUrl = opts.ethereumRpcUrl
  }

  if (opts.pubsubTopic) {
    ceramicConfig.pubsubTopic = opts.pubsubTopic
  }

  if (opts.stateStoreDirectory) {
    ceramicConfig.stateStoreDirectory = opts.stateStoreDirectory
  }

  if (opts.ipfsPinningEndpoints) {
    ceramicConfig.ipfsPinningEndpoints = opts.ipfsPinningEndpoints
  }

  if (opts.loggerConfig?.logToFiles) {
    // TODO remove when LoggerProviderOld is removed from 'common' package
    ceramicConfig.logToFilesPlugin = {
      plugin: LogToFiles.main,
      state: {blockedFiles: {}},
      options: {logPath: opts.loggerConfig.logDirectory}
    }
  }

  return ceramicConfig
}

/**
 * Takes a query object and parses the values to give them proper types instead of having everything
 * as strings
 * @param opts
 */
function parseQueryObject(opts: Record<string, any>): Record<string, string | boolean | number> {
  const docOpts = {}
  for (const [key, value] of Object.entries(opts)) {
    if (typeof value == 'string') {
      if (value === "true") {
        docOpts[key] = true
      } else if (value === "false") {
        docOpts[key] = false
      } else if (!isNaN(parseInt(value))) {
        docOpts[key] = parseInt(value)
      } else {
        docOpts[key] = value
      }
    } else {
      docOpts[key] = value
    }
  }
  return docOpts
}

/**
 * Ceramic daemon implementation
 */
class CeramicDaemon {
  private server?: Server;
  private readonly app: ExpressWithAsync;
  private readonly diagnosticsLogger: DiagnosticsLogger;

  constructor (public ceramic: Ceramic, private readonly opts: CreateOpts) {
    this.diagnosticsLogger = ceramic.loggerProvider.getDiagnosticsLogger()
    this.app = addAsync(express());
    this.app.set('trust proxy', true)
    this.app.use(express.json())
    this.app.use(cors({ origin: opts.corsAllowedOrigins }))

    this.app.use(logRequests(ceramic.loggerProvider))

    this.registerAPIPaths(this.app, opts.gateway)

    this.app.use(errorHandler(this.diagnosticsLogger))
  }

  async listen(): Promise<void> {
    return new Promise<void>((resolve) => {
      const port = this.opts.port || DEFAULT_PORT
      this.server = this.app.listen(port, () => {
        this.diagnosticsLogger.imp('Ceramic API running on port ' + port)
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
    app.getAsync(toApiPath('/commits/:streamid'), this.commits.bind(this))
    app.postAsync(toApiPath('/multiqueries'), this.multiQuery.bind(this))
    app.getAsync(toApiPath('/streams/:streamid'), this.state.bind(this))
    app.getAsync(toApiPath('/pins/:streamid'), this.listPinned.bind(this))
    app.getAsync(toApiPath('/pins'), this.listPinned.bind(this))
    app.getAsync(toApiPath('/node/chains'), this.getSupportedChains.bind(this))
    app.getAsync(toApiPath('/node/healthcheck'), this.healthcheck.bind(this))

    app.getAsync(toApiPath('/documents/:docid'), this.stateOld.bind(this)) // Deprecated
    app.getAsync(toApiPath('/records/:streamid'), this.commits.bind(this)) // Deprecated

    if (!gateway) {
      app.postAsync(toApiPath('/streams'), this.createStreamFromGenesis.bind(this))
      app.postAsync(toApiPath('/commits'), this.applyCommit.bind(this))
      app.postAsync(toApiPath('/pins/:streamid'), this.pinStream.bind(this))
      app.deleteAsync(toApiPath('/pins/:streamid'), this.unpinStream.bind(this))

      app.postAsync(toApiPath('/documents'), this.createDocFromGenesis.bind(this)) // Deprecated
      app.postAsync(toApiPath('/records'), this.applyCommit.bind(this)) // Deprecated
    } else {
      app.postAsync(toApiPath('/streams'), this.createReadOnlyStreamFromGenesis.bind(this))
      app.postAsync(toApiPath('/commits'),  this._notSupported.bind(this))
      app.postAsync(toApiPath('/pins/:streamid'),  this._notSupported.bind(this))
      app.deleteAsync(toApiPath('/pins/:streamid'),  this._notSupported.bind(this))

      app.postAsync(toApiPath('/documents'), this.createReadOnlyDocFromGenesis.bind(this)) // Deprecated
      app.postAsync(toApiPath('/records'),  this._notSupported.bind(this)) // Deprecated
    }
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
    const doc = await this.ceramic.createDocumentFromGenesis(doctype, DoctypeUtils.deserializeCommit(genesis), docOpts)
    res.json({
      streamId: doc.id.toString(),
      docId: doc.id.toString(),
      state: DoctypeUtils.serializeState(doc.state)
    })
  }

  /**
   * Create document from genesis commit
   * @dev Useful when the streamId is unknown, but you have the genesis contents
   */
  async createStreamFromGenesis (req: Request, res: Response): Promise<void> {
    const { streamtype, genesis, opts } = req.body
    const stream = await this.ceramic.createDocumentFromGenesis(streamtype, DoctypeUtils.deserializeCommit(genesis), opts)
    res.json({ streamId: stream.id.toString(), state: DoctypeUtils.serializeState(stream.state) })
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
    const readOnlyDocOpts = { ...docOpts, anchor: false, publish: false }
    const doc = await this.ceramic.createDocumentFromGenesis(doctype, DoctypeUtils.deserializeCommit(genesis), readOnlyDocOpts)
    res.json({
      streamId: doc.id.toString(),
      docId: doc.id.toString(),
      state: DoctypeUtils.serializeState(doc.state)
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
    const { streamtype, genesis, opts } = req.body
    const readOnlyOpts = { ...opts, anchor: false, publish: false }
    const stream = await this.ceramic.createDocumentFromGenesis(streamtype, DoctypeUtils.deserializeCommit(genesis), readOnlyOpts)
    res.json({ streamId: stream.id.toString(), state: DoctypeUtils.serializeState(stream.state) })
  }

  /**
   * Get stream state
   */
  async state (req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    const stream = await this.ceramic.loadDocument(req.params.streamid, opts)
    res.json({ streamId: stream.id.toString(), state: DoctypeUtils.serializeState(stream.state) })
  }

  /**
   * Get document state
   * @deprecated
   * // todo remove when 'documents' endpoint is removed
   */
  async stateOld (req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    const doc = await this.ceramic.loadDocument(req.params.docid, opts)
    res.json({ docId: doc.id.toString(), state: DoctypeUtils.serializeState(doc.state) })
  }

  /**
   * Get all document commits
   */
  async commits (req: Request, res: Response): Promise<void> {
    const streamId = StreamID.fromString(req.params.streamid || req.params.docid)
    const commits = await this.ceramic.loadDocumentCommits(streamId)
    const serializedCommits = commits.map((r: any) => {
      return {
        cid: r.cid,
        value: DoctypeUtils.serializeCommit(r.value)
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
    const streamId = req.body.streamId || docId
    if (!(streamId && commit)) {
      throw new Error('streamId and commit are required in order to apply commit')
    }

    const stream = await this.ceramic.applyCommit(streamId, DoctypeUtils.deserializeCommit(commit), docOpts)
    res.json({
      streamId: stream.id.toString(),
      docId: stream.id.toString(),
      state: DoctypeUtils.serializeState(stream.state)
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
      acc[k] = DoctypeUtils.serializeState(v.state)
      return acc
    }, {})
    res.json(response)
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

export default CeramicDaemon
