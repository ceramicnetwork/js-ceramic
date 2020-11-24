import { EventEmitter } from 'events'
import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import dagCBOR from "ipld-dag-cbor"

import type Document from "./document"
import { DoctypeUtils, RootLogger, Logger } from "@ceramicnetwork/common"
import { TextDecoder } from 'util'
import { IPFSApi } from "./declarations"
import DocID from "@ceramicnetwork/docid";
import * as runtypes from "runtypes";

/**
 * Ceramic Pub/Sub message type.
 */
export enum MsgType {
  UPDATE,
  QUERY,
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
 * Format for UPDATE messages on the pub/sub topic. Uses the 'runtypes' library to provide type
 * checking at run time when parsing messages off the pub/sub topic.
 */
const UpdateMessage = runtypes.Record({
  // The message type, always 0
  typ: runtypes.Number.withConstraint(n => n === MsgType.UPDATE),

  // The DocID that is being updated
  doc: runtypes.String,

  // The CID of the new Tip of the document
  tip: runtypes.String,

  // The url of the anchor service that was used to request an anchor. Optional.
  anchorService: runtypes.String.Or(runtypes.Undefined),
});

/**
 * Format for QUERY messages on the pub/sub topic. Uses the 'runtypes' library to provide type
 * checking at run time when parsing messages off the pub/sub topic.
 */
const QueryMessage = runtypes.Record({
  // The message type, always 0
  typ: runtypes.Number.withConstraint(n => n === MsgType.QUERY),

  // The DocID that is being queried
  doc: runtypes.String,

  // The unique identifier of the query. A multihash of the query object without the id property
  // canonicalized using dag-cbor.
  id: runtypes.String,

  // The paths in the contents of the documents to explore. Paths are expected to resolve to
  // DocIDs. Nodes responding to a QUERY message may include the tips for documents referenced from
  // these paths.  This field is optional.
  paths: runtypes.Array(runtypes.String).Or(runtypes.Undefined)
});

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
    // request tip
    const payload = await this._buildQueryMessage(document)
    this._ipfs.pubsub.publish(this.topic, JSON.stringify(payload))
    this._log({ peer: this._peerId, event: 'published', topic: this.topic, message: payload })
  }

  async _buildQueryMessage(document: Document): Promise<Record<string, any>> {
    const message = { typ: MsgType.QUERY, doc: document.id.baseID.toString() }

    // Add 'id' to message.  'id' is the multihash of the rest of the query object canonicalized
    // using dag-cbor
    const id: Uint8Array = dagCBOR.util.serialize(message)
    return {...message, id: id.toString()}
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
   * Publishes Tip record to pub/sub topic.
   *
   * @param docId  - Document ID
   * @param tip - Record CID
   */
  async publishTip (docId: DocID, tip: CID): Promise<void> {
    if (!this._isRunning) {
      this.logger.error('Dispatcher has been closed')
      return
    }

    const payload = { typ: MsgType.UPDATE, doc: docId.baseID.toString(), tip: tip.toString() }
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

    if (message.from === this._peerId) {
      return
    }

    // TODO: This is not a great way to handle the message because we don't
    // don't know its type/contents. Ideally we can make this method generic
    // against specific interfaces and follow IPFS specs for
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

    const { typ } = parsedMessageData
    switch (typ) {
      case MsgType.UPDATE:
        await this._handleUpdateMessage(parsedMessageData)
        break
      case MsgType.QUERY:
        await this._handleQueryMessage(parsedMessageData)
        break
      case MsgType.RESPONSE:
        await this._handleResponseMessage(parsedMessageData)
        break
      default:
        throw new Error("Unsupported message type: " + typ)
    }

  }

  /**
   * Handles an incoming Update message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleUpdateMessage(message: any): Promise<void> {
    // Runtime check that the message adheres to the expected format for UPDATE messages
    UpdateMessage.check(message)

    const { doc, tip } = message
    if (!this._documents[doc]) {
      return
    }

    // TODO: add cache of cids here so that we don't emit event
    // multiple times if we get the message more than once.
    this._documents[doc].emit('update', new CID(tip))

    // TODO: Handle 'anchorService' if present in message
  }

  /**
   * Handles an incoming Query message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleQueryMessage(message: any): Promise<void> {
    // Runtime check that the message adheres to the expected format for QUERY messages
    QueryMessage.check(message)

    const { doc: docId } = message
    if (!this._documents[docId]) {
      return
    }

    // TODO: Should we validate that the 'id' field is the correct hash of the rest of the message?

    const doc = this._documents[docId]
    await this.publishTip(doc.id, doc.tip)
    // TODO: Handle 'paths' for multiquery support
  }

  /**
   * Handles an incoming Response message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleResponseMessage(message: any): Promise<void> {
    // TODO: Use Response message
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
