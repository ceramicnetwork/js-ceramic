import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import * as pubsubMessage from './pubsub/pubsub-message'
import type Document from "./document"
import { DoctypeUtils, IpfsApi, UnreachableCaseError } from '@ceramicnetwork/common';
import DocID from "@ceramicnetwork/docid";
import { DiagnosticsLogger, ServiceLogger } from "@ceramicnetwork/logger";
import { Repository } from './repository';
import { MsgType } from './pubsub/pubsub-message';

const IPFS_GET_TIMEOUT = 60000 // 1 minute
const IPFS_MAX_RECORD_SIZE = 256000 // 256 KB
const IPFS_RESUBSCRIBE_INTERVAL_DELAY = 1000 * 15 // 15 sec
const TESTING = process.env.NODE_ENV == 'test'

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
export default class Dispatcher {
  private _peerId: string
  // Set of IDs for QUERY messages we have sent to the pub/sub topic but not yet heard a
  // corresponding RESPONSE message for. Maps the query ID to the primary DocID we were querying for.
  private readonly _outstandingQueryIds: Record<string, DocID>

  private _isRunning = true
  private _resubscribeInterval: any

  constructor (public _ipfs: IpfsApi, public topic: string, readonly repository: Repository, private _logger: DiagnosticsLogger, private _pubsubLogger: ServiceLogger) {
    this._outstandingQueryIds = {}
  }

  /**
   * Initialize Dispatcher instance.
   */
  async init(): Promise<void> {
    this._peerId = this._peerId || (await this._ipfs.id()).id
    await this._subscribe(true)
    // If ipfs.libp2p is defined we have an internal ipfs node, this means that
    // we don't want to resubscribe since it will add multiple handlers.
    if (!TESTING && !this._ipfs.libp2p) {
      this._resubscribe()
    }
  }

  /**
   * Subscribes IPFS pubsub to `this.topic` and logs a `subscribe` event.
   *
   * Logs error if subscribe fails.
   */
  async _subscribe(force = false): Promise<void> {
    try {
      if (force || !(await this._ipfs.pubsub.ls()).includes(this.topic)) {
        await this._ipfs.pubsub.unsubscribe(this.topic, this.handleMessage)
        await this._ipfs.pubsub.subscribe(
          this.topic,
          this.handleMessage,
          // {timeout: IPFS_GET_TIMEOUT} // ipfs-core bug causes timeout option to throw https://github.com/ipfs/js-ipfs/issues/3472
        )
        this._pubsubLogger.log({peer: this._peerId, event: 'subscribed', topic: this.topic })
      }
    } catch (error) {
      if (error.message.includes('Already subscribed')) {
        this._logger.debug(error.message)
      } else if (error.message.includes('The user aborted a request')) {        // for some reason the first call to pubsub.subscribe throws this error
        this._subscribe(true)
      } else {
        this._logger.err(error.message)
      }
    }
  }

  /**
   * Periodically subscribes to IPFS pubsub topic.
   */
  _resubscribe(): void {
    this._resubscribeInterval = setInterval(async () => {
      await this._subscribe()
    }, IPFS_RESUBSCRIBE_INTERVAL_DELAY)
  }

  /**
   * Register one document.
   *
   * @param document - Document instance
   */
  async register (document: Document): Promise<void> {
    this.repository.add(document)

    // Build a QUERY message to send to the pub/sub topic to request the latest tip for this document
    const message = pubsubMessage.buildQueryMessage(document.id)

    // Store the query id so we'll process the corresponding RESPONSE message when it comes in
    this._outstandingQueryIds[message.id] = document.id
    await this.publish(message)
  }

  /**
   * Unregister document by ID.
   */
  unregister (docId: DocID): void {
    this.repository.delete(docId)
  }

  /**
   * Store Ceramic commit (genesis|signed|anchor).
   *
   * @param data - Ceramic commit data
   */
  async storeCommit (data: any): Promise<CID> {
    if (DoctypeUtils.isSignedCommitContainer(data)) {
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
   * Retrieves one Ceramic commit by CID, and enforces that the commit doesn't exceed the maximum
   * commit size. To load an IPLD path or a CID from IPFS that isn't a Ceramic commit,
   * use `retrieveFromIPFS`.
   *
   * @param cid - Commit CID
   */
  async retrieveCommit (cid: CID | string): Promise<any> {
    const record = await this._ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })
    await this._restrictRecordSize(cid)
    return cloneDeep(record.value)
  }

