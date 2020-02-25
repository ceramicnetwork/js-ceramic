import Ipfs from 'ipfs' // import only types ts 3.8
import Dispatcher from './dispatcher'
import Document, { InitOpts } from './document'


class Ceramic {
  private docmap: Record<string, Document>

  constructor (public dispatcher: Dispatcher) {
    this.docmap = {}
  }

  static async create(ipfs: Ipfs.Ipfs): Promise<Ceramic> {
    const dispatcher = new Dispatcher(ipfs)
    const ceramic = new Ceramic(dispatcher)
    return ceramic
  }

  async createDocument (genesis: any, doctype: string, opts?: InitOpts): Promise<Document> {
    const doc = await Document.create(genesis, doctype, this.dispatcher, opts)
    if (!this.docmap[doc.id]) this.docmap[doc.id] = doc
    return doc
  }

  async loadDocument (id: string): Promise<Document> {
    if (!this.docmap[id]) this.docmap[id] = await Document.load(id, this.dispatcher)
    return this.docmap[id]
  }

  async close (): Promise<void> {
    return this.dispatcher.close()
  }
}

export default Ceramic
