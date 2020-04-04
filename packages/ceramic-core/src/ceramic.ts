import type Ipfs from 'ipfs'
import type DoctypeHandler from './doctypes/doctypeHandler'
import Dispatcher from './dispatcher'
import AnchorService from './anchor-service'
import User from './user'
import Document, { InitOpts } from './document'
import ThreeIdHandler from './doctypes/threeIdHandler'
import TileHandler from './doctypes/tileHandler'


// This is temporary until we handle DIDs and in particular 3IDs better
const gen3IDgenesis = (pubkeys: any): any => {
  return {
    owners: [pubkeys.managementKey],
    content: {
      publicKeys: {
        signing: pubkeys.signingKey,
        encryption: pubkeys.asymEncryptionKey
      }
    }
  }
}

interface CeramicConfig {
  anchorServicePolicy?: string; // docId of an anchor service policy tile
  didProvider?: any;
}

class Ceramic {
  private docmap: Record<string, Document>
  private doctypeHandlers: Record<string, DoctypeHandler>;
  public user: User

  constructor (public dispatcher: Dispatcher) {
    this.docmap = {}
    this.doctypeHandlers = {
      '3id': new ThreeIdHandler(),
      'tile': new TileHandler(this),
    }
  }

  async _init (config: CeramicConfig): Promise<void> {
    const promises = []
    if (config.didProvider) {
      promises.push(this.setDIDProvider(config.didProvider))
    }
    if (config.anchorServicePolicy) {
      // TODO load service policy tile for anchor service
    }
    this._anchorService = new AnchorService(this.dispatcher)
    await Promise.all(promises)
    return null
  }

  static async create(ipfs: Ipfs.Ipfs, config: CeramicConfig = {}): Promise<Ceramic> {
    const dispatcher = new Dispatcher(ipfs)
    const ceramic = new Ceramic(dispatcher)
    await ceramic._init(config)
    return ceramic
  }

  async createDocument (content: any, doctype: string, opts: InitOpts = {}): Promise<Document> {
    const doctypeHandler = this.doctypeHandlers[doctype]
    const doc = await Document.create(content, doctypeHandler, this._anchorService, this.dispatcher, opts)
    if (!this.docmap[doc.id]) this.docmap[doc.id] = doc
    return doc
  }

  async loadDocument (id: string, opts: InitOpts = {}): Promise<Document> {
    if (!this.docmap[id]) {
      this.docmap[id] = await Document.load(id, this.doctypeHandlers, this._anchorService, this.dispatcher, opts)
    }
    return this.docmap[id]
  }

  async setDIDProvider (provider: any): Promise<void> {
    this.user = new User(provider)
    await this.user.auth()
    for (const doctype in this.doctypeHandlers) {
      this.doctypeHandlers[doctype].user = this.user
    }
    if (!this.user.DID) {
      // patch create did document for now
      const { owners, content } = gen3IDgenesis(this.user.publicKeys)
      const doc = await this.createDocument(content, '3id', { owners })
      this.user.DID = 'did:3:' + doc.id.split('/')[2]
    }
  }

  async close (): Promise<void> {
    return this.dispatcher.close()
  }
}

export default Ceramic
