import { EventEmitter } from 'events'
import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'

import type Document from "./document"
import { DoctypeUtils, RootLogger, Logger } from "@ceramicnetwork/ceramic-common"
import { TextDecoder } from 'util'
import { IPFSApi } from "./declarations"

/**
 * Ceramic Pub/Sub message type.
 */
export enum MsgType {
  UPDATE,
  REQUEST,
  RESPONSE
}

/**
 * Default Ceramic Pub/Sub topic.
 */
const TOPIC = '/ceramic'

/**
 * Describes one log message from the Dispatcher.
 */
interface LogMessage {
  peer: string;
  event: string;
  topic: string;
  from?: string;
  message?: Record<string, unknown>;
}

/**
 * Ceramic core Dispatcher used for handling messages from pub/sub topic.
 */
export default class Dispatcher extends EventEmitter {
  private _peerId: string
  private readonly _documents: Record<string, Document>

  private logger: Logger
  private _isRunning = true

  constructor (public _ipfs: IPFSApi, public topic: string = TOPIC) {
    super()
    this._documents = {}
    this.logger = RootLogger.getLogger(Dispatcher.name)
  }

  /**
   * Initialize Dispatcher instance.
   */
  async init(): Promise<void> {
    this._peerId = this._peerId || (await this._ipfs.id()).id
    await this._ipfs.pubsub.subscribe(this.topic, this.handleMessage.bind(this))
    this._log({ peer: this._peerId, event: 'subscribed', topic: this.topic })
  }

  /**
   * Register one document.
   *
   * @param document - Document instance
   */
  async register (document: Document): Promise<void> {
    this._documents[document.id.toString()] = document
    // request head
    const payload = { typ: MsgType.REQUEST, id: document.id.toString(), doctype: document.doctype.doctype }
    this._ipfs.pubsub.publish(this.topic, JSON.stringify(payload))
    this._log({ peer: this._peerId, event: 'published', topic: this.topic, message: payload })
  }

  /**
   * Unregister document by ID.
   *
   * @param id - Document ID
   */
  unregister (id: string): void {
    delete this._documents[id]
  }

  /**
   * Store Ceramic record (genesis|signed|anchor).
   *
   * @param data - Ceramic record data
   */
  async storeRecord (data: any): Promise<CID> {
    if (DoctypeUtils.isSignedRecordDTO(data)) {
      const { jws, linkedBlock } = data
      // put the JWS into the ipfs dag
      const cid = await this._ipfs.dag.put(jws, { format: 'dag-jose', hashAlg: 'sha2-256' })
      // put the payload into the ipfs dag
      await this._ipfs.block.put(linkedBlock, { cid: jws.link.toString() })
      return cid
    }
    return await this._ipfs.dag.put(data)
  }

  /**
   * Retrieves one Ceramic record by CID or path.
   *
   * @param cid - Record CID
   */
  async retrieveRecord (cid: CID | string): Promise<any> {
    return cloneDeep((await this._ipfs.dag.get(cid)).value)
  }

  /**
   * Publishes HEAD record to pub/sub topic.
   *
   * @param id  - Document ID
   * @param head - Record CID
   * @param doctype - Doctype name
   */
  async publishHead (id: string, head: CID, doctype?: string): Promise<void> {
    if (!this._isRunning) {
      this.logger.error('Dispatcher has been closed')
      return
    }

    const payload = { typ: MsgType.UPDATE, id, cid: head.toString(), doctype: doctype }
    await this._ipfs.pubsub.publish(this.topic, JSON.stringify(payload))
    this._log({ peer: this._peerId, event: 'published', topic: this.topic, message: payload })
  }

  /**
   * Handles one message from the pub/sub topic.
   *
   * @param message - Message data
   */
  async handleMessage (message: any): Promise<void> {
    if (!this._isRunning) {
      this.logger.error('Dispatcher has been closed')
      return
    }

    if (message.from !== this._peerId) {
      // TODO: This is not a great way to handle the message because we don't
      // don't know its type/contents. Ideally we can make this method generic
      // against specific interfaces and follow follow IPFS specs for
      // types (e.g. message data should be a buffer)

      let parsedMessageData
      if (typeof message.data === 'string') {
        parsedMessageData = JSON.parse(message.data)
      } else {
        parsedMessageData = JSON.parse(new TextDecoder('utf-8').decode(message.data))
      }
      // TODO: handle signature and key buffers in message data
      const logMessage = { ...message, data: parsedMessageData }
      this._log({ peer: this._peerId, event: 'received', topic: this.topic, message: logMessage })

      const { typ, id, cid } = parsedMessageData
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

  /**
   * Logs one message
   *
   * @param msg - Message data
   * @private
   */
  _log(msg: LogMessage): void {
    const timestampedMsg = {timestamp: Date.now(), ...msg}
    this.logger.debug(JSON.stringify(timestampedMsg))
  }

  /**
   * Gracefully closes the Dispatcher.
   */
  async close(): Promise<void> {
    this._isRunning = false

    await Promise.all(Object.values(this._documents).map(async (doc) => await doc.close()))

    await this._ipfs.pubsub.unsubscribe(this.topic)
  }
}
