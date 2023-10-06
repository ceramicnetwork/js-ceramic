import { fetchJson } from '@ceramicnetwork/common'
import type {
  AnchorEvent,
  FetchRequest,
  DiagnosticsLogger,
  CeramicApi,
} from '@ceramicnetwork/common'
import { Subject, type Observable } from 'rxjs'
import type { CAR } from 'cartonne'
import { AnchorRequestCarFileReader } from '../anchor-request-car-file-reader.js'
import { AnchorRequestStatusName } from '@ceramicnetwork/codecs'
import { EthereumAnchorValidator } from './ethereum-anchor-validator.js'
import type {
  AnchorService,
  AnchorServiceAuth,
  AnchorValidator,
  AuthenticatedAnchorService,
  CASClient,
} from '../anchor-service.js'
import type { AnchorRequestStore } from '../../store/anchor-request-store.js'
import { MultipleChainsError, type AnchorLoopHandler } from '../anchor-service.js'
import { AnchorProcessingLoop } from '../anchor-processing-loop.js'
import { RemoteCAS } from './remote-cas.js'

const DEFAULT_POLL_INTERVAL = 60_000 // 60 seconds
const MAX_POLL_TIME = 86_400_000 // 24 hours

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export class EthereumAnchorService implements AnchorService {
  readonly #logger: DiagnosticsLogger
  #loop: AnchorProcessingLoop
  /**
   * Retry a request to CAS every +pollInterval+ milliseconds.
   */
  readonly #pollInterval: number
  readonly #maxPollTime: number
  readonly #events: Subject<AnchorEvent>

  #chainId: string
  #store: AnchorRequestStore
  #cas: CASClient

  readonly url: string
  readonly events: Observable<AnchorEvent>
  readonly validator: AnchorValidator

  constructor(
    anchorServiceUrl: string,
    ethereumRpcUrl: string | undefined,
    logger: DiagnosticsLogger,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
    maxPollTime = MAX_POLL_TIME,
    sendRequest: FetchRequest = fetchJson
  ) {
    this.#logger = logger
    this.#pollInterval = pollInterval
    this.#maxPollTime = maxPollTime
    this.#events = new Subject()
    this.#cas = new RemoteCAS(anchorServiceUrl, logger, pollInterval, maxPollTime, sendRequest)
    this.events = this.#events
    this.url = anchorServiceUrl
    this.validator = new EthereumAnchorValidator(ethereumRpcUrl, logger)
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    // Do Nothing
  }

  async init(store: AnchorRequestStore, eventHandler: AnchorLoopHandler): Promise<void> {
    // FIXME add onEvent
    this.#store = store
    // Get the chainIds supported by our anchor service
    const supportedChains = await this.#cas.supportedChains()
    if (supportedChains.length > 1) {
      throw new MultipleChainsError()
    }
    this.#chainId = supportedChains[0]
    await this.validator.init(this.#chainId)
    const batchSize = 10 // FIXME
    this.#loop = new AnchorProcessingLoop(
      this.#pollInterval,
      batchSize,
      this.#cas,
      this.#store,
      this.#logger,
      eventHandler
    )
    this.#loop.start()
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return [this.#chainId]
  }

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   * @param waitForConfirmation - if true, waits until the CAS has acknowledged receipt of the anchor
   *   request before returning.
   */
  async requestAnchor(carFile: CAR, waitForConfirmation: boolean): Promise<AnchorEvent> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const streamId = carFileReader.streamId
    const tip = carFileReader.tip

    await this.#store.save(streamId, {
      cid: tip,
      genesis: carFileReader.genesis,
      timestamp: Date.now(),
    })

    if (waitForConfirmation) {
      return this.#cas.create(carFileReader, waitForConfirmation)
    } else {
      return {
        status: AnchorRequestStatusName.PENDING,
        streamId: streamId,
        cid: tip,
        message: 'Sending anchoring request',
      }
    }
  }

  async close(): Promise<void> {
    await this.#cas.close()
    await this.#store.close()
    await this.#loop.stop()
  }
}

/**
 * Ethereum anchor service that authenticates requests
 */
export class AuthenticatedEthereumAnchorService
  extends EthereumAnchorService
  implements AuthenticatedAnchorService
{
  readonly auth: AnchorServiceAuth

  constructor(
    auth: AnchorServiceAuth,
    anchorServiceUrl: string,
    ethereumRpcUrl: string | undefined,
    logger: DiagnosticsLogger,
    pollInterval: number = DEFAULT_POLL_INTERVAL,
    maxPollTime: number = MAX_POLL_TIME
  ) {
    super(
      anchorServiceUrl,
      ethereumRpcUrl,
      logger,
      pollInterval,
      maxPollTime,
      auth.sendAuthenticatedRequest.bind(auth)
    )
    this.auth = auth
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    this.auth.ceramic = ceramic
  }

  async init(store: AnchorRequestStore, eventHandler: AnchorLoopHandler): Promise<void> {
    await this.auth.init()
    await super.init(store, eventHandler)
  }
}
