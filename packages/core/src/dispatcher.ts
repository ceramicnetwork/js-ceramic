import CID from 'cids'
import cloneDeep from 'lodash.clonedeep'
import {
  DiagnosticsLogger,
  IpfsApi,
  ServiceLogger,
  StreamUtils,
  UnreachableCaseError,
} from '@ceramicnetwork/common'
import StreamID from '@ceramicnetwork/streamid'
import { Repository } from './state-management/repository'
import {
  MsgType,
  PubsubMessage,
  QueryMessage,
  ResponseMessage,
  UpdateMessage,
} from './pubsub/pubsub-message'
import { Pubsub } from './pubsub/pubsub'
import { Subscription } from 'rxjs'
import { MessageBus } from './pubsub/message-bus'
import { LRUMap } from 'lru_map'
import { PubsubKeepalive } from './pubsub/pubsub-keepalive'
import { PubsubRateLimit } from './pubsub/pubsub-ratelimit'

const IPFS_GET_RETRIES = 3
const IPFS_GET_TIMEOUT = 30000 // 30 seconds per retry, 3 retries = 90 seconds total timeout
const IPFS_MAX_COMMIT_SIZE = 256000 // 256 KB
const IPFS_RESUBSCRIBE_INTERVAL_DELAY = 1000 * 15 // 15 sec
const MAX_PUBSUB_PUBLISH_INTERVAL = 60 * 1000 // one minute
const MAX_QUERIES_PER_SECOND = 10
const MAX_QUEUED_QUERIES = 100
const IPFS_CACHE_SIZE = 1024 // maximum cache size of 256MB

function messageTypeToString(type: MsgType): string {
  switch (type) {
    case MsgType.UPDATE:
      return 'Update'
    case MsgType.QUERY:
      return 'Query'
    case MsgType.RESPONSE:
      return 'Response'
    case MsgType.KEEPALIVE:
      return 'Keepalive'
    default:
      throw new UnreachableCaseError(type, `Unsupported message type`)
  }
}

/**
 * Ceramic core Dispatcher used for handling messages from pub/sub topic.
 */
export class Dispatcher {
  readonly messageBus: MessageBus
  readonly dagNodeCache: LRUMap<string, any>
  // Set of IDs for QUERY messages we have sent to the pub/sub topic but not yet heard a
  // corresponding RESPONSE message for. Maps the query ID to the primary StreamID we were querying for.
  constructor(
    readonly _ipfs: IpfsApi,
    private readonly topic: string,
    readonly repository: Repository,
    private readonly _logger: DiagnosticsLogger,
    private readonly _pubsubLogger: ServiceLogger
  ) {
    const pubsub = new Pubsub(_ipfs, topic, IPFS_RESUBSCRIBE_INTERVAL_DELAY, _pubsubLogger, _logger)
    this.messageBus = new MessageBus(
      new PubsubRateLimit(
        new PubsubKeepalive(pubsub, MAX_PUBSUB_PUBLISH_INTERVAL),
        _logger,
        MAX_QUERIES_PER_SECOND,
        MAX_QUEUED_QUERIES
      )
    )
    this.messageBus.subscribe(this.handleMessage.bind(this))
    this.dagNodeCache = new LRUMap<string, any>(IPFS_CACHE_SIZE)
  }

  /**
   * Store Ceramic commit (genesis|signed|anchor).
   *
   * @param data - Ceramic commit data
   * @param streamId - StreamID of the stream the commit belongs to, used for logging.
   */
  async storeCommit(data: any, streamId?: StreamID): Promise<CID> {
    try {
      if (StreamUtils.isSignedCommitContainer(data)) {
        const { jws, linkedBlock } = data
        // put the JWS into the ipfs dag
        const cid = await this._ipfs.dag.put(jws, { format: 'dag-jose', hashAlg: 'sha2-256' })
        // put the payload into the ipfs dag
        await this._ipfs.block.put(linkedBlock, { cid: jws.link.toString() })
        await this._restrictCommitSize(jws.link.toString())
        await this._restrictCommitSize(cid)
        return cid
      }
      const cid = await this._ipfs.dag.put(data)
      await this._restrictCommitSize(cid)
      return cid
    } catch (e) {
      if (streamId) {
        this._logger.err(
          `Error while storing commit to IPFS for stream ${streamId.toString()}: ${e}`
        )
      } else {
        this._logger.err(`Error while storing commit to IPFS: ${e}`)
      }
      throw e
    }
  }

  /**
   * Retrieves one Ceramic commit by CID, and enforces that the commit doesn't exceed the maximum
   * commit size. To load an IPLD path or a CID from IPFS that isn't a Ceramic commit,
   * use `retrieveFromIPFS`.
   *
   * @param cid - Commit CID
   * @param streamId - StreamID of the stream the commit belongs to, used for logging.
   */
  async retrieveCommit(cid: CID | string, streamId?: StreamID): Promise<any> {
    try {
      const result = await this._getFromIpfs(cid)
      await this._restrictCommitSize(cid)
      return result
    } catch (e) {
      if (streamId) {
        this._logger.err(
          `Error while loading commit CID ${cid.toString()} from IPFS for stream ${streamId.toString()}: ${e}`
        )
      } else {
        this._logger.err(`Error while loading commit CID ${cid.toString()} from IPFS: ${e}`)
      }
      throw e
    }
  }

