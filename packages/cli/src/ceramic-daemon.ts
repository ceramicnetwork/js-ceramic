import express, { Request, Response, NextFunction } from 'express'
import Ceramic from '@ceramicnetwork/core'
import type { CeramicConfig} from "@ceramicnetwork/core"
import { DoctypeUtils, RootLogger, Logger, IpfsApi, MultiQuery  } from "@ceramicnetwork/common"
import { LogToFiles } from "./ceramic-logger-plugins"
import DocID from "@ceramicnetwork/docid"
import cors from 'cors'
import * as core from "express-serve-static-core"
import { cpuFree, freememPercentage } from "os-utils"

const DEFAULT_PORT = 7007
const toApiPath = (ending: string): string => '/api/v0' + ending

const DEFAULT_ANCHOR_SERVICE_URL = "https://cas-clay.3boxlabs.com"

/**
 * Daemon create options
 */
export interface CreateOpts {
  ipfsHost?: string;
  ipfs?: IpfsApi;
  port?: number;
  corsAllowedOrigins: string | RegExp[];

  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  pinsetDirectory?: string;

  validateDocs?: boolean;
  pinningEndpoints?: string[];
  gateway?: boolean;
  debug: boolean;
  logToFiles?: boolean;
  logPath?: string;
  network?: string;
  pubsubTopic?: string;

  maxHealthyCpu: number;
  maxHealthyMemory: number;
}

interface HttpLog {
  request: Record<string, unknown>;
  response?: Record<string, unknown>;
}

interface MultiQueries {
  queries: Array<MultiQuery>
}

/**
 * Ceramic daemon implementation
 */
class CeramicDaemon {
  private server: any
  private logger: Logger
  private maxHealthyCpu: number
  private maxHealthyMemory: number
  private readonly debug: boolean

