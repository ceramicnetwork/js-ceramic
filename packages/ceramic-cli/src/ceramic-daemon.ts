import type Ipfs from 'ipfs'
import ipfsClient from 'ipfs-http-client'
import express, { Request, Response, NextFunction } from 'express'
import IdentityWallet from 'identity-wallet'
import Ceramic from '@ceramicnetwork/ceramic-core'
import type { CeramicConfig } from "@ceramicnetwork/ceramic-core";
import { DoctypeUtils } from "@ceramicnetwork/ceramic-common"

import os from 'os'
import path from 'path'
import crypto from 'crypto'

const fs = require('fs').promises

const IPFS_HOST = 'http://localhost:5001'
const DEFAULT_PORT = 7007
const DEBUG = true
const toApiPath = (ending: string): string => '/api/v0' + ending

const DEFAULT_CLI_CONFIG_PATH = path.join(os.homedir(), '.ceramic')
const DEFAILT_CLI_CONFIG_FILE = 'config.json'

const DEFAULT_ANCHOR_SERVICE_URL = "https://cas.3box.io:8081/api/v0/requests"

interface CreateOpts {
  ipfsHost?: string;
  ipfs?: Ipfs.Ipfs;
  port?: number;

  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  stateStorePath?: string;
}

interface CliConfig {
  seed?: string;
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

  constructor (private ceramic: Ceramic, opts: CreateOpts) {
    const app = express()
    app.use(express.json())
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*')
      next()
    })
    app.post(toApiPath('/create'), this.createDoc.bind(this))
    app.get(toApiPath('/versions/ceramic/:cid'), this.versions.bind(this))
    app.get(toApiPath('/show/ceramic/:cid'), this.show.bind(this))
    app.get(toApiPath('/state/ceramic/:cid'), this.state.bind(this))
    app.post(toApiPath('/change/ceramic/:cid'), this.change.bind(this))
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
      console.log('User DID:', ceramic.context.user.DID)
    })
    this.server.keepAliveTimeout = 60 * 1000
  }

  static async create (opts: CreateOpts): Promise<CeramicDaemon> {
    const ipfs = opts.ipfs || ipfsClient(opts.ipfsHost || IPFS_HOST)

    const cliConfig = await CeramicDaemon._loadCliConfig()

    const ceramicConfig: CeramicConfig = {}; // get initially from file and override with opts
    if (opts.anchorServiceUrl) {
      Object.assign(ceramicConfig, {
        ethereumRpcUrl: opts.ethereumRpcUrl,
        anchorServiceUrl: opts.anchorServiceUrl,
      })
    } else {
      Object.assign(ceramicConfig, {
        anchorServiceUrl: DEFAULT_ANCHOR_SERVICE_URL,
      })
    }

    if (opts.stateStorePath) {
      Object.assign(ceramicConfig, {
        stateStorePath: opts.stateStorePath,
      })
    }

    const ceramic = await Ceramic.create(ipfs, ceramicConfig)
    const idWallet = new IdentityWallet(async () => true, { seed: cliConfig.seed })
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    return new CeramicDaemon(ceramic, opts)
  }

  /**
   * Load/create CLI config
   */
  static async _loadCliConfig(): Promise<CliConfig> {
    let exists
    const fullCliConfigPath = path.join(DEFAULT_CLI_CONFIG_PATH, DEFAILT_CLI_CONFIG_FILE)
    try {
      await fs.access(fullCliConfigPath)
      exists = true
    } catch (e) {
      exists = false
    }

    if (exists) {
      const configJson = await fs.readFile(fullCliConfigPath, { encoding: 'utf8' })
      return JSON.parse(configJson)
    }

    await fs.mkdir(DEFAULT_CLI_CONFIG_PATH, { recursive: true })

    console.log('Generating identity wallet seed...')
    const config: CliConfig = {
      seed: '0x' + Buffer.from(crypto.randomBytes(32)).toString('hex') // create new seed
    }

    await fs.writeFile(fullCliConfigPath, JSON.stringify(config, null, 2))
    console.log('Identity wallet seed generated')
    return config
  }

  async createDoc (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { doctype, params, docOpts } = req.body
    // TODO - check parameters
    try {
      const doc = await this.ceramic.createDocument(doctype, params, docOpts)
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

  async change (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { params } = req.body
    const { content, owners } = params
    if (!content && !owners) {
      res.json({ error: 'content or owners required to change document' })
      next()
      return
    }
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      const doc = await this.ceramic.loadDocument(docId)

      await doc.change({ content, owners })
      res.json({ docId: doc.id, state: DoctypeUtils.serializeState(doc.state) })
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
