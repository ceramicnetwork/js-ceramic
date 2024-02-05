import { CID } from 'multiformats/cid'
import cloneDeep from 'lodash.clonedeep'
import {
  DiagnosticsLogger,
  IpfsApi,
  ServiceLogger,
  StreamUtils,
  UnreachableCaseError,
  base64urlToJSON,
  IpfsNodeStatus,
  toCID,
} from '@ceramicnetwork/common'
import { StreamID, EventID } from '@ceramicnetwork/streamid'
import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance'
import { Model } from '@ceramicnetwork/stream-model'
import { Repository } from './state-management/repository.js'
import {
  MsgType,
  PubsubMessage,
  QueryMessage,
  ResponseMessage,
  UpdateMessage,
} from './pubsub/pubsub-message.js'
import { Pubsub } from './pubsub/pubsub.js'
import { empty, Subscription } from 'rxjs'
import { MessageBus } from './pubsub/message-bus.js'
import { LRUCache } from 'least-recent'
import { PubsubKeepalive } from './pubsub/pubsub-keepalive.js'
import { PubsubRateLimit } from './pubsub/pubsub-ratelimit.js'
import { TaskQueue } from './ancillary/task-queue.js'
import type { ShutdownSignal } from './shutdown-signal.js'
import { CARFactory, CarBlock, type CAR } from 'cartonne'
import all from 'it-all'
import { IPFS_CACHE_HIT, IPFS_CACHE_MISS, IPLDRecordsCache } from './store/ipld-records-cache.js'
import { IReconApi } from './recon.js'
import { type CeramicNetworkOptions } from './initialization/network-options.js'

const IPFS_GET_RETRIES = 3
const DEFAULT_IPFS_GET_SYNC_TIMEOUT = 30000 // 30 seconds per retry, 3 retries = 90 seconds total timeout
const DEFAULT_IPFS_GET_LOCAL_TIMEOUT = 1000 // 1 second to get data from local ipfs store
const IPFS_MAX_COMMIT_SIZE = 256000 // 256 KB
const IPFS_RESUBSCRIBE_INTERVAL_DELAY = 1000 * 15 // 15 sec
const IPFS_NO_MESSAGE_INTERVAL = 1000 * 60 * 1 // 1 minutes
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

export class CommitSizeError extends Error {
  constructor(cid: CID | string, size: number) {
    super(`${cid} commit size ${size} exceeds the maximum block size of ${IPFS_MAX_COMMIT_SIZE}`)
  }
}

/**
 * Restricts block size to +IPFS_MAX_COMMIT_SIZE+.
 *
 * @param block - Uint8Array of IPLD block
 * @param cid - Commit CID
 * @internal
 */
function restrictBlockSize(block: Uint8Array, cid: CID): void {
  const size = block.byteLength
  if (size > IPFS_MAX_COMMIT_SIZE) throw new CommitSizeError(cid, size)
}

/**
 * Ceramic core Dispatcher used for handling messages from pub/sub topic.
 */
export class Dispatcher {
  readonly messageBus: MessageBus

  /**
   * Cache IPFS objects.
   */
  readonly ipldCache: IPLDRecordsCache

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
  private readonly pubsubCache: LRUCache<string, string> = new LRUCache(PUBSUB_CACHE_SIZE)

  private readonly carFactory: CARFactory
  private readonly _ipfsTimeout: number

  /**
   * Controls whether we should try to load CIDs from other peers.
   * @private
   */
  readonly enableSync: boolean

