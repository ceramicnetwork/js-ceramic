import type Ipfs from 'ipfs'
import ipfsClient from 'ipfs-http-client'
import express, { Request, Response, NextFunction } from 'express'
import IdentityWallet from 'identity-wallet'
import Ceramic from '@ceramicnetwork/ceramic-core'
import { serializeState } from './utils'

const IPFS_HOST = 'http://localhost:5001'
const DEFAULT_PORT = 7007
const toApiPath = (ending: string): string => '/api/v0' + ending
// TODO - don't hardcode seed lol
const seed = '0x5872d6e0ae7347b72c9216db218ebbb9d9d0ae7ab818ead3557e8e78bf944184'

interface CreateOpts {
  ipfsHost?: string;
  ipfs?: Ipfs.Ipfs;
  port?: number;
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
    app.get(toApiPath('/show/ceramic/:cid'), this.show.bind(this))
    app.get(toApiPath('/state/ceramic/:cid'), this.state.bind(this))
    app.post(toApiPath('/change/ceramic/:cid'), this.change.bind(this))
    const port = opts.port || DEFAULT_PORT
    this.server = app.listen(port, () => {
      console.log('Ceramic API running on port ' + port)
      console.log('User DID:', ceramic.user.DID)
    })
    this.server.keepAliveTimeout = 60 * 1000
  }

  static async create (opts: CreateOpts): Promise<CeramicDaemon> {
    const ipfs = opts.ipfs || ipfsClient(opts.ipfsHost || IPFS_HOST)
    const ceramic = await Ceramic.create(ipfs)
    const idWallet = new IdentityWallet(async () => true, { seed })
    await ceramic.setDIDProvider(idWallet.get3idProvider())
    return new CeramicDaemon(ceramic, opts)
  }

  async createDoc (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { doctype, genesis, onlyGenesis, owners } = req.body
    //if (!doctype || !genesis) {} // TODO - reject somehow
    try {
      const doc = await this.ceramic.createDocument(genesis, doctype, { onlyGenesis, owners })
      res.json({ docId: doc.id, state: serializeState(doc.state) })
    } catch (e) {
      res.json({ error: e.message })
    }
    next()
  }

  async show (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      const doc = await this.ceramic.loadDocument(docId)
      res.json({ docId: doc.id, content: doc.content })
    } catch (e) {
      res.json({ error: e.message })
    }
    next()
  }

  async state (req: Request, res: Response, next: NextFunction): Promise<void> {
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      const doc = await this.ceramic.loadDocument(docId)

      res.json({ docId: doc.id, state: serializeState(doc.state) })
    } catch (e) {
      res.json({ error: e.message })
    }
    next()
  }

  async change (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { content } = req.body
    if (!content) {
      res.json({ error: 'content required to change document' })
      next()
      return
    }
    const docId = ['/ceramic', req.params.cid].join('/')
    try {
      const doc = await this.ceramic.loadDocument(docId)
      await doc.change(content)
      res.json({ docId: doc.id, state: serializeState(doc.state) })
    } catch (e) {
      res.json({ error: e.message })
    }
    next()
  }

  async close () {
    return this.server.close()
  }
}

export default CeramicDaemon
