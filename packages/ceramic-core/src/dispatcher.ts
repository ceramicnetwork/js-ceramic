import type Ipfs from 'ipfs'
import { EventEmitter } from 'events'
import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'

import type Document from "./document"
import { DoctypeUtils, DefaultLoggerFactory, Logger } from "@ceramicnetwork/ceramic-common"

export enum MsgType {
  UPDATE,
  REQUEST,
  RESPONSE
}

const TOPIC = '/ceramic'

interface LogMessage {
  peer: string;
  event: string;
  topic: string;
  from?: string;
  message?: object;
}

export default class Dispatcher extends EventEmitter {
  private _peerId: string
  private readonly _documents: Record<string, Document>

  private logger: Logger
  private _isRunning = true

  constructor (public _ipfs: Ipfs.Ipfs) {
    super()
    this._documents = {}
    this.logger = DefaultLoggerFactory.getLogger(Dispatcher.name)
  }

  /**
   * Initialized Dispatcher
   */
  async init(): Promise<void> {
    this._peerId = this._peerId || (await this._ipfs.id()).id
    await this._ipfs.pubsub.subscribe(TOPIC, this.handleMessage.bind(this))
    this._log({ peer: this._peerId, event: 'subscribed', topic: TOPIC })
  }

  async register (document: Document): Promise<void> {
    this._documents[document.id] = document
    // request head
    const payload = { typ: MsgType.REQUEST, id: document.id, doctype: document.doctype.doctype }
    this._ipfs.pubsub.publish(TOPIC, JSON.stringify(payload))
    this._log({ peer: this._peerId, event: 'published', topic: TOPIC, message: payload })
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

  async publishHead (id: string, head: CID, doctype?: string): Promise<void> {
    if (!this._isRunning) {
      this.logger.error('Dispatcher has been closed')
      return
    }

    const payload = { typ: MsgType.UPDATE, id, cid: head.toString(), doctype: doctype }
    await this._ipfs.pubsub.publish(TOPIC, JSON.stringify(payload))
    this._log({ peer: this._peerId, event: 'published', topic: TOPIC, message: payload })
  }

  async handleMessage (message: any): Promise<void> {
    if (!this._isRunning) {
      this.logger.error('Dispatcher has been closed')
      return
    }

    if (message.from !== this._peerId) {
      this._log({ peer: this._peerId, event: 'received', topic: TOPIC, from: message.from, message: message.data })

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

  _log(msg: LogMessage): void {
    this.logger.debug(JSON.stringify(msg))
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