  // Set of IDs for QUERY messages we have sent to the pub/sub topic but not yet heard a
  // corresponding RESPONSE message for. Maps the query ID to the primary StreamID we were querying for.
  constructor(
    readonly _ipfs: IpfsApi,
    private readonly networkOptions: CeramicNetworkOptions,
    readonly repository: Repository,
    private readonly _logger: DiagnosticsLogger,
    private readonly _pubsubLogger: ServiceLogger,
    private readonly _shutdownSignal: ShutdownSignal,
    enableSync: boolean,
    maxQueriesPerSecond: number,
    private readonly recon: IReconApi,
    readonly tasks: TaskQueue = new TaskQueue()
  ) {
    this.enableSync = process.env.CERAMIC_RECON_MODE ? false : enableSync

    if (!process.env.CERAMIC_RECON_MODE) {
      const pubsub = new Pubsub(
        _ipfs,
        networkOptions.pubsubTopic,
        IPFS_RESUBSCRIBE_INTERVAL_DELAY,
        IPFS_NO_MESSAGE_INTERVAL,
        _pubsubLogger,
        _logger,
        tasks
      )
      this.messageBus = new MessageBus(
        new PubsubRateLimit(
          new PubsubKeepalive(
            pubsub,
            _ipfs,
            MAX_PUBSUB_PUBLISH_INTERVAL,
            MAX_INTERVAL_WITHOUT_KEEPALIVE
          ),
          _logger,
          maxQueriesPerSecond
        ),
        !this.enableSync
      )
    }
    this.ipldCache = new IPLDRecordsCache(IPFS_CACHE_SIZE)
    this.carFactory = new CARFactory()
    for (const codec of this._ipfs.codecs.listCodecs()) {
      this.carFactory.codecs.add(codec)
      this.ipldCache.codecs.add(codec)
    }
    if (this.enableSync) {
      this._ipfsTimeout = DEFAULT_IPFS_GET_SYNC_TIMEOUT
    } else {
      this._ipfsTimeout = DEFAULT_IPFS_GET_LOCAL_TIMEOUT
    }
  }

  async init() {
    if (process.env.CERAMIC_RECON_MODE) {
      return
    }
    this.messageBus.subscribe(this.handleMessage.bind(this))
  }

  get shutdownSignal(): ShutdownSignal {
    return this._shutdownSignal
  }

  async ipfsNodeStatus(): Promise<IpfsNodeStatus> {
    const ipfsId = await this._ipfs.id()
    const peerId = ipfsId.id.toString()
    const multiAddrs = ipfsId.addresses.map(String)
    return { peerId, addresses: multiAddrs }
  }

  async storeRecord(record: Record<string, unknown>): Promise<CID> {
    return this._shutdownSignal
      .abortable((signal) => this._ipfs.dag.put(record, { signal: signal }))
      .then((cid) => {
        // TODO(CORE-137) - Replace ipfs-core-types to get consistent multiformats version
        const cidv13 = toCID(cid.toString())
        this.ipldCache.setRecord(cidv13, record)
        return cidv13
      })
  }

  async getIpfsBlock(cid: CID): Promise<CarBlock> {
    const found = this.ipldCache.get(cid)
    if (found) {
      Metrics.count(IPFS_CACHE_HIT, 1)
      return new CarBlock(cid, found.block)
    } else {
      Metrics.count(IPFS_CACHE_MISS, 1)
      const bytes = await this._shutdownSignal.abortable((signal) => {
        // @ts-expect-error
        return this._ipfs.block.get(cid, { signal, offline: !this.enableSync })
      })
      this.ipldCache.setBlock(cid, bytes)
      return new CarBlock(cid, bytes)
    }
  }

  /**
   * Imports an anchor witness CAR.
   * @param car - The anchor witness CAR to import.
   * @param cid - The CID of the anchor witness CAR.
   * @param streamId - The ID of the stream to associate the anchor witness CAR with.
   * @param controllers - An array of controller IDs for the stream.
   * @param eventHeight - The height of the event associated with the anchor witness CAR commit
   * @param model - The ID of the model stream, if applicable.
   */
  async importAnchorWitnessCar(
    car: CAR,
    cid: CID,
    streamId: StreamID,
    controllers: Array<string>,
    eventHeight: number,
    model?: StreamID
  ): Promise<void> {
    const eventId =
      this.recon.enabled && model
        ? EventID.create(
            this.networkOptions.name,
            this.networkOptions.offset,
            'model',
            model.toString(),
            controllers[0],
            streamId.cid,
            eventHeight,
            cid
          )
        : undefined

    await this.importCAR(car, eventId)
    Metrics.count(COMMITS_STORED, 1)
  }

