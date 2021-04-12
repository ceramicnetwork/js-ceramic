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
} from "@ceramicnetwork/common"
import { LogToFiles } from "./ceramic-logger-plugins"
import DocID from "@ceramicnetwork/docid"
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver'
import KeyDidResolver from 'key-did-resolver'
import { DID } from 'dids'
import cors from 'cors'
import { errorHandler } from './daemon/error-handler';
import { addAsync, ExpressWithAsync } from '@awaitjs/express'
import { logRequests } from './daemon/log-requests';

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

interface MultiQueries {
  queries: Array<MultiQuery>
}

function makeCeramicConfig (opts: CreateOpts): CeramicConfig {
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
  private server: any

  constructor (public ceramic: Ceramic, opts: CreateOpts) {
    const diagnosticsLogger = ceramic.loggerProvider.getDiagnosticsLogger()
    const app = addAsync(express());
    app.set('trust proxy', true)
    app.use(express.json())
    app.use(cors({ origin: opts.corsAllowedOrigins }))

    app.use(logRequests(ceramic.loggerProvider))

    this.registerAPIPaths(app, opts.gateway)

    app.use(errorHandler(diagnosticsLogger))

    const port = opts.port || DEFAULT_PORT
    this.server = app.listen(port, () => {
      diagnosticsLogger.imp('Ceramic API running on port ' + port)
    })
    this.server.keepAliveTimeout = 60 * 1000
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

    return new CeramicDaemon(ceramic, opts)
  }

  registerAPIPaths (app: ExpressWithAsync, gateway: boolean): void {
    app.getAsync(toApiPath('/commits/:docid'), this.commits.bind(this))
    app.getAsync(toApiPath('/records/:docid'), this.commits.bind(this))
    app.postAsync(toApiPath('/multiqueries'), this.multiQuery.bind(this))
    app.getAsync(toApiPath('/documents/:docid'), this.state.bind(this))
    app.getAsync(toApiPath('/pins/:docid'), this.listPinned.bind(this))
    app.getAsync(toApiPath('/pins'), this.listPinned.bind(this))
    app.getAsync(toApiPath('/node/chains'), this.getSupportedChains.bind(this))
    app.getAsync(toApiPath('/node/healthcheck'), this.healthcheck.bind(this))

    if (!gateway) {
      app.postAsync(toApiPath('/documents'), this.createDocFromGenesis.bind(this))
      app.postAsync(toApiPath('/commits'), this.applyCommit.bind(this))
      app.postAsync(toApiPath('/records'), this.applyCommit.bind(this))
      app.postAsync(toApiPath('/pins/:docid'), this.pinDocument.bind(this))
      app.deleteAsync(toApiPath('/pins/:docid'), this.unpinDocument.bind(this))
    } else {
      app.postAsync(toApiPath('/documents'), this.createReadOnlyDocFromGenesis.bind(this))
      app.postAsync(toApiPath('/commits'),  this._notSupported.bind(this))
      app.postAsync(toApiPath('/records'),  this._notSupported.bind(this))
      app.postAsync(toApiPath('/pins/:docid'),  this._notSupported.bind(this))
      app.deleteAsync(toApiPath('/pins/:docid'),  this._notSupported.bind(this))
    }
  }

  healthcheck (req: Request, res: Response): void {
    res.status(200).send('Alive!')
  }

  /**
   * Create document from genesis commit
   * @dev Useful when the docId is unknown, but you have the genesis contents
   */
  async createDocFromGenesis (req: Request, res: Response): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    const doc = await this.ceramic.createDocumentFromGenesis(doctype, DoctypeUtils.deserializeCommit(genesis), docOpts)
    res.json({ docId: doc.id.toString(), state: DoctypeUtils.serializeState(doc.state) })
  }

  /**
   * Create read-only document from genesis commit
   * @dev Useful when the docId is unknown, but you have the genesis contents
   * @TODO Should return null if document does not already exist instead of
   * current behavior, publishing to IPFS. With that change it will make sense
   * to rename this, e.g. `loadDocFromGenesis`
   */
  async createReadOnlyDocFromGenesis (req: Request, res: Response): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    const readOnlyDocOpts = { ...docOpts, anchor: false, publish: false }
    const doc = await this.ceramic.createDocumentFromGenesis(doctype, DoctypeUtils.deserializeCommit(genesis), readOnlyDocOpts)
    res.json({ docId: doc.id.toString(), state: DoctypeUtils.serializeState(doc.state) })
  }

  /**
   * Get document state
   */
  async state (req: Request, res: Response): Promise<void> {
    const opts = parseQueryObject(req.query)
    const doc = await this.ceramic.loadDocument(req.params.docid, opts)
    res.json({ docId: doc.id.toString(), state: DoctypeUtils.serializeState(doc.state) })
  }

  /**
   * Get all document commits
   */
  async commits (req: Request, res: Response): Promise<void> {
    const docId = DocID.fromString(req.params.docid)
    const commits = await this.ceramic.loadDocumentCommits(docId)
    const serializedCommits = commits.map((r: any) => {
      return {
        cid: r.cid,
        value: DoctypeUtils.serializeCommit(r.value)
      }
    })

    res.json({ docId: docId.toString(), commits: serializedCommits })
  }

  /**
   * Apply one commit to the existing document
   */
  async applyCommit (req: Request, res: Response): Promise<void> {
    const { docId, commit, docOpts } = req.body
    if (!(docId && commit)) {
      throw new Error('docId and commit are required in order to apply commit')
    }

    const doctype = await this.ceramic.applyCommit(docId, DoctypeUtils.deserializeCommit(commit), docOpts)
    res.json({ docId: doctype.id.toString(), state: DoctypeUtils.serializeState(doctype.state) })
  }

  /**
   * Load multiple documents and paths using an array of multiqueries
   */
  async multiQuery (req: Request, res: Response): Promise<void> {
    const { queries } = <MultiQueries> req.body
    const results = await this.ceramic.multiQuery(queries)
    const response = Object.entries(results).reduce((acc, e) => {
      const [k, v] = e
      acc[k] = DoctypeUtils.serializeState(v.state)
      return acc
    }, {})
    res.json(response)
  }

  /**
   * Pin document
   */
  async pinDocument (req: Request, res: Response): Promise<void> {
    const docId = DocID.fromString(req.params.docid)
    await this.ceramic.pin.add(docId)
    res.json({ docId: docId.toString(), isPinned: true })
  }

  /**
   * Unpin document
   */
  async unpinDocument (req: Request, res: Response): Promise<void> {
    const docId = DocID.fromString(req.params.docid)
    await this.ceramic.pin.rm(docId)
    res.json({ docId: docId.toString(), isPinned: false })
  }

  /**
   * List pinned documents
   */
  async listPinned (req: Request, res: Response): Promise<void> {
    let docId: DocID;
    if (req.params.docid) {
      docId = DocID.fromString(req.params.docid)
    }
    const pinnedDocIds = []
    const iterator = await this.ceramic.pin.ls(docId)
    for await (const id of iterator) {
      pinnedDocIds.push(id)
    }
    res.json({ pinnedDocIds: pinnedDocIds })
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
    return this.server.close()
  }
}

export default CeramicDaemon
