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
import { NotSingleChainError, type AnchorLoopHandler } from '../anchor-service.js'
import { AnchorProcessingLoop } from '../anchor-processing-loop.js'
import { RemoteCAS } from './remote-cas.js'
import { doNotWait } from '../../ancillary/do-not-wait.js'

const DEFAULT_POLL_INTERVAL = 60_000 // 60 seconds
const BATCH_SIZE = 10

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export class EthereumAnchorService implements AnchorService {
  readonly #logger: DiagnosticsLogger
  #loop: AnchorProcessingLoop
  readonly #enableLoop: boolean
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
    sendRequest: FetchRequest = fetchJson,
    enableLoop = true
  ) {
    this.#logger = logger
    this.#events = new Subject()
    this.#cas = new RemoteCAS(anchorServiceUrl, logger, pollInterval, sendRequest)
    this.events = this.#events
    this.url = anchorServiceUrl
    this.validator = new EthereumAnchorValidator(ethereumRpcUrl, logger)
    this.#enableLoop = enableLoop
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
    this.#store = store
    // Get the chainIds supported by our anchor service
    const supportedChains = await this.#cas.supportedChains()
    if (supportedChains.length !== 1) {
      throw new NotSingleChainError()
    }
    this.#chainId = supportedChains[0]
    await this.validator.init(this.#chainId)
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
   * anchor service.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return [this.#chainId]
  }

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   */
  async requestAnchor(carFile: CAR): Promise<AnchorEvent> {
    const carFileReader = new AnchorRequestCarFileReader(carFile)
    const streamId = carFileReader.streamId
    const tip = carFileReader.tip

    await this.#store.save(streamId, {
      cid: tip,
      genesis: carFileReader.genesis,
      timestamp: Date.now(),
    })

    doNotWait(this.#cas.create(carFileReader), this.#logger)
    return {
      status: AnchorRequestStatusName.PENDING,
      streamId: streamId,
      cid: tip,
      message: 'Sending anchoring request',
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
    enableLoop = true
  ) {
    super(
      anchorServiceUrl,
      ethereumRpcUrl,
      logger,
      pollInterval,
      auth.sendAuthenticatedRequest.bind(auth),
      enableLoop
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
