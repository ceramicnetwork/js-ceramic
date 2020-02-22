import Ipfs from 'ipfs'

import Dispatcher from './dispatcher'
import Document from './document'

//const genConf = id => {
  //return {
    //repo: `./tmp/ipfs${id}/`,
    //config: {
      //Addresses: {
        //Swarm: [
          //`/ip4/127.0.0.1/tcp/${4004 + id * 2}`,
          //`/ip4/127.0.0.1/tcp/${4005 + id * 2}/ws`
        //],
        //API: `/ip4/127.0.0.1/tcp/${5003 + id}`,
        //Gateway: `/ip4/127.0.0.1/tcp/${9091 + id}`
      //},
      //Bootstrap: []
    //}
  //}
//}


class Ceramic {
  private paperMap: Record<string, Document> = {}

  constructor (public dispatcher: Dispatcher) {}

  static create(ipfs: Ipfs.Ipfs): Ceramic {
    const dispatcher = new Dispatcher(ipfs)
    const ceramic = new Ceramic(dispatcher)
    return ceramic
  }

  async createDocument (genesis: any, paperType: string): Promise<Document> {
    return Document.create(genesis, paperType, this.dispatcher)
  }

  async loadDocument (pid: string): Promise<Document> {
    return Document.load(pid, this.dispatcher)
  }
}

export default Ceramic




async function start (): Promise<void> {
  const ipfs = await Ipfs.create()

  //const c = await ipfs.dag.put('few')
  //console.log(c)

  //const room = PubSubRoom(ipfs, '/ceramic')
  const ceramic = await Ceramic.create(ipfs)

  const paper = await ceramic.createDocument({ test: 123 }, '3id')
  console.log(paper.toString())
  await paper.update({ test: 123, abc: 'def'})
  console.log(paper.toString())
}

//start()