  /**
   * Retrieves an object from the IPFS dag
   * @param cid
   * @param path - optional IPLD path to load, starting from the object represented by `cid`
   */
  async retrieveFromIPFS(cid: CID | string, path?: string): Promise<any> {
    try {
      return this._getFromIpfs(cid, path)
    } catch (e) {
      this._logger.err(`Error while loading CID ${cid.toString()} from IPFS: ${e}`)
      throw e
    }
  }

  /**
   * Helper function for loading a CID from IPFS
   */
  private async _getFromIpfs(cid: CID | string, path?: string): Promise<any> {
    const asCid = typeof cid === 'string' ? new CID(cid) : cid

    // Lookup CID in cache before looking it up IPFS
    const cidAndPath = path ? asCid.toString() + path : asCid.toString()
    const cachedDagNode = await this.dagNodeCache.get(cidAndPath)
    if (cachedDagNode) return cloneDeep(cachedDagNode)

    // Now lookup CID in IPFS, with retry logic
    // Note, in theory retries shouldn't be necessary, as just increasing the timeout should
    // allow IPFS to use the extra time to find the CID, doing internal retries if needed.
    // Anecdotally, however, we've seen evidence that IPFS sometimes finds CIDs on retry that it
    // doesn't on the first attempt, even when given plenty of time to load it.
    let dagResult = null
    for (let retries = IPFS_GET_RETRIES - 1; retries >= 0 && dagResult == null; retries--) {
      try {
        dagResult = await this._ipfs.dag.get(asCid, { timeout: IPFS_GET_TIMEOUT, path })
      } catch (err) {
        if (err.code == 'ERR_TIMEOUT') {
          console.warn(
            `Timeout error while loading CID ${cid.toString()} from IPFS. ${retries} retries remain`
          )
          if (retries > 0) {
            continue
          }
        }

        throw err
      }
    }
    // CID loaded successfully, store in cache
    await this.dagNodeCache.set(cidAndPath, dagResult.value)
    return cloneDeep(dagResult.value)
  }

  /**
   * Restricts commit size to IPFS_MAX_COMMIT_SIZE
   * @param cid - Commit CID
   * @private
   */
  async _restrictCommitSize(cid: CID | string): Promise<void> {
    const stat = await this._ipfs.block.stat(cid, { timeout: IPFS_GET_TIMEOUT })
    if (stat.size > IPFS_MAX_COMMIT_SIZE) {
      throw new Error(
        `${cid.toString()} commit size ${
          stat.size
        } exceeds the maximum block size of ${IPFS_MAX_COMMIT_SIZE}`
      )
    }
  }

  /**
   * Publishes Tip commit to pub/sub topic.
   *
   * @param streamId  - Stream ID
   * @param tip - Commit CID
   */
  publishTip(streamId: StreamID, tip: CID): Subscription {
    return this.publish({ typ: MsgType.UPDATE, stream: streamId, tip: tip })
  }

  /**
   * Handles one message from the pubsub topic.
   */
  async handleMessage(message: PubsubMessage): Promise<void> {
    try {
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
        case MsgType.KEEPALIVE:
          break
        default:
          throw new UnreachableCaseError(message, `Unsupported message type`)
      }
    } catch (e) {
      // TODO: Combine these two log statements into one line so that they can't get split up in the
      // log output.
      this._logger.err(
        `Error while processing ${messageTypeToString(message.typ)} message from pubsub: ${e}`
      )
      this._logger.err(e) // Log stack trace
    }
  }

  /**
   * Handles an incoming Update message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleUpdateMessage(message: UpdateMessage): Promise<void> {
    // TODO Add validation the message adheres to the proper format.

    const { stream: streamId, tip } = message
    // TODO: add cache of cids here so that we don't emit event
    // multiple times if we get the message from more than one peer.
    this.repository.stateManager.update(streamId, tip)
    // TODO: Handle 'anchorService' if present in message
  }

  /**
   * Handles an incoming Query message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleQueryMessage(message: QueryMessage): Promise<void> {
    // TODO Add validation the message adheres to the proper format.

    const { stream: streamId, id } = message
    const streamState = await this.repository.streamState(streamId)
    if (streamState) {
      // TODO: Should we validate that the 'id' field is the correct hash of the rest of the message?

      const tip = streamState.log[streamState.log.length - 1].cid
      // Build RESPONSE message and send it out on the pub/sub topic
      // TODO: Handle 'paths' for multiquery support
      const tipMap = new Map().set(streamId.toString(), tip)
      this.publish({ typ: MsgType.RESPONSE, id, tips: tipMap })
    }
  }

  /**
   * Handles an incoming Response message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleResponseMessage(message: ResponseMessage): Promise<void> {
    const { id: queryId, tips } = message
    const expectedStreamID = this.messageBus.outstandingQueries.get(queryId)
    if (expectedStreamID) {
      const newTip = tips.get(expectedStreamID.toString())
      if (!newTip) {
        throw new Error(
          "Response to query with ID '" +
            queryId +
            "' is missing expected new tip for StreamID '" +
            expectedStreamID +
            "'"
        )
      }
      this.repository.stateManager.update(expectedStreamID, newTip)
      this.messageBus.outstandingQueries.delete(queryId)
      // TODO Iterate over all streams in 'tips' object and process the new tip for each
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
