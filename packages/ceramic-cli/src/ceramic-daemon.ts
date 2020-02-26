import ipfsClient from 'ipfs-http-client'
import express, { Request, Response, NextFunction } from 'express'
import Ceramic from '../../ceramic-core'

const IPFS_HOST = 'http://localhost:5001'
const toApiPath = (ending: string):string => '/api/v0' + ending

class CeramicDaemon {
  private app: any

  constructor (private ceramic: Ceramic) {
    this.app = express()
    this.app.use(express.json())
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*')
      next()
    })
    this.app.post(toApiPath('/create'), this.createDoc.bind(this))
    this.app.get(toApiPath('/show/ceramic/:doctype/:cid'), this.show.bind(this))
    this.app.get(toApiPath('/state/ceramic/:doctype/:cid'), this.state.bind(this))
    this.app.post(toApiPath('/change/ceramic/:doctype/:cid'), this.change.bind(this))
    const server = this.app.listen(7007, () => {
      console.log('Ceramic API running on port 7007')
    })
    server.keepAliveTimeout = 60 * 1000
  }

  static async create (ipfsHost: string = IPFS_HOST) {
    const ipfs = ipfsClient(ipfsHost)
    const ceramic = await Ceramic.create(ipfs)
    return new CeramicDaemon(ceramic)
  }

  async createDoc (req: Request, res: Response, next: NextFunction) {
    const { doctype, genesis, onlyGenesis } = req.body
    if (!doctype || !genesis) {} // TODO - reject somehow
    const doc = await this.ceramic.createDocument(genesis, doctype, { onlyGenesis })
    res.json({ docId: doc.id, state: doc.state })
    next()
  }

  async show (req: Request, res: Response, next: NextFunction) {
    const { doctype, cid } = req.params
    const docId = ['/ceramic', doctype, cid].join('/')
    const doc = await this.ceramic.loadDocument(docId)
    res.json({ docId: doc.id, content: doc.content })
    next()
  }

  async state (req: Request, res: Response, next: NextFunction) {
    const { doctype, cid } = req.params
    const docId = ['/ceramic', doctype, cid].join('/')
    const doc = await this.ceramic.loadDocument(docId)
    res.json({ docId: doc.id, state: doc.state })
    next()
  }

  async change (req: Request, res: Response, next: NextFunction) {
    const { content } = req.body
    if (!content) {} // TODO - reject somehow
    const { doctype, cid } = req.params
    const docId = ['/ceramic', doctype, cid].join('/')
    const doc = await this.ceramic.loadDocument(docId)
    await doc.change(content)
    res.json({ docId: doc.id, state: doc.state })
    next()
  }
}

export default CeramicDaemon
