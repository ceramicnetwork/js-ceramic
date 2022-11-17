import { CID } from 'multiformats/cid'
import cloneDeep from 'lodash.clonedeep'
import {
  DiagnosticsLogger,
  IpfsApi,
  ServiceLogger,
  StreamUtils,
  UnreachableCaseError,
  base64urlToJSON,
} from '@ceramicnetwork/common'
import { StreamID } from '@ceramicnetwork/streamid'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import { Repository } from './state-management/repository.js'
import {
  MsgType,
  PubsubMessage,
  QueryMessage,
  ResponseMessage,
  UpdateMessage,
} from './pubsub/pubsub-message.js'
import { Pubsub } from './pubsub/pubsub.js'
import { Subscription } from 'rxjs'
import { MessageBus } from './pubsub/message-bus.js'
import lru from 'lru_map'
import { PubsubKeepalive } from './pubsub/pubsub-keepalive.js'
import { PubsubRateLimit } from './pubsub/pubsub-ratelimit.js'
import { TaskQueue } from './pubsub/task-queue.js'
import { Utils } from './utils.js'
import type { ShutdownSignal } from './shutdown-signal.js'

const IPFS_GET_RETRIES = 3
const DEFAULT_IPFS_GET_TIMEOUT = 30000 // 30 seconds per retry, 3 retries = 90 seconds total timeout
const IPFS_MAX_COMMIT_SIZE = 256000 // 256 KB
const IPFS_RESUBSCRIBE_INTERVAL_DELAY = 1000 * 15 // 15 sec
const MAX_PUBSUB_PUBLISH_INTERVAL = 60 * 1000 // one minute
const MAX_INTERVAL_WITHOUT_KEEPALIVE = 24 * 60 * 60 * 1000 // one day
const IPFS_CACHE_SIZE = 1024 // maximum cache size of 256MB
const IPFS_OFFLINE_GET_TIMEOUT = 200 // low timeout to work around lack of 'offline' flag support in js-ipfs
const PUBSUB_CACHE_SIZE = 500

