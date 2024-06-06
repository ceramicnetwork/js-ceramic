import type { AnchorEvent, CeramicSigner } from '@ceramicnetwork/common'
import {
  AnchorRequestStatusName,
  type NotCompleteStatusName,
  type DiagnosticsLogger,
} from '@ceramicnetwork/common'
import { type CAR } from 'cartonne'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import type { AnchorLoopHandler, AnchorService, AnchorValidator } from '../anchor-service.js'
import { InMemoryAnchorValidator } from './in-memory-anchor-validator.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'
import { InMemoryCAS } from './in-memory-cas.js'
import { AnchorProcessingLoop } from '../anchor-processing-loop.js'
import { doNotWait } from '../../ancillary/do-not-wait.js'
import { NamedTaskQueue } from '../../state-management/named-task-queue.js'
import { LRUCache } from 'least-recent'

const CHAIN_ID = 'inmemory:12345'
const BATCH_SIZE = 10

// Caches recent anchor txn hashes and the timestamp when they were anchored
// This is intentionally global and not a member of InMemoryAnchorService. This is so that when
// multiple InMemoryAnchorServices are being used simultaneously in the same process (usually by
// tests that use multiple Ceramic nodes), they can share the set of recent transactions and thus
// can successfully validate each others transactions.
export const TRANSACTION_CACHE = new LRUCache<string, number>(100)

type InMemoryAnchorConfig = {
  anchorDelay: number
  anchorOnRequest: boolean
  enableAnchorPollingLoop: boolean
}

/**
 * In-memory anchor service - used locally, not meant to be used in production code
 */
export class InMemoryAnchorService implements AnchorService {
  #signer?: CeramicSigner
  readonly #cas: InMemoryCAS
  readonly #logger: DiagnosticsLogger
  readonly #enableAnchorPollingLoop: boolean
  /**
   * Linearizes requests to AnchorRequestStore by stream id.  Shared with the AnchorProcessingLoop.
   */
  readonly #anchorStoreQueue: NamedTaskQueue

  private readonly transactionCache: LRUCache<string, number>

  #loop: AnchorProcessingLoop
  #store: AnchorRequestStore | undefined

  readonly url = '<inmemory>'
  readonly validator: AnchorValidator

  constructor(_config: Partial<InMemoryAnchorConfig> = {}, logger: DiagnosticsLogger) {
    this.#store = undefined
    this.transactionCache = TRANSACTION_CACHE
    this.validator = new InMemoryAnchorValidator(CHAIN_ID, this.transactionCache)
    this.#cas = new InMemoryCAS(CHAIN_ID, this.transactionCache, _config.anchorOnRequest ?? true)
    this.#logger = logger
    this.#enableAnchorPollingLoop = _config.enableAnchorPollingLoop ?? true
    this.#anchorStoreQueue = new NamedTaskQueue((error) => {
      logger.err(error)
    })
  }

  async init(store: AnchorRequestStore, eventHandler: AnchorLoopHandler): Promise<void> {
    this.#store = store
    this.#loop = new AnchorProcessingLoop(
      BATCH_SIZE,
      this.#cas,
      this.#store,
      this.#logger,
      eventHandler,
      this.#anchorStoreQueue
    )
    if (this.#enableAnchorPollingLoop) {
      this.#loop.start()
    }
  }

  assertCASAccessible(): void {
    this.#cas.assertCASAccessible()
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service
   */
  getSupportedChains(): Promise<Array<string>> {
    return this.#cas.supportedChains()
  }

  /**
   * Anchor requests
   */
  async anchor(): Promise<void> {
    this.#cas.anchor()
  }

  moveAnchors(
    from: NotCompleteStatusName | Array<NotCompleteStatusName>,
    to: NotCompleteStatusName,
    reset = false
  ): void {
    if (Array.isArray(from)) {
      for (const fromStatus of from) {
        this.#cas.moveAnchors(fromStatus, to, reset)
      }
    } else {
      this.#cas.moveAnchors(from, to, reset)
    }
  }

  /**
   * @inheritDoc
   */
  set signer(signer: CeramicSigner) {
    this.#signer = signer
  }

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   */
  async requestAnchor(carFile: CAR): Promise<AnchorEvent> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const streamId = carFileReader.streamId
    const tip = carFileReader.tip

    await this.#anchorStoreQueue.run(streamId.toString(), () =>
      this.#store.save(streamId, {
        cid: tip,
        genesis: carFileReader.genesis,
        timestamp: Date.now(),
      })
    )

    doNotWait(this.#cas.createRequest(carFileReader), this.#logger)
    return {
      status: AnchorRequestStatusName.PENDING,
      streamId: streamId,
      cid: tip,
      message: 'Sending anchoring request',
    }
  }

  async disableAnchorProcessingLoop() {
    return this.#loop.stop()
  }

  async close(): Promise<void> {
    await this.#cas.close()
    await this.#store.close()
    await this.#loop.stop()
  }
}
