import type { AnchorEvent, AnchorProof, FetchRequest } from '@ceramicnetwork/common'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CID } from 'multiformats/cid'
import type { CAR } from 'cartonne'
import type { AnchorRequestStore } from '../store/anchor-request-store.js'
import type { AnchorRequestCarFileReader } from './anchor-request-car-file-reader.js'
import { CeramicSigner } from '@ceramicnetwork/common'

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
   * Set Ceramic signer instance
   *
   * @param signer - Ceramic signer
   */
  signer: CeramicSigner

  /**
   * URL of the connected anchor service
   */
  url: string

  /**
   * Throws an error if we have consistently failed to contact the CAS for any requests for an
   * extended period of time.  This most likely points to either a networking failure or a
   * misconfiguration of the Ceramic node, though it could also indicate that the anchor service
   * itself is down for some reason.
   */
  assertCASAccessible(): void

  /**
   * Send request to the anchoring service
   * @param carFile - CAR file containing all necessary data for the CAS to anchor
   */
  requestAnchor(carFile: CAR): Promise<AnchorEvent>

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
   * Get or Set Ceramic Signer
   *
   * @param signer - Ceramic signer
   */
  signer: CeramicSigner

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
   * Throws an error if we have consistently failed to contact the CAS for any requests for an
   * extended period of time.  This most likely points to either a networking failure or a
   * misconfiguration of the Ceramic node, though it could also indicate that the anchor service
   * itself is down for some reason.
   */
  assertCASAccessible(): void

  /**
   * Create an anchor request on CAS through `fetch`.
   */
  create(carFileReader: AnchorRequestCarFileReader): Promise<AnchorEvent>

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
