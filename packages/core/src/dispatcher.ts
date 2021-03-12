import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import type { Document } from "./document"
import { DoctypeUtils, IpfsApi, UnreachableCaseError } from '@ceramicnetwork/common';
import DocID from "@ceramicnetwork/docid";
import { DiagnosticsLogger, ServiceLogger } from "@ceramicnetwork/logger";
import { Repository } from './state-management/repository';
import {
  buildQueryMessage,
  MsgType,
  PubsubMessage,
  QueryMessage,
  ResponseMessage,
  UpdateMessage,
} from './pubsub/pubsub-message';
import { Pubsub } from './pubsub/pubsub';
import { Subscription } from 'rxjs';
import { MessageBus } from './pubsub/message-bus';

const IPFS_GET_TIMEOUT = 60000 // 1 minute
const IPFS_MAX_RECORD_SIZE = 256000 // 256 KB
const IPFS_RESUBSCRIBE_INTERVAL_DELAY = 1000 * 15 // 15 sec

/**
 * Ceramic core Dispatcher used for handling messages from pub/sub topic.
 */
export class Dispatcher {
  readonly messageBus: MessageBus
  // Set of IDs for QUERY messages we have sent to the pub/sub topic but not yet heard a
  // corresponding RESPONSE message for. Maps the query ID to the primary DocID we were querying for.
  constructor (readonly _ipfs: IpfsApi, private readonly topic: string, readonly repository: Repository, private readonly _logger: DiagnosticsLogger, private readonly _pubsubLogger: ServiceLogger) {
    const pubsub = new Pubsub(_ipfs, topic, IPFS_RESUBSCRIBE_INTERVAL_DELAY, _pubsubLogger, _logger)
    this.messageBus = new MessageBus(pubsub)
    this.messageBus.subscribe(this.handleMessage.bind(this))
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
  publishTip (docId: DocID, tip: CID): Subscription {
    return this.publish({ typ: MsgType.UPDATE, doc: docId, tip: tip })
  }

  /**
   * Handles one message from the pubsub topic.
   */
  async handleMessage(message: PubsubMessage): Promise<void> {
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
  async _handleUpdateMessage(message: UpdateMessage): Promise<void> {
    // TODO Add validation the message adheres to the proper format.

    const { doc: docId, tip } = message
    const document = await this.repository.get(docId)
    if (document) {
      // TODO: add cache of cids here so that we don't emit event
      // multiple times if we get the message more than once.
      document.update(tip)
      // TODO: Handle 'anchorService' if present in message
    }
  }

  /**
   * Handles an incoming Query message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleQueryMessage(message: QueryMessage): Promise<void> {
    // TODO Add validation the message adheres to the proper format.

    const { doc: docId, id } = message
    const docState = await this.repository.docState(docId)
    if (docState) {
      // TODO: Should we validate that the 'id' field is the correct hash of the rest of the message?

      const tip = docState.log[docState.log.length - 1].cid
      // Build RESPONSE message and send it out on the pub/sub topic
      // TODO: Handle 'paths' for multiquery support
      const tipMap = new Map().set(docId.toString(), tip)
      this.publish({ typ: MsgType.RESPONSE, id, tips: tipMap})
    }
  }

  /**
   * Handles an incoming Response message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleResponseMessage(message: ResponseMessage): Promise<void> {
    const { id: queryId, tips } = message
    const expectedDocID = this.messageBus.outstandingQueries.get(queryId)
    if (expectedDocID) {
      const newTip = tips.get(expectedDocID.toString())
      if (!newTip) {
        throw new Error("Response to query with ID '" + queryId + "' is missing expected new tip for docID '" +
          expectedDocID + "'")
      }
      const document = await this.repository.get(expectedDocID)
      if (document) {
        document.update(newTip)
        this.messageBus.outstandingQueries.delete(queryId)
        // TODO Iterate over all documents in 'tips' object and process the new tip for each
      }
    }
  }

  /**
   * Gracefully closes the Dispatcher.
   */
  async close(): Promise<void> {
    this.messageBus.unsubscribe()
  }

  /**
   * Publish a message to IPFS pubsub as a fire-and-forget operation.
   *
   * You could use returned Subscription to react when the operation is finished.
   * Feel free to disregard it though.
   */
  private publish(message: PubsubMessage): Subscription {
    return this.messageBus.next(message)
  }
}