  /**
   * Stores all the blocks in the given CAR file into the local IPFS node or recon node
   * @param car
   * @param eventId eventId needed to store blocks in recon mode
   */
  importCAR(car: CAR, eventId?: EventID): Promise<void> {
    if (eventId) {
      return this.recon.put({ eventId, eventData: car })
    } else {
      return this._shutdownSignal.abortable(async (signal) => {
        await all(this._ipfs.dag.import(car, { signal, pinRoots: false }))
      })
    }
  }

  _addCommitToCar(carFile: CAR, data: any): CID {
    if (StreamUtils.isSignedCommitContainer(data)) {
      const { jws, linkedBlock, cacaoBlock } = data
      // if cacao is present, put it into ipfs dag
      if (cacaoBlock) {
        const decodedProtectedHeader = base64urlToJSON(data.jws.signatures[0].protected)
        const capCID = CID.parse(decodedProtectedHeader.cap.replace('ipfs://', ''))
        carFile.blocks.put(new CarBlock(capCID, cacaoBlock))
        restrictBlockSize(cacaoBlock, capCID)
        this.ipldCache.set(capCID, {
          record: carFile.get(capCID),
          block: cacaoBlock,
        })
      }

      const payloadCID = jws.link
      carFile.blocks.put(new CarBlock(payloadCID, linkedBlock)) // Encode payload
      restrictBlockSize(linkedBlock, jws.link)
      this.ipldCache.set(payloadCID, {
        record: carFile.get(payloadCID),
        block: linkedBlock,
      })
      const cid = carFile.put(jws, { codec: 'dag-jose', hasher: 'sha2-256', isRoot: true }) // Encode JWS itself
      const cidBlock = carFile.blocks.get(cid).payload
      restrictBlockSize(cidBlock, cid)
      this.ipldCache.set(cid, {
        record: carFile.get(cid),
        block: cidBlock,
      })
      return cid
    }

    const cid = carFile.put(data, { isRoot: true })
    const cidBlock = carFile.blocks.get(cid).payload
    restrictBlockSize(cidBlock, cid)
    this.ipldCache.set(cid, {
      record: carFile.get(cid),
      block: cidBlock,
    })
    return cid
  }

