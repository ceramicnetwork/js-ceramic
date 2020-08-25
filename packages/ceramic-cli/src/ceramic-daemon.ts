import type Ipfs from 'ipfs'
import ipfsClient from 'ipfs-http-client'
import express, { Request, Response, NextFunction } from 'express'
import Ceramic from '@ceramicnetwork/ceramic-core'
import type { CeramicConfig } from "@ceramicnetwork/ceramic-core";
import { DoctypeUtils } from "@ceramicnetwork/ceramic-common"

const IPFS_HOST = 'http://localhost:5001'
const DEFAULT_PORT = 7007
const DEBUG = true
const toApiPath = (ending: string): string => '/api/v0' + ending

const DEFAULT_ANCHOR_SERVICE_URL = "https://cas.3box.io:8081/api/v0/requests"

interface CreateOpts {
  ipfsHost?: string;
  ipfs?: Ipfs.Ipfs;
  port?: number;

  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStorePath?: string;

  validateDocs?: boolean;
  pinning?: string[];
}

function logErrors (err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(err)
  next(err)
}

function sendErrorResponse(err: Error, req: Request, res: Response, next: NextFunction): void {
  res.json({ error: err.message })
  next(err)
}

class CeramicDaemon {
  private server: any

  constructor (public ceramic: Ceramic, opts: CreateOpts) {
    const app = express()
    app.use(express.json())
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*')
      next()
    })
    app.post(toApiPath('/create'), this.createDocFromGenesis.bind(this))
    app.get(toApiPath('/versions/ceramic/:cid'), this.versions.bind(this))
    app.get(toApiPath('/show/ceramic/:cid'), this.show.bind(this))
    app.get(toApiPath('/state/ceramic/:cid'), this.state.bind(this))
    app.post(toApiPath('/apply'), this.applyRecord.bind(this))
    app.get(toApiPath('/pin/add/ceramic/:cid'), this.pinDocument.bind(this))
    app.get(toApiPath('/pin/rm/ceramic/:cid'), this.unpinDocument.bind(this))
    app.get(toApiPath('/pin/ls/ceramic/:cid'), this.listPinned.bind(this))
    app.get(toApiPath('/pin/ls'), this.listPinned.bind(this))
    if (DEBUG) {
      app.use(logErrors)
    }
    app.use(sendErrorResponse)
    const port = opts.port || DEFAULT_PORT
    this.server = app.listen(port, () => {
      console.log('Ceramic API running on port ' + port)
    })
    this.server.keepAliveTimeout = 60 * 1000
  }

  static async create (opts: CreateOpts): Promise<CeramicDaemon> {
    const ipfs = opts.ipfs || ipfsClient(opts.ipfsHost || IPFS_HOST)

    const ceramicConfig: CeramicConfig = {}; // get initially from file and override with opts
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

    const ceramic = await Ceramic.create(ipfs, ceramicConfig)
    return new CeramicDaemon(ceramic, opts)
  }

  async createDocFromGenesis (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { genesis, docOpts } = req.body
    try {
      const doc = await this.ceramic.createDocumentFromGenesis(genesis, docOpts)
      res.json({ docId: doc.id, state: DoctypeUtils.serializeState(doc.state) })
    } catch (e) {
      return next(e)
    }
    next()
  }

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

  async close (): Promise<void> {
    return this.server.close()
  }
}

export default CeramicDaemon
