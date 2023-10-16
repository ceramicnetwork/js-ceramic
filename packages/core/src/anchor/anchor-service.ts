import type { AnchorEvent, AnchorProof, CeramicApi, FetchRequest } from '@ceramicnetwork/common'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CID } from 'multiformats/cid'
import type { CAR } from 'cartonne'
import type { AnchorRequestStore } from '../store/anchor-request-store.js'
import type { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'

export type AnchorLoopHandler = {
  buildRequestCar(streamId: StreamID, tip: CID): Promise<CAR>
  handle(event: AnchorEvent): Promise<boolean>
}

/**
 * Describes anchoring service behavior
 */
export interface AnchorService {
  readonly validator: AnchorValidator

  /**
   * Performs whatever initialization work is required by the specific anchor service implementation
   */
  init(store: AnchorRequestStore, eventHandler: AnchorLoopHandler): Promise<void>

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  ceramic: CeramicApi

  /**
   * URL of the connected anchor service
   */
  url: string

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   * @param waitForConfirmation - if true, waits until the CAS has acknowledged receipt of the anchor
   *   request before returning.
   */
  requestAnchor(carFile: CAR, waitForConfirmation: boolean): Promise<AnchorEvent>

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  getSupportedChains(): Promise<Array<string>>

  close(): Promise<void>
}

export interface AuthenticatedAnchorService extends AnchorService {
  /**
   * Set Anchor Service Auth instance
   *
   * @param auth - Anchor service authentication instance
   */
  auth: AnchorServiceAuth
}

export interface AnchorServiceAuth {
  /**
   * Performs whatever initialization work is required by the specific auth implementation
   */
  init(): Promise<void>

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  ceramic: CeramicApi

  /**
   *
   * @param url - Anchor service url as URL or string
   * @param {FetchOpts} opts - Optional options for the request
   */
  sendAuthenticatedRequest: FetchRequest
}

/**
 * Describes behavior for validation anchor commit inclusion on chain
 */
export interface AnchorValidator {
  /**
   * The ethereum chainId used for anchors.
   */
  chainId: string

  /**
   * The ethereum rpc endpoint used to validate anchor transactions. If null, likely means
   * the node is using the default, rate-limited ethereum provider.
   */
  ethereumRpcEndpoint: string | null

  /**
   * Performs whatever initialization work is required to validate commits anchored on the
   * configured blockchain.
   */
  init(chainId: string | null): Promise<void>

  /**
   * Verifies that the given anchor proof refers to a valid ethereum transaction that actually
   * includes the expected merkle root in the transaction data.  Throws if the transaction doesn't
   * contain the expected data.
   * @param anchorProof Proof of blockchain inclusion
   * @returns The ethereum block timestamp that includes the anchor transaction from the anchorProof
   */
  validateChainInclusion(anchorProof: AnchorProof): Promise<number>
}

export interface CASClient {
  /**
   * Return supported chains by CAS as array of CAIP-2 identifiers.
   */
  supportedChains(): Promise<Array<string>>

  /**
   * Create an anchor request on CAS through `fetch`. If `waitForConfirmation` is `true`,
   * it only returns after getting a confirmation from CAS.
   */
  create(
    carFileReader: AnchorRequestCarFileReader,
    waitForConfirmation: boolean
  ): Promise<AnchorEvent>

  /**
   * Get current status of an anchor request from CAS for `streamId` and its `tip`.
   */
  getStatusForRequest(streamId: StreamID, commitCID: CID): Promise<AnchorEvent>

  /**
   * Abort any fetch requests to CAS.
   */
  close(): Promise<void>
}

export class NotSingleChainError extends Error {
  constructor() {
    super(
      "Anchor service returned multiple supported chains, which isn't supported by js-ceramic yet"
    )
  }
}

export class CasConnectionError extends Error {
  constructor(streamId: StreamID, tip: CID, cause: string) {
    super(
      `Error connecting to CAS while attempting to anchor ${streamId} at commit ${tip}: ${cause}`
    )
  }
}

export class MaxAnchorPollingError extends Error {
  constructor() {
    super('Exceeded max anchor polling time limit')
  }
}