  /**
   * TODO: remove
   * Store Ceramic commit (genesis|signed|anchor).
   * This is the old pre recon way to store commits
   *
   * @param data - Ceramic commit data
   * @param streamId - StreamID of the stream the commit belongs to, used for logging.
   */
  async ipfsStoreCommit(data: any, streamId?: StreamID): Promise<CID> {
    const carFile = this.carFactory.build()
    const cid = this._addCommitToCar(carFile, data)
    try {
      await this.importCAR(carFile)
      Metrics.count(COMMITS_STORED, 1)
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
   * Store Ceramic commit (genesis|signed|anchor).
   *
   * @param data - Ceramic commit data
   * @param commitHeight - The height of the commit
   * @param streamId - StreamID of the stream the commit belongs to, used for logging.
   * @param controllers - An array of controller IDs for the stream.
   * @param model - The ID of the model stream, if applicable.
   */
  async storeCommit(
    data: any,
    commitHeight: number,
    streamId?: StreamID,
    controllers?: Array<string>,
    model?: StreamID
  ): Promise<CID> {
    const carFile = this.carFactory.build()
    const cid = this._addCommitToCar(carFile, data)

    try {
      if (this.recon.enabled) {
        const header = StreamUtils.isSignedCommitContainer(data)
          ? data.linkedBlock.header
          : data.header
        model = model || StreamID.fromBytes(header.model)
        controllers = controllers || header.controllers

        if (model) {
          if (!commitHeight) {
            throw new Error(
              'commitHeight is required for storing commits for mid and model streams in recon mode'
            )
          }

          const type = model.equals(Model.MODEL)
            ? Model.STREAM_TYPE_ID
            : ModelInstanceDocument.STREAM_TYPE_ID

          streamId = streamId || new StreamID(type, cid)
          const eventId = EventID.create(
            this.networkOptions.name,
            this.networkOptions.offset,
            'model',
            model.toString(),
            controllers[0],
            streamId.cid,
            commitHeight,
            cid
          )

          await this.importCAR(carFile, eventId)
          Metrics.count(COMMITS_STORED, 1)
          return cid
        }
      }

      await this.importCAR(carFile)
      Metrics.count(COMMITS_STORED, 1)
      return cid
    } catch (e) {
      this._logger.err(`Error while storing commit to IPFS for stream ${streamId.toString()}: ${e}`)
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
      return await this._getFromIpfs(cid)
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
      this._logger.warn(`Error loading CID ${cid.toString()} from local IPFS node: ${err}`)
      return false
    }
  }

  /**
   * Helper function for loading a CID from IPFS
   */
  private async _getFromIpfs(cid: CID | string, path?: string): Promise<any> {
    const asCid = typeof cid === 'string' ? CID.parse(cid) : cid

    // Lookup CID in cache before looking it up IPFS
    const resolutionPath = `${asCid}${path || ''}`
    const fromCache = this.ipldCache.getWithResolutionPath(resolutionPath)
    if (fromCache) {
      Metrics.count(IPFS_CACHE_HIT, 1)
      return cloneDeep(fromCache.record)
    }
    Metrics.count(IPFS_CACHE_MISS, 1)

    // Now lookup CID in IPFS, with retry logic
    // Note, in theory retries shouldn't be necessary, as just increasing the timeout should
    // allow IPFS to use the extra time to find the CID, doing internal retries if needed.
    // Anecdotally, however, we've seen evidence that IPFS sometimes finds CIDs on retry that it
    // doesn't on the first attempt, even when given plenty of time to load it.
    let result = null
    for (let retries = IPFS_GET_RETRIES - 1; retries >= 0 && result == null; retries--) {
      try {
        let blockCid: CID = asCid
        if (path) {
          const resolution = await this._shutdownSignal.abortable((signal) =>
            this._ipfs.dag.resolve(asCid, {
              timeout: this._ipfsTimeout,
              path: path,
              signal: signal,
              // @ts-ignore
              offline: this.recon.enabled,
            })
          )
          // TODO(CORE-137) - Replace ipfs-core-types to get consistent multiformats version
          blockCid = toCID(resolution.cid.toString())
        }
        const codec = await this._ipfs.codecs.getCodec(blockCid.code)
        const block = await this._shutdownSignal.abortable((signal) =>
          this._ipfs.block.get(blockCid, {
            timeout: this._ipfsTimeout,
            signal: signal,
            // @ts-ignore
            offline: !this.enableSync || this.recon.enabled,
          })
        )
        restrictBlockSize(block, blockCid)
        result = codec.decode(block)
        // CID loaded successfully, store in cache
        this.ipldCache.setWithResolutionPath(resolutionPath, {
          record: result,
          block: block,
        })
        return cloneDeep(result)
      } catch (err) {
        if (
          err.code == 'ERR_TIMEOUT' ||
          err.name == 'TimeoutError' ||
          err.message == 'Request timed out'
        ) {
          this._logger.warn(
            `Timeout error while loading CID ${asCid.toString()} from IPFS. ${retries} retries remain`
          )
          Metrics.count(ERROR_IPFS_TIMEOUT, 1)

          if (retries > 0) {
            continue
          } else {
            throw new Error(`Timeout error while loading CID ${asCid.toString()} from IPFS: ${err}`)
          }
        }

        throw err
      }
    }
  }

  /**
   * Publishes Tip commit to pub/sub topic.
   *
   * @param streamId  - Stream ID
   * @param tip - Commit CID
   */
  publishTip(streamId: StreamID, tip: CID, model?: StreamID): Subscription {
    if (process.env.CERAMIC_DISABLE_PUBSUB_UPDATES == 'true' || process.env.CERAMIC_RECON_MODE) {
      return empty().subscribe()
    }

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

    await this.repository.handleUpdateFromNetwork(streamId, tip, model)
  }

  /**
   * Handles an incoming Update message from the pub/sub topic.
   * @param message
   * @private
   */
  async _handleUpdateMessage(message: UpdateMessage): Promise<void> {
    if (!this.enableSync) {
      // No point in trying to apply the tip if we know we won't be able to load it from IPFS.
      return
    }
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
    if (!this.enableSync) {
      // No point in trying to apply the tip if we know we won't be able to load it from IPFS.
      return
    }

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
    if (!process.env.CERAMIC_RECON_MODE) {
      this.messageBus.unsubscribe()
    }
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
