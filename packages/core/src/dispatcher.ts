import { EventEmitter } from 'events'
import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import dagCBOR from "ipld-dag-cbor"
import * as multihashes from 'typestub-multihashes'
import * as sha256 from "@stablelib/sha256"

import type Document from "./document"
import { DoctypeUtils, RootLogger, Logger, IpfsApi } from "@ceramicnetwork/common"
import { TextDecoder } from 'util'
import DocID from "@ceramicnetwork/docid";

const IPFS_GET_TIMEOUT = 30000 // 30 seconds
const IPFS_MAX_RECORD_SIZE = 256000 // 256 KB

/**
 * Ceramic Pub/Sub message type.
 */
export enum MsgType {
  UPDATE,
  QUERY,
  RESPONSE
}

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
  // Set of IDs for QUERY messages we have sent to the pub/sub topic but not yet heard a
  // corresponding RESPONSE message for. Maps the query ID to the primary DocID we were querying for.
  private readonly _outstandingQueryIds: Record<string, DocID>

  private logger: Logger
  private _isRunning = true

  constructor (public _ipfs: IpfsApi, public topic: string) {
    super()
    this._documents = {}
    this._outstandingQueryIds = {}
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
    // TODO assert that document.id is a base ID
    this._documents[document.id.toString()] = document

    // Build a QUERY message to send to the pub/sub topic to request the latest tip for this document
    const payload = await this._buildQueryMessage(document)

    // Store the query id so we'll process the corresponding RESPONSE message when it comes in
    this._outstandingQueryIds[payload.id] = document.id.baseID

    this._ipfs.pubsub.publish(this.topic, JSON.stringify(payload))
    this._log({ peer: this._peerId, event: 'published', topic: this.topic, message: payload })
  }

  async _buildQueryMessage(document: Document): Promise<Record<string, any>> {
    const message = { typ: MsgType.QUERY, doc: document.id.baseID.toString() }

    // Add 'id' to message that is a hash of the message contents.
    const id = await this._hashMessage(message)

    return {...message, id: id.toString()}
  }

  /**
   * Computes a sha-256 multihash of the input message canonicalized using dag-cbor
   * @param message
   */
  async _hashMessage(message: any) : Promise<Uint8Array> {
    // DAG-CBOR encoding
    let id: Uint8Array = dagCBOR.util.serialize(message)

    // SHA-256 hash
    id = sha256.hash(id)

    // Multihash encoding
    const buf = Buffer.from(id)
    return multihashes.encode(buf, 'sha2-256')
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
    if (DoctypeUtils.isSignedRecordContainer(data)) {
      const { jws, linkedBlock } = data
      // put the JWS into the ipfs dag
      const cid = await this._ipfs.dag.put(jws, { format: 'dag-jose', hashAlg: 'sha2-256' })
      // put the payload into the ipfs dag
      await this._ipfs.block.put(linkedBlock, { cid: jws.link.toString() })
      await this._restrictRecordSize(jws.link.toString())
      await this._restrictRecordSize(cid)
      return cid
    }
    const cid = await this._ipfs.dag.put(data)
    await this._restrictRecordSize(cid)
    return cid
  }

  /**
   * Retrieves one Ceramic record by CID or path.
   *
   * @param cid - Record CID
   */
  async retrieveRecord (cid: CID | string): Promise<any> {
    const record = await this._ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })
    await this._restrictRecordSize(cid)
    return cloneDeep(record.value)
  }

  /**
   * Restricts record size to IPFS_MAX_RECORD_SIZE
   * @param cid - Record CID
   * @private
   */
  async _restrictRecordSize(cid: CID | string): Promise<void> {
    const stat = await this._ipfs.block.stat(cid, { timeout: IPFS_GET_TIMEOUT })
    if (stat.size > IPFS_MAX_RECORD_SIZE) {
      throw new Error(`${cid.toString()} record size ${stat.size} exceeds the maximum block size of ${IPFS_MAX_RECORD_SIZE}`)
    }
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
    // TODO Add validation the message adheres to the proper format.

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
    // TODO Add validation the message adheres to the proper format.

    const { doc: docId, id } = message
    if (!this._documents[docId]) {
      return
    }

    // TODO: Should we validate that the 'id' field is the correct hash of the rest of the message?

    // Build RESPONSE message and send it out on the pub/sub topic
    // TODO: Handle 'paths' for multiquery support
    const tipMap = {}
    tipMap[docId] = this._documents[docId].tip.toString()
    const payload = { typ: MsgType.RESPONSE, id, tips: tipMap}
    await this._ipfs.pubsub.publish(this.topic, JSON.stringify(payload))
    this._log({ peer: this._peerId, event: 'published', topic: this.topic, message: payload })
  }

  /**
   * Handles an incoming Response message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleResponseMessage(message: any): Promise<void> {
    // TODO Add validation the message adheres to the proper format.
    const { id: queryId, tips } = message

    if (!this._outstandingQueryIds[queryId]) {
      // We're not expecting this RESPONSE message
      return
    }

    const expectedDocID = this._outstandingQueryIds[queryId]
    const newTip = tips[expectedDocID.toString()]
    if (!newTip) {
      throw new Error("Response to query with ID '" + queryId + "' is missing expected new tip for docID '" +
          expectedDocID + "'")
    }
    this._documents[expectedDocID.toString()].emit('update', new CID(newTip))
    // TODO Iterate over all documents in 'tips' object and process the new tip for each
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
