import type Ipfs from 'ipfs'
import { EventEmitter } from 'events'
import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import PinningService from "./pin/pinning-service"

export enum MsgType {
  UPDATE,
  REQUEST,
  RESPONSE
}

const TOPIC = '/ceramic'

class Dispatcher extends EventEmitter {
  private _ids: Record<string, boolean>
  private _peerId: string
  private _recordCache: Record<string, any>

  constructor (private _ipfs: Ipfs.Ipfs, public pinningService: PinningService) {
    super()
    this._ids = {}
    this._recordCache = {}
    this._ipfs.pubsub.subscribe(TOPIC, this.handleMessage.bind(this)) // this returns promise, we should await
    this.pinningService.open() // this returns promise, we should await
  }

  async register (id: string): Promise<void> {
    this._ids[id] = true
    // request head
    await this._ipfs.pubsub.publish(TOPIC, JSON.stringify({ typ: MsgType.REQUEST, id }))
  }

  unregister (id: string): void {
    delete this._ids[id]
  }

  async storeRecord (data: any): Promise<CID> {
    return await this._ipfs.dag.put(data)
  }

  async retrieveRecord (cid: CID): Promise<any> {
    // cache should be less needed once this issue is fixed:
    // https://github.com/ipfs/js-ipfs-bitswap/pull/214
    if (!this._recordCache[cid.toString()]) this._recordCache[cid.toString()] = (await this._ipfs.dag.get(cid)).value
    return cloneDeep(this._recordCache[cid.toString()])
  }

  async retrieveRecordByPath (cid: CID, path: string): Promise<any> {
    const ipfsObj = await this._ipfs.dag.get(cid, path)
    if (ipfsObj == null) {
      throw new Error(`Failed to find object for CID ${cid.toBaseEncodedString()} and path "${path}"`)
    }
    // should skip cache
    return ipfsObj.value
  }

  async publishHead (id: string, head: CID): Promise<void> {
    await this._ipfs.pubsub.publish(TOPIC, JSON.stringify({ typ: MsgType.UPDATE, id, cid: head.toString() }))
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
            this.emit(`${id}_update`, new CID(cid))
            break
          case MsgType.REQUEST:
            this.emit(`${id}_headreq`)
            break
        }
      }
    }
  }

  async close(): Promise<void> {
    await this.pinningService.close()
    return this._ipfs.pubsub.unsubscribe(TOPIC)
  }
}

export default Dispatcher
