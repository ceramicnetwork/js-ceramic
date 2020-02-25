import Ipfs from 'ipfs' // import only types ts 3.8
import PubSubRoom from 'ipfs-pubsub-room'
import { EventEmitter } from 'events'

export enum MsgType {
  UPDATE,
  REQUEST,
  RESPONSE
}

class Dispatcher extends EventEmitter {
  private _ids: Record<string, boolean>
  private _peerId: string
  private _recordCache: Record<string, any>
  private _room: PubSubRoom

  constructor (private _ipfs: Ipfs.Ipfs) {
    super()
    this._ids = {}
    this._recordCache = {}
    this._room = new PubSubRoom(this._ipfs, '/ceramic')
    this._room.on('message', this.handleMessage.bind(this))
  }

  register (id: string): void {
    this._ids[id] = true
    // request head
    this._room.broadcast(JSON.stringify({ typ: MsgType.REQUEST, id }))
  }

  unregister (id: string): void {
    delete this._ids[id]
  }

  async newRecord (content: any): Promise<string> {
    const cid = (await this._ipfs.dag.put(content)).toString()
    return cid
  }

  async publishHead (id: string, head: string): Promise<void> {
    await this._room.broadcast(JSON.stringify({ typ: MsgType.UPDATE, id, cid: head }))
  }

  async getRecord (cid: string): Promise<any> {
    if (!this._recordCache[cid]) this._recordCache[cid] = (await this._ipfs.dag.get(cid)).value
    return this._recordCache[cid]
  }

  async handleMessage (message: any): Promise<void> {
    this._peerId = this._peerId || (await this._ipfs.id()).id
    if (message.from !== this._peerId) {
      const { typ, id, cid } = JSON.parse(message.data)
      if (this._ids[id]) {
        switch (typ) {
          case MsgType.UPDATE:
            if (typeof cid !== 'string') break
            // add cache of cids here so that we don't emit event
            // multiple times if we get the message more than once.
            this.emit(`${id}_update`, cid)
            break
          case MsgType.REQUEST:
            this.emit(`${id}_headreq`)
            break
        }
      }
    }
  }

  async close(): Promise<void> {
    return this._room.leave()
  }
}

export default Dispatcher