const ERROR_IPFS_TIMEOUT = 'ipfs_timeout'
const ERROR_STORING_COMMIT = 'error_storing_commit'
const COMMITS_STORED = 'commits_stored'

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

  /**
   * Cache IPFS objects.
   */
  readonly dagNodeCache: lru.LRUMap<string, any>

  /**
   * Cache recently seen tips processed via incoming pubsub UPDATE or RESPONSE messages.
   * Keys are the tip CIDs, values are the StreamID that was associated with the commit in the
   * pubsub message.
   *
   * It's important that if we see the same tip associated with a different StreamID
   * that we still process it. In normal circumstances this will never happen, but if we didn't
   * do this then an attacker could cause us to fail to process valid commits by sending them out
   * to pubsub with the wrong StreamID associated in the pubsub message.
   * @private
   */
  private readonly pubsubCache: lru.LRUMap<string, string> = new lru.LRUMap<string, string>(
    PUBSUB_CACHE_SIZE
  )

  // Set of IDs for QUERY messages we have sent to the pub/sub topic but not yet heard a
  // corresponding RESPONSE message for. Maps the query ID to the primary StreamID we were querying for.
  constructor(
    readonly _ipfs: IpfsApi,
    private readonly topic: string,
    readonly repository: Repository,
    private readonly _logger: DiagnosticsLogger,
    private readonly _pubsubLogger: ServiceLogger,
    private readonly _shutdownSignal: ShutdownSignal,
    maxQueriesPerSecond: number,
    readonly tasks: TaskQueue = new TaskQueue(),
    private readonly _ipfsTimeout = DEFAULT_IPFS_GET_TIMEOUT
  ) {
    const pubsub = new Pubsub(
      _ipfs,
      topic,
      IPFS_RESUBSCRIBE_INTERVAL_DELAY,
      _pubsubLogger,
      _logger,
      tasks
    )
    this.messageBus = new MessageBus(
      new PubsubRateLimit(
        new PubsubKeepalive(pubsub, MAX_PUBSUB_PUBLISH_INTERVAL, MAX_INTERVAL_WITHOUT_KEEPALIVE),
        _logger,
        maxQueriesPerSecond
      )
    )
    this.messageBus.subscribe(this.handleMessage.bind(this))
    this.dagNodeCache = new lru.LRUMap<string, any>(IPFS_CACHE_SIZE)
  }

  /**
   * Store Ceramic commit (genesis|signed|anchor).
   *
   * @param data - Ceramic commit data
   * @param streamId - StreamID of the stream the commit belongs to, used for logging.
   */
  async storeCommit(data: any, streamId?: StreamID): Promise<CID> {
    Metrics.count(COMMITS_STORED, 1)
    try {
      if (StreamUtils.isSignedCommitContainer(data)) {
        const { jws, linkedBlock, cacaoBlock } = data
        // if cacao is present, put it into ipfs dag
        if (cacaoBlock) {
          const decodedProtectedHeader = base64urlToJSON(data.jws.signatures[0].protected)
          const capIPFSUri = decodedProtectedHeader.cap
          await this._shutdownSignal.abortable((signal) => {
            return Utils.putIPFSBlock(capIPFSUri, cacaoBlock, this._ipfs, signal)
          })
        }

        // put the JWS into the ipfs dag
        const cid = await this._shutdownSignal.abortable((signal) => {
          return this._ipfs.dag.put(jws, {
            storeCodec: 'dag-jose',
            hashAlg: 'sha2-256',
            signal: signal,
          })
        })
        // put the payload into the ipfs dag
        const linkCid = jws.link
        await this._shutdownSignal.abortable((signal) => {
          return Utils.putIPFSBlock(linkCid, linkedBlock, this._ipfs, signal)
        })
        await this._restrictCommitSize(jws.link.toString())
        await this._restrictCommitSize(cid)
        return cid
      }
      const cid = await this._shutdownSignal.abortable((signal) => {
        return this._ipfs.dag.put(data, { signal: signal })
      })
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
      Metrics.count(ERROR_STORING_COMMIT, 1)
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
  async retrieveCommit(cid: CID | string, streamId: StreamID): Promise<any> {
    try {
      const result = await this._getFromIpfs(cid)
      await this._restrictCommitSize(cid)
      return result
    } catch (e) {
      this._logger.err(
        `Error while loading commit CID ${cid.toString()} from IPFS for stream ${streamId.toString()}: ${e}`
      )
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
      return await this._getFromIpfs(cid, path)
    } catch (e) {
      this._logger.err(`Error while loading CID ${cid.toString()} from IPFS: ${e}`)
      throw e
    }
  }

  /**
   * Checks if the local IPFS node has the data for the given CID, without needing to load it from
   * the network.
   * @param cid
   */
  async cidExistsInLocalIPFSStore(cid: CID | string): Promise<boolean> {
    const asCid = typeof cid === 'string' ? CID.parse(cid) : cid
    try {
      // With the 'offline' flag set loading a CID from ipfs should be functionally instantaneous
      // as there's no networking i/o happening. With go-ipfs this works as expected and trying
      // to load a CID that doesn't exist fails instantly with an error that the given key wasn't
      // found in the state store.  Unfortunately js-ipfs doesn't seem to respect the 'offline'
      // flag, so we approximate the behavior by setting a low timeout instead.
      const result = await this._ipfs.dag.get(asCid, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        offline: true,
        timeout: IPFS_OFFLINE_GET_TIMEOUT,
      })
      return result != null
    } catch (err) {
      console.warn(`Error loading CID ${cid.toString()} from local IPFS node: ${err}`)
      return false
    }
  }

  /**
   * Helper function for loading a CID from IPFS
   */
  private async _getFromIpfs(cid: CID | string, path?: string): Promise<any> {
    const asCid = typeof cid === 'string' ? CID.parse(cid) : cid

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
        dagResult = await this._shutdownSignal.abortable((signal) => {
          return this._ipfs.dag.get(asCid, {
            timeout: this._ipfsTimeout,
            path,
            signal: signal,
          })
        })
      } catch (err) {
        if (
          err.code == 'ERR_TIMEOUT' ||
          err.name == 'TimeoutError' ||
          err.message == 'Request timed out'
        ) {
          console.warn(
            `Timeout error while loading CID ${asCid.toString()} from IPFS. ${retries} retries remain`
          )
          Metrics.count(ERROR_IPFS_TIMEOUT, 1)

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
    const asCid = typeof cid === 'string' ? CID.parse(cid) : cid
    const stat = await this._shutdownSignal.abortable((signal) => {
      return this._ipfs.block.stat(asCid, {
        timeout: this._ipfsTimeout,
        signal: signal,
      })
    })
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
  publishTip(streamId: StreamID, tip: CID, model?: StreamID): Subscription {
    return this.publish({ typ: MsgType.UPDATE, stream: streamId, tip, model })
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
   * Handle a new tip learned about from pubsub, either via an UPDATE or a RESPONSE message
   */
  async _handleTip(tip: CID, streamId: StreamID, model?: StreamID) {
    if (this.pubsubCache.get(tip.toString()) === streamId.toString()) {
      // This tip was already processed for this streamid recently, no need to re-process it.
      return
    }
    // Add tip to pubsub cache and continue processing
    this.pubsubCache.set(tip.toString(), streamId.toString())

    await this.repository.stateManager.handlePubsubUpdate(streamId, tip, model)
  }

  /**
   * Handles an incoming Update message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleUpdateMessage(message: UpdateMessage): Promise<void> {
    // TODO Add validation the message adheres to the proper format.
    const { stream: streamId, tip, model } = message
    return this._handleTip(tip, streamId, model)
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
    const outstandingQuery = this.messageBus.outstandingQueries.queryMap.get(queryId)
    const expectedStreamID = outstandingQuery?.streamID
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

      return this._handleTip(newTip, expectedStreamID)
      // TODO Iterate over all streams in 'tips' object and process the new tip for each
    }
  }

  /**
   * Gracefully closes the Dispatcher.
   */
  async close(): Promise<void> {
    this.messageBus.unsubscribe()
    await this.tasks.onIdle()
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
