import type Ipfs from 'ipfs'
import express, { Request, Response, NextFunction } from 'express'
import Ceramic from '@ceramicnetwork/ceramic-core'
import type { CeramicConfig } from "@ceramicnetwork/ceramic-core";
import { DoctypeUtils, RootLogger, Logger } from "@ceramicnetwork/ceramic-common"
import { LogToFiles } from "./ceramic-logger-plugins"
// @ts-ignore
import cors from 'cors'

const DEFAULT_PORT = 7007
const toApiPath = (ending: string): string => '/api/v0' + ending

const DEFAULT_ANCHOR_SERVICE_URL = "https://cas.3box.io:8081/api/v0/requests"

/**
 * Daemon create options
 */
export interface CreateOpts {
  ipfsHost?: string;
  ipfs?: Ipfs.Ipfs;
  port?: number;

  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStorePath?: string;

  validateDocs?: boolean;
  pinning?: string[];
  gateway?: boolean;
  debug: boolean;
  logToFiles?: boolean;
  logPath?: string;
}

interface HttpLog {
  request: object;
  response?: object;
}

/**
 * Ceramic daemon implementation
 */
class CeramicDaemon {
  private server: any
  private logger: Logger
  private readonly debug: boolean

  constructor (public ceramic: Ceramic, opts: CreateOpts) {
    this.debug = opts.debug
    this.logger = RootLogger.getLogger(CeramicDaemon.name)

    const app = express()
    app.use(express.json())
    app.use(cors())

    this.registerAPIPaths(app, opts.gateway)

    if (this.debug) {
      app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
        const requestStart = Date.now()
        const httpLog = this._buildHttpLog(requestStart, req, res)
        const logString = JSON.stringify(httpLog)
        this.logger.error(logString)
        next(err)
      })
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

    app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
      res.json({ error: err.message })
      next(err)
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
      gateway: opts.gateway || false
    }

    if (opts.anchorServiceUrl) {
      ceramicConfig.ethereumRpcUrl = opts.ethereumRpcUrl
      ceramicConfig.anchorServiceUrl = opts.anchorServiceUrl
    } else {
      ceramicConfig.anchorServiceUrl = DEFAULT_ANCHOR_SERVICE_URL
    }

    if (opts.stateStorePath) {
      ceramicConfig.stateStorePath = opts.stateStorePath
    }

    if (opts.pinning) {
      Object.assign(ceramicConfig, {
        pinning: opts.pinning
      })
    }

    if (opts.logToFiles) {
        ceramicConfig.logToFiles = opts.logToFiles
        ceramicConfig.logToFilesPlugin = {
            plugin: LogToFiles.main,
            options: {logPath: opts.logPath}
        }
    }

    const ceramic = await Ceramic.create(ipfs, ceramicConfig)
    return new CeramicDaemon(ceramic, opts)
  }

  registerAPIPaths (app: any, gateway: boolean): void {
    app.get(toApiPath('/records/ceramic/:cid'), this.records.bind(this))
    app.get(toApiPath('/versions/ceramic/:cid'), this.versions.bind(this))
    app.get(toApiPath('/show/ceramic/:cid'), this.show.bind(this))
    app.get(toApiPath('/state/ceramic/:cid'), this.state.bind(this))
    app.get(toApiPath('/pin/ls/ceramic/:cid'), this.listPinned.bind(this))
    app.get(toApiPath('/pin/ls'), this.listPinned.bind(this))
    app.post(toApiPath('/create'), this.createDocFromGenesis.bind(this))

    if (!gateway) {
      app.post(toApiPath('/apply'), this.applyRecord.bind(this))
      app.get(toApiPath('/pin/add/ceramic/:cid'), this.pinDocument.bind(this))
      app.get(toApiPath('/pin/rm/ceramic/:cid'), this.unpinDocument.bind(this))
    } else {
      app.post(toApiPath('/apply'),  this._notSupported.bind(this))
      app.get(toApiPath('/pin/add/ceramic/:cid'),  this._notSupported.bind(this))
      app.get(toApiPath('/pin/rm/ceramic/:cid'),  this._notSupported.bind(this))
    }
  }

  _buildHttpLog (requestStart: number, req: Request, res: Response, extra?: any): HttpLog {
    const { rawHeaders, httpVersion, method, socket, url } = req;
    const { remoteAddress, remoteFamily } = socket;
    const httpLog: HttpLog = {
      request:{
        timestamp: Date.now(),
        rawHeaders,
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

  /**
   * Create document from genesis record
   */
  async createDocFromGenesis (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { genesis, docOpts } = req.body
    try {
      const doc = await this.ceramic.createDocumentFromGenesis(DoctypeUtils.deserializeRecord(genesis), docOpts)
      res.json({ docId: doc.id, state: DoctypeUtils.serializeState(doc.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Get document content
   */
  async show (req: Request, res: Response, next: NextFunction): Promise<void> {
    let docId = ['/ceramic', req.params.cid].join('/')
    if (req.query.version) {
      docId = `${docId}?version=${req.query.version}`
    }
    try {
      const doc = await this.ceramic.loadDocument(docId)
      res.json({ docId: doc.id, content: doc.content })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Get document state
   */
  async state (req: Request, res: Response, next: NextFunction): Promise<void> {
    let docId = ['/ceramic', req.params.cid].join('/')
    if (req.query.version) {
      docId = `${docId}?version=${req.query.version}`
    }
    try {
      const doc = await this.ceramic.loadDocument(docId)

      res.json({ docId: doc.id, state: DoctypeUtils.serializeState(doc.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Get document versions
   */
  async versions (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      const versions = await this.ceramic.listVersions(docId)
      res.json({ docId, versions: versions })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Get all document records
   */
  async records (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      const records = await this.ceramic.loadDocumentRecords(docId)
      const serializedRecords = records.map((r: any) => {
        return {
          cid: r.cid,
          value: DoctypeUtils.serializeRecord(r.value)
        }
      })

      res.json({ docId, records: serializedRecords })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Apply one record to the existing document
   */
  async applyRecord (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { docId, record, opts } = req.body
    if (!docId && !record) {
      res.json({ error: 'docId and record are required in order to apply record' })
      next()
      return
    }

    try {
      const doctype = await this.ceramic.applyRecord(docId, DoctypeUtils.deserializeRecord(record), opts)
      res.json({ docId: doctype.id, state: DoctypeUtils.serializeState(doctype.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Pin document
   */
  async pinDocument (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      await this.ceramic.pin.add(docId)
      res.json({ docId, isPinned: true })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * Unpin document
   */
  async unpinDocument (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      await this.ceramic.pin.rm(docId)
      res.json({ docId, isPinned: false })
    } catch (e) {
      return next(e)
    }
    next()
  }

  /**
   * List pinned documents
   */
  async listPinned (req: Request, res: Response, next: NextFunction): Promise<void> {
    let docId: string;
    if (req.params.cid) {
      docId = ['/ceramic', req.params.cid].join('/')
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

  /**
   * Close Ceramic daemon
   */
  async close (): Promise<void> {
    return this.server.close()
  }
}

export default CeramicDaemon
