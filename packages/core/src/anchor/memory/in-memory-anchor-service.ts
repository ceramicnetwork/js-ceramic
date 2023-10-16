import type { AnchorEvent, CeramicApi } from '@ceramicnetwork/common'
import { type DiagnosticsLogger } from '@ceramicnetwork/common'
import { type CAR } from 'cartonne'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { NotCompleteStatusName } from '@ceramicnetwork/codecs'
import type { AnchorLoopHandler, AnchorService, AnchorValidator } from '../anchor-service.js'
import { InMemoryAnchorValidator } from './in-memory-anchor-validator.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'
import { InMemoryCAS } from './in-memory-cas.js'
import { CID } from 'multiformats'
import { AnchorProcessingLoop } from '../anchor-processing-loop.js'

const CHAIN_ID = 'inmemory:12345'
const BATCH_SIZE = 10
const DEFAULT_POLL_INTERVAL = 100 // 100 milliseconds

type InMemoryAnchorConfig = {
  anchorDelay: number
  anchorOnRequest: boolean
  enableLoop: boolean
}

/**
 * In-memory anchor service - used locally, not meant to be used in production code
 */
export class InMemoryAnchorService implements AnchorService {
  readonly #cas: InMemoryCAS
  readonly #logger: DiagnosticsLogger
  readonly #enableLoop: boolean

  #loop: AnchorProcessingLoop
  #store: AnchorRequestStore | undefined

  readonly url = '<inmemory>'
  readonly validator: AnchorValidator

  constructor(_config: Partial<InMemoryAnchorConfig> = {}, logger: DiagnosticsLogger) {
    this.#store = undefined
    this.#cas = new InMemoryCAS(CHAIN_ID, _config.anchorOnRequest ?? true)
    this.validator = new InMemoryAnchorValidator(CHAIN_ID)
    this.#logger = logger
    this.#enableLoop = _config.enableLoop ?? true
  }

  async init(store: AnchorRequestStore, eventHandler: AnchorLoopHandler): Promise<void> {
    this.#store = store
    this.#loop = new AnchorProcessingLoop(
      BATCH_SIZE,
      this.#cas,
      this.#store,
      this.#logger,
      eventHandler
    )
    if (this.#enableLoop) {
      this.#loop.start()
    }
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
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    // Do Nothing
  }

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   * @param waitForConfirmation - if true, waits until the CAS has acknowledged receipt of the anchor
   *   request before returning.
   */
  async requestAnchor(carFile: CAR, waitForConfirmation = false): Promise<AnchorEvent> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const streamId = carFileReader.streamId
    const tip = carFileReader.tip

    await this.#store.save(streamId, {
      cid: tip,
      genesis: carFileReader.genesis,
      timestamp: Date.now(),
    })

    return this.#cas.create(carFileReader, waitForConfirmation)
  }

  hasAccepted(tip: CID): Promise<void> {
    return this.#cas.hasAccepted(tip)
  }

  async close(): Promise<void> {
    await this.#cas.close()
    await this.#store.close()
    await this.#loop.stop()
  }
}
