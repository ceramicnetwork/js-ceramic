import type Ipfs from 'ipfs'
import type DoctypeHandler from './doctypes/doctypeHandler'
import Dispatcher from './dispatcher'
import AnchorService from './anchor/anchor-service'
import User from './user'
import Document, { InitOpts } from './document'
import ThreeIdHandler from './doctypes/threeIdHandler'
import TileHandler from './doctypes/tileHandler'
import AccountLinkHandler from './doctypes/accountLinkHandler'
import { AnchorServiceFactory } from "./anchor/anchor-service-factory";


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

export interface CeramicConfig {
  ethereumRpcUrl?: string;
  anchorServiceUrl?: string;
  didProvider?: any;
}

class Ceramic {
  private _docmap: Record<string, Document>
  private _doctypeHandlers: Record<string, DoctypeHandler>
  private _anchorService: AnchorService
  public user: User

  constructor (public dispatcher: Dispatcher) {
    this._docmap = {}
    this._doctypeHandlers = {
      '3id': new ThreeIdHandler(),
      'tile': new TileHandler(this),
      'account-link': new AccountLinkHandler(),
    }
  }

  async _init (config: CeramicConfig): Promise<void> {
    const promises = []
    if (config.didProvider) {
      promises.push(this.setDIDProvider(config.didProvider))
    }

    const anchorServiceFactory = new AnchorServiceFactory(this.dispatcher, config);
    this._anchorService = anchorServiceFactory.get();
    await Promise.all(promises);
    return null
  }

  static async create(ipfs: Ipfs.Ipfs, config: CeramicConfig = {}): Promise<Ceramic> {
    const dispatcher = new Dispatcher(ipfs)
    const ceramic = new Ceramic(dispatcher)
    await ceramic._init(config)
    return ceramic
  }

  async createDocument (content: any, doctype: string, opts: InitOpts = {}): Promise<Document> {
    const doctypeHandler = this._doctypeHandlers[doctype]
    const doc = await Document.create(content, doctypeHandler, this._anchorService, this.dispatcher, opts)
    if (!this._docmap[doc.id]) this._docmap[doc.id] = doc
    return doc
  }

  async loadDocument (id: string, opts: InitOpts = {}): Promise<Document> {
    if (!this._docmap[id]) {
      this._docmap[id] = await Document.load(id, this._doctypeHandlers, this._anchorService, this.dispatcher, opts)
    }
    return this._docmap[id]
  }

  async setDIDProvider (provider: any): Promise<void> {
    this.user = new User(provider)
    await this.user.auth()
    for (const doctype in this._doctypeHandlers) {
      this._doctypeHandlers[doctype].user = this.user
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
