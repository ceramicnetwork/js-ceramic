import type Ipfs from 'ipfs'
import { EventEmitter } from 'events'
import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'

import type Document from "./document"
import { DoctypeUtils } from "@ceramicnetwork/ceramic-common"

export enum MsgType {
  UPDATE,
  REQUEST,
  RESPONSE
}

const TOPIC = '/ceramic'

export default class Dispatcher extends EventEmitter {
  private _peerId: string
  private readonly _documents: Record<string, Document>

  private _isRunning = true

  constructor (public _ipfs: Ipfs.Ipfs) {
    super()
    this._documents = {}
    this._ipfs.pubsub.subscribe(TOPIC, this.handleMessage.bind(this)) // this returns promise, we should await
  }

  async register (document: Document): Promise<void> {
    this._documents[document.id] = document
    // request head
    this._ipfs.pubsub.publish(TOPIC, JSON.stringify({ typ: MsgType.REQUEST, id: document.id }))
  }

  unregister (id: string): void {
    delete this._documents[id]
  }

  async storeRecord (data: any): Promise<CID> {
    if (DoctypeUtils.isSignedRecordDTO(data)) {
      const { jws, linkedBlock } = data
      // put the JWS into the ipfs dag
      const cid = await this._ipfs.dag.put(jws, { format: 'dag-jose', hashAlg: 'sha2-256' })
      // put the payload into the ipfs dag
      await this._ipfs.block.put(linkedBlock, { cid: jws.link })
      Object.assign(data, await this.retrieveRecord(cid)) // reload record
      return cid
    }
    return await this._ipfs.dag.put(data)
  }

  async retrieveRecord (cid: CID): Promise<any> {
    return cloneDeep((await this._ipfs.dag.get(cid)).value)
  }

  async retrieveRecordByPath (cid: CID, path: string): Promise<any> {
    const ipfsObj = await this._ipfs.dag.get(cid, path)
    if (ipfsObj == null) {
      throw new Error(`Failed to find object for CID ${cid.toBaseEncodedString()} and path "${path}"`)
    }
    return cloneDeep(ipfsObj.value)
  }

  async publishHead (id: string, head: CID): Promise<void> {
    if (!this._isRunning) {
      console.error('Dispatcher has been closed')
      return
    }

    await this._ipfs.pubsub.publish(TOPIC, JSON.stringify({ typ: MsgType.UPDATE, id, cid: head.toString() }))
  }

  async handleMessage (message: any): Promise<void> {
    if (!this._isRunning) {
      console.error('Dispatcher has been closed')
      return
    }

    this._peerId = this._peerId || (await this._ipfs.id()).id
    if (message.from !== this._peerId) {
      const { typ, id, cid } = JSON.parse(message.data)
      if (this._documents[id]) {
        switch (typ) {
          case MsgType.UPDATE:
            if (typeof cid !== 'string') break
            // add cache of cids here so that we don't emit event
            // multiple times if we get the message more than once.
            this._documents[id].emit('update', new CID(cid))
            break
          case MsgType.REQUEST:
            this._documents[id].emit('headreq')
            break
        }
      }
    }
  }

  async close(): Promise<void> {
    this._isRunning = false
    await this._ipfs.pubsub.unsubscribe(TOPIC)

    // deregister documents
    for (const doc of Object.values(this._documents)) {
      doc.close()
    }
  }
}