  /**
   * Retrieves an object from the IPFS dag
   * @param cid
   * @param path - optional IPLD path to load, starting from the object represented by `cid`
   */
  async retrieveFromIPFS (cid: CID | string, path?: string): Promise<any> {
    const record = await this._ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT, path })
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
   * Publishes Tip commit to pub/sub topic.
   *
   * @param docId  - Document ID
   * @param tip - Commit CID
   */
  async publishTip (docId: DocID, tip: CID): Promise<void> {
    await this.publish({ typ: MsgType.UPDATE, doc: docId, tip: tip })
  }

  /**
   * Handles one message from the pub/sub topic.
   *
   * @param envelope - Message data
   */
  handleMessage = async (envelope: any): Promise<void> => {
    if (!this._isRunning) {
      this._logger.err('Dispatcher has been closed')
      return
    }

    if (envelope.from === this._peerId) {
      return
    }

    const message = pubsubMessage.deserialize(envelope)
    // TODO: handle signature and key buffers in message data
    // TODO: Logger does not belong here
    const logMessage = { ...envelope, data: message };
    delete logMessage.key;
    delete logMessage.signature;
    this._pubsubLogger.log({ peer: this._peerId, event: 'received', topic: this.topic, message: logMessage });
    switch (message.typ) {
      case MsgType.UPDATE:
        await this._handleUpdateMessage(message)
        break
      case MsgType.QUERY:
        await this._handleQueryMessage(message)
        break
      case MsgType.RESPONSE:
        await this._handleResponseMessage(message)
        break
      default:
        throw new UnreachableCaseError(message, `Unsupported message type`)
    }
  }

  /**
   * Handles an incoming Update message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleUpdateMessage(message: pubsubMessage.UpdateMessage): Promise<void> {
    // TODO Add validation the message adheres to the proper format.

    const { doc: docId, tip } = message
    if (await this.repository.has(docId)) {
      // TODO: add cache of cids here so that we don't emit event
      // multiple times if we get the message more than once.
      const document = await this.repository.get(docId)
      document.emit('update', new CID(tip))
      // TODO: Handle 'anchorService' if present in message
    }
  }

  /**
   * Handles an incoming Query message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleQueryMessage(message: pubsubMessage.QueryMessage): Promise<void> {
    // TODO Add validation the message adheres to the proper format.

    const { doc: docId, id } = message
    if (await this.repository.has(docId)) {
      const document = await this.repository.get(docId)
      // TODO: Should we validate that the 'id' field is the correct hash of the rest of the message?

      // Build RESPONSE message and send it out on the pub/sub topic
      // TODO: Handle 'paths' for multiquery support
      const tipMap = {}
      tipMap[docId.toString()] = document.tip.toString()
      const payload = { typ: MsgType.RESPONSE, id, tips: tipMap}
      await this._ipfs.pubsub.publish(this.topic, JSON.stringify(payload))
      this._pubsubLogger.log({ peer: this._peerId, event: 'published', topic: this.topic, message: payload })
    }
  }

  /**
   * Handles an incoming Response message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleResponseMessage(message: pubsubMessage.ResponseMessage): Promise<void> {
    const { id: queryId, tips } = message

    if (!this._outstandingQueryIds[queryId]) {
      // We're not expecting this RESPONSE message
      return
    }

    const expectedDocID = this._outstandingQueryIds[queryId]
    if (expectedDocID) {
      const newTip = tips.get(expectedDocID.toString())
      if (!newTip) {
        throw new Error("Response to query with ID '" + queryId + "' is missing expected new tip for docID '" +
          expectedDocID + "'")
      }
      if (await this.repository.has(expectedDocID)) {
        const document = await this.repository.get(expectedDocID)
        document.emit('update', new CID(newTip))
        // TODO Iterate over all documents in 'tips' object and process the new tip for each
      }
    }
  }

  /**
   * Gracefully closes the Dispatcher.
   */
  async close(): Promise<void> {
    this._isRunning = false

    clearInterval(this._resubscribeInterval)

    await this.repository.close()

    await this._ipfs.pubsub.unsubscribe(this.topic)
  }

  private async publish(message: pubsubMessage.PubsubMessage) {
    if (!this._isRunning) {
      this._logger.err('Dispatcher has been closed')
      return
    }

    await this._ipfs.pubsub.publish(this.topic, pubsubMessage.serialize(message))
    this._pubsubLogger.log({ peer: this._peerId, event: 'published', topic: this.topic, message: message })
  }
}