  constructor (public ceramic: Ceramic, opts: CreateOpts) {
    this.debug = opts.debug
    this.logger = RootLogger.getLogger(CeramicDaemon.name)
    this.maxHealthyCpu = opts.maxHealthyCpu
    this.maxHealthyMemory = opts.maxHealthyMemory

    const app: core.Express = express()
    app.use(express.json())
    app.use(cors({ origin: opts.corsAllowedOrigins }))

    this.registerAPIPaths(app, opts.gateway)

    if (this.debug) {
      app.use((req: Request, res: Response, next: NextFunction): void => {
        const requestStart = Date.now()

        let requestError: string = null;
        let body: string | any = [];
        req.on("data", chunk => {
          body.push(chunk)
        })
        req.on("end", () => {
          body = Buffer.concat(body)
          body = body.toString()
        });
        req.on("error", error => {
          requestError = error.message
        });

        res.on("finish", () => {
          const httpLog = this._buildHttpLog(requestStart, req, res, {requestError, body})
          const logString = JSON.stringify(httpLog)
          this.logger.debug(logString)
        })
        next()
      })
    }

    // next is required in function signature
    app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
      this.logger.error(err)
      if (res.statusCode < 300) { // 2xx indicates error has not yet been handled
        res.status(500)
      }
      res.send({error: err.message})
      // TODO: Get real request start
      this.logger.error(JSON.stringify(this._buildHttpLog(Date.now(), req, res)))
    })

    const port = opts.port || DEFAULT_PORT
    this.server = app.listen(port, () => {
      console.log('Ceramic API running on port ' + port)
    })
    this.server.keepAliveTimeout = 60 * 1000
  }

  /**
   * Create Ceramic daemon
   * @param opts - Ceramic daemon options
   */
  static async create (opts: CreateOpts): Promise<CeramicDaemon> {
    const { ipfs } = opts

    const ceramicConfig: CeramicConfig = {
      logLevel: opts.debug ? 'debug' : 'silent',
      gateway: opts.gateway || false,
      networkName: opts.network
    }

    if (opts.anchorServiceUrl) {
      ceramicConfig.ethereumRpcUrl = opts.ethereumRpcUrl
      ceramicConfig.anchorServiceUrl = opts.anchorServiceUrl
    } else if (ceramicConfig.networkName === "testnet-clay" || ceramicConfig.networkName === "dev-unstable") {
      ceramicConfig.anchorServiceUrl = DEFAULT_ANCHOR_SERVICE_URL
    }

    if (opts.pubsubTopic) {
      ceramicConfig.pubsubTopic = opts.pubsubTopic
    }

    if (opts.pinsetDirectory) {
      ceramicConfig.pinsetDirectory = opts.pinsetDirectory
    }

    if (opts.pinningEndpoints) {
      ceramicConfig.pinningEndpoints = opts.pinningEndpoints
    }

    if (opts.logToFiles) {
        ceramicConfig.logToFiles = opts.logToFiles
        ceramicConfig.logPath = opts.logPath
        ceramicConfig.logToFilesPlugin = {
            plugin: LogToFiles.main,
            state: {blockedFiles: {}},
            options: {logPath: opts.logPath}
        }
    }

    const ceramic = await Ceramic.create(ipfs, ceramicConfig)
    return new CeramicDaemon(ceramic, opts)
  }

  registerAPIPaths (app: core.Express, gateway: boolean): void {
    app.get(toApiPath('/commits/:docid'), this.commits.bind(this))
    app.get(toApiPath('/records/:docid'), this.commits.bind(this))
    app.post(toApiPath('/multiqueries'), this.multiQuery.bind(this))
    app.get(toApiPath('/documents/:docid'), this.state.bind(this))
    app.get(toApiPath('/pins/:docid'), this.listPinned.bind(this))
    app.get(toApiPath('/pins'), this.listPinned.bind(this))
    app.get(toApiPath('/node/chains'), this.getSupportedChains.bind(this))
    app.get(toApiPath('/node/healthcheck'), this.healthcheck.bind(this))

    if (!gateway) {
      app.post(toApiPath('/documents'), this.createDocFromGenesis.bind(this))
      app.post(toApiPath('/commits'), this.applyCommit.bind(this))
      app.post(toApiPath('/records'), this.applyCommit.bind(this))
      app.post(toApiPath('/pins/:docid'), this.pinDocument.bind(this))
      app.delete(toApiPath('/pins/:docid'), this.unpinDocument.bind(this))
    } else {
      app.post(toApiPath('/documents'), this.createReadOnlyDocFromGenesis.bind(this))
      app.post(toApiPath('/commits'),  this._notSupported.bind(this))
      app.post(toApiPath('/records'),  this._notSupported.bind(this))
      app.post(toApiPath('/pins/:docid'),  this._notSupported.bind(this))
      app.delete(toApiPath('/pins/:docid'),  this._notSupported.bind(this))
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  _buildHttpLog (requestStart: number, req: Request, res: Response, extra?: any): HttpLog {
    const { headers, httpVersion, method, socket, url } = req;
    const { remoteAddress, remoteFamily } = socket;
    const httpLog: HttpLog = {
      request:{
        timestamp: Date.now(),
        headers,
        httpVersion,
        method,
        remoteAddress,
        remoteFamily,
        url
      }
    }
    const now = Date.now()
    httpLog.response = {
      timestamp: now,
      processingTime: now - requestStart,
      body: extra && extra.body || null,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      requestError: extra && extra.requestError || null
    }
    return httpLog
  }

  async healthcheck (req: Request, res: Response, next: NextFunction): Promise<void> {
    const freeCpu: any = await new Promise((resolve) => cpuFree(resolve))
    const cpuUsage: number = 1 - freeCpu

    const freeMemory = freememPercentage()
    const memUsage: number = 1 - freeMemory

    const stats = `maxHealthyCpu=${this.maxHealthyCpu} cpuUsage=${cpuUsage} freeCpu=${freeCpu} maxHealthyMemory=${this.maxHealthyMemory} memoryUsage=${memUsage} freeMemory=${freeMemory}`

    if (cpuUsage > this.maxHealthyCpu || memUsage > this.maxHealthyMemory) {
      this.logger.debug(stats)
      res.status(503)
      return next(new Error('Ceramic failed a healthcheck. Insufficient resources.'))
    } else {
      res.status(200).send('Alive!')
    }
  }

  /**
   * Create document from genesis commit
   * @dev Useful when the docId is unknown, but you have the genesis contents
   */
  async createDocFromGenesis (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    try {
      const doc = await this.ceramic.createDocumentFromGenesis(doctype, DoctypeUtils.deserializeCommit(genesis), docOpts)
      res.json({ docId: doc.id.toString(), state: DoctypeUtils.serializeState(doc.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Create read-only document from genesis commit
   * @dev Useful when the docId is unknown, but you have the genesis contents
   * @TODO Should return null if document does not already exist instead of
   * current behavior, publishing to IPFS. With that change it will make sense
   * to rename this, e.g. `loadDocFromGenesis`
   */
  async createReadOnlyDocFromGenesis (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { doctype, genesis, docOpts } = req.body
    const readOnlyDocOpts = { ...docOpts, anchor: false, publish: false }
    try {
      const doc = await this.ceramic.createDocumentFromGenesis(doctype, DoctypeUtils.deserializeCommit(genesis), readOnlyDocOpts)
      res.json({ docId: doc.id.toString(), state: DoctypeUtils.serializeState(doc.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Get document state
   */
  async state (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await this.ceramic.loadDocument(req.params.docid)

      res.json({ docId: doc.id.toString(), state: DoctypeUtils.serializeState(doc.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Get all document commits
   */
  async commits (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = DocID.fromString(req.params.docid)
    try {
      const commits = await this.ceramic.loadDocumentCommits(docId)
      const serializedCommits = commits.map((r: any) => {
        return {
          cid: r.cid,
          value: DoctypeUtils.serializeCommit(r.value)
        }
      })

      res.json({ docId: docId.toString(), commits: serializedCommits })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Apply one commit to the existing document
   */
  async applyCommit (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { docId, commit, docOpts } = req.body
    if (!(docId && commit)) {
      res.json({ error: 'docId and commit are required in order to apply commit' })
      next()
      return
    }

    try {
      const doctype = await this.ceramic.applyCommit(docId, DoctypeUtils.deserializeCommit(commit), docOpts)
      res.json({ docId: doctype.id.toString(), state: DoctypeUtils.serializeState(doctype.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Load multiple documents and paths using an array of multiqueries
   */
  async multiQuery (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { queries } = <MultiQueries> req.body
    try {
      const results = await this.ceramic.multiQuery(queries)
      const response = Object.entries(results).reduce((acc, e) => {
        const [k, v] = e
        acc[k] = DoctypeUtils.serializeState(v.state)
        return acc
      }, {})
      res.json(response)
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Pin document
   */
  async pinDocument (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = DocID.fromString(req.params.docid)
    try {
      await this.ceramic.pin.add(docId)
      res.json({ docId: docId.toString(), isPinned: true })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Unpin document
   */
  async unpinDocument (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = DocID.fromString(req.params.docid)
    try {
      await this.ceramic.pin.rm(docId)
      res.json({ docId: docId.toString(), isPinned: false })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * List pinned documents
   */
  async listPinned (req: Request, res: Response, next: NextFunction): Promise<void> {
    let docId: DocID;
    if (req.params.docid) {
      docId = DocID.fromString(req.params.docid)
    }
    try {
      const pinnedDocIds = []
      const iterator = await this.ceramic.pin.ls(docId)
      for await (const id of iterator) {
        pinnedDocIds.push(id)
      }
      res.json({ pinnedDocIds: pinnedDocIds })
    } catch (e) {
      return next(e)
    }
    next()
  }

  async _notSupported (req: Request, res: Response, next: NextFunction): Promise<void> {
    res.status(400).json({ status: 'error', message: 'Method not supported by read only Ceramic Gateway' })
    next()
  }

  async getSupportedChains (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supportedChains = await this.ceramic.getSupportedChains()
      res.json({ supportedChains })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Close Ceramic daemon
   */
  async close (): Promise<void> {
    return this.server.close()
  }
}

export default CeramicDaemon
