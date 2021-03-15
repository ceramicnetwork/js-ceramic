import CID from "cids"
import fetch from "cross-fetch"
import * as uint8arrays from 'uint8arrays'
import { decode } from "multihashes"
import * as providers from "@ethersproject/providers"
import { CeramicConfig } from "../../ceramic"
import {
  AnchorProof,
  CeramicApi,
  AnchorServiceResponse,
  AnchorService,
  AnchorStatus,
} from "@ceramicnetwork/common";
import DocID from "@ceramicnetwork/docid";
import { Observable, interval, from, concat, of } from "rxjs";
import { concatMap, catchError } from "rxjs/operators";
import {Block, TransactionResponse } from "@ethersproject/providers"

/**
 * CID-docId pair
 */
interface CidDoc {
    readonly cid: CID
    readonly docId: DocID
}

const DEFAULT_POLL_TIME = 60000 // 60 seconds
const DEFAULT_MAX_POLL_TIME = 7200000 // 2 hours

const HTTP_STATUS_NOT_FOUND = 404

/**
 * Ethereum network configuration
 */
interface EthNetwork {
    network: string
    chain: string
    chainId: number
    networkId: number
    type: string
}

/**
 * Maps some of Ethereum chain IDs to network configuration
 */
const ETH_CHAIN_ID_MAPPINGS: Record<string, EthNetwork> = {
    "eip155:1": { network: "mainnet", chain: "ETH", chainId: 1, networkId: 1, type: "Production" },
    "eip155:3": { network: "ropsten", chain: "ETH", chainId: 3, networkId: 3, type: "Test" },
}

const BASE_CHAIN_ID = "eip155"

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export default class EthereumAnchorService implements AnchorService {
  private readonly requestsApiEndpoint: string;
  private readonly chainIdApiEndpoint: string;
  private _chainId: string;

  /**
   * @param anchorServiceUrl
   * @param ethereumRpcEndpoint
   */
  constructor(readonly anchorServiceUrl: string, readonly ethereumRpcEndpoint: string) {
    this.requestsApiEndpoint = this.anchorServiceUrl + "/api/v0/requests";
    this.chainIdApiEndpoint =
      this.anchorServiceUrl + "/api/v0/service-info/supported_chains";
  }

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  set ceramic(ceramic: CeramicApi) {
    // Do Nothing
  }

  get url() {
    return this.anchorServiceUrl
  }

    async init(): Promise<void> {
        // Get the chainIds supported by our anchor service
        const response = await fetch(this.chainIdApiEndpoint)
        const json = await response.json()
        if (json.supportedChains.length > 1) {
            throw new Error("Anchor service returned multiple supported chains, which isn't supported by js-ceramic yet")
        }
        this._chainId = json.supportedChains[0]

        // Confirm that we have an eth provider that works for the same chain that the anchor service supports
        const provider = this._getEthProvider(this._chainId)
        const provider_chain_idnum = (await provider.getNetwork()).chainId
        const provider_chain = BASE_CHAIN_ID + ':' + provider_chain_idnum
        if (this._chainId != provider_chain) {
            throw new Error(`Configured eth provider is for chainId ${provider_chain}, but our anchor service uses chain ${this._chainId}`)
        }
    }

  /**
   * Requests anchoring service for current tip of the document
   * @param docId - Document ID
   * @param tip - Tip CID of the document
   */
  requestAnchor(docId: DocID, tip: CID): Observable<AnchorServiceResponse> {
    const cidDocPair: CidDoc = { cid: tip, docId };
    return concat(
      this._announcePending(cidDocPair),
      this._makeRequest(cidDocPair),
      this._poll(cidDocPair)
    ).pipe(
      catchError((error) =>
        of<AnchorServiceResponse>({
          status: AnchorStatus.FAILED,
          docId: docId,
          cid: tip,
          message: error.message,
        })
      )
    );
  }

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  async getSupportedChains(): Promise<Array<string>> {
    return [this._chainId];
  }

  private _announcePending(cidDoc: CidDoc): Observable<AnchorServiceResponse> {
    return of({
      status: AnchorStatus.PENDING,
      docId: cidDoc.docId,
      cid: cidDoc.cid,
      message: "Sending anchoring request",
      anchorScheduledFor: null,
    });
  }

  /**
   * Send requests to an external Ceramic Anchor Service
   * @param cidDocPair - mapping
   * @private
   */
  private _makeRequest(cidDocPair: CidDoc): Observable<AnchorServiceResponse> {
    return from(
      fetch(this.requestsApiEndpoint, {
        method: "POST",
        body: JSON.stringify({
          docId: cidDocPair.docId.toString(),
          cid: cidDocPair.cid.toString(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).pipe(
      concatMap(async (response) => {
        if (response.ok) {
          const json = await response.json();
          return this.parseResponse(cidDocPair, json);
        } else {
          throw new Error(
            `Failed to send request. Status ${response.statusText}`
          );
        }
      })
    );
  }

  /**
   * Start polling for CidDocPair mapping
   * @param cidDoc - CID to Doc mapping
   * @param pollTime - Single poll timeout
   * @param maxPollingTime - Global timeout for max polling in milliseconds
   * @private
   */
  private _poll(
    cidDoc: CidDoc,
    pollTime?: number,
    maxPollingTime?: number
  ): Observable<AnchorServiceResponse> {
    const started = new Date().getTime();
    const maxTime = started + (maxPollingTime | DEFAULT_MAX_POLL_TIME);
    const requestUrl = [this.requestsApiEndpoint, cidDoc.cid.toString()].join(
      "/"
    );

    return interval(DEFAULT_POLL_TIME).pipe(
      concatMap(async () => {
        const now = new Date().getTime();
        if (now > maxTime) {
          throw new Error("Exceeded max timeout");
        } else {
          const response = await fetch(requestUrl);
          if (response.status === HTTP_STATUS_NOT_FOUND) {
            throw new Error("Request not found");
          } else {
            const json = await response.json();
            return this.parseResponse(cidDoc, json);
          }
        }
      })
    );
  }

  /**
   * Given a chainId and a transaction hash, loads information from ethereum about the transaction
   * and block the transaction was included in.
   * Testing has shown that when no ethereumRpcEndpoint has been provided and we are therefore using
   * the ethersproject's defaultProvider, we sometimes get back null for the transaction or block,
   * so this function also includes some extra error handling and throws exceptions with a warning
   * to use an actual ethereum rpc endpoint if the above behavior is seen.
   * @param chainId
   * @param txHash
   * @private
   */
  private async _getTransactionAndBlockInfo(chainId: string, txHash: string): Promise<[TransactionResponse, Block]> {
    // determine network based on a chain ID
    const provider: providers.BaseProvider = this._getEthProvider(chainId);
    const transaction = await provider.getTransaction(txHash);

    if (!transaction) {
      if (!this.ethereumRpcEndpoint) {
        throw new Error(`Failed to load transaction data for transaction ${txHash}. Try providing an ethereum rpc endpoint`)
      } else {
        throw new Error(`Failed to load transaction data for transaction ${txHash}`)
      }
    }
    const block = await provider.getBlock(transaction.blockHash);
    if (!block) {
      if (!this.ethereumRpcEndpoint) {
        throw new Error(`Failed to load transaction data for block with block number ${transaction.blockNumber} and block hash ${transaction.blockHash}. Try providing an ethereum rpc endpoint`)
      } else {
        throw new Error(`Failed to load transaction data for block with block number ${transaction.blockNumber} and block hash ${transaction.blockHash}`)
      }
    }
    return [transaction, block]
  }

  /**
   * Validate anchor proof on the chain
   * @param anchorProof - Anchor proof instance
   */
  async validateChainInclusion(anchorProof: AnchorProof): Promise<void> {
    const decoded = decode(anchorProof.txHash.multihash);
    const txHash = "0x" + uint8arrays.toString(decoded.digest, "base16");

    const [transaction, block] = await this._getTransactionAndBlockInfo(anchorProof.chainId, txHash)
    const txValueHexNumber = parseInt(transaction.data, 16);
    const rootValueHexNumber = parseInt(
      "0x" + anchorProof.root.toBaseEncodedString("base16"),
      16
    );

    if (txValueHexNumber !== rootValueHexNumber) {
      throw new Error(
        `The root CID ${anchorProof.root.toString()} is not in the transaction`
      );
    }

    if (anchorProof.blockNumber !== transaction.blockNumber) {
      throw new Error(`Block numbers are not the same`);
    }

    if (anchorProof.blockTimestamp !== block.timestamp) {
      throw new Error(`Block timestamps are not the same`);
    }
  }

  /**
   * Gets Ethereum provider based on chain ID
   * @param chain - CAIP-2 Chain ID
   * @private
   */
  private _getEthProvider(chain: string): providers.BaseProvider {
    if (!chain.startsWith("eip155")) {
      throw new Error(
        `Unsupported chainId '${chain}' - must be eip155 namespace`
      );
    }

    if (this._chainId != chain) {
      throw new Error(
        `Unsupported chainId '${chain}'. Configured anchor service only supports '${this._chainId}'`
      );
    }

    if (this.ethereumRpcEndpoint) {
      return new providers.JsonRpcProvider(this.ethereumRpcEndpoint);
    }

    const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS[chain];
    if (ethNetwork == null) {
      throw new Error(`No ethereum provider available for chainId ${chain}`);
    }

    return providers.getDefaultProvider(ethNetwork.network);
  }

  /**
   * Parse JSON that CAS returns.
   */
  private parseResponse(cidDoc: CidDoc, json: any): AnchorServiceResponse {
    switch (json.status) {
      case "PENDING":
        return {
          status: AnchorStatus.PENDING,
          docId: cidDoc.docId,
          cid: cidDoc.cid,
          message: json.message,
          anchorScheduledFor: json.scheduledAt,
        };
      case "PROCESSING":
        return {
          status: AnchorStatus.PROCESSING,
          docId: cidDoc.docId,
          cid: cidDoc.cid,
          message: json.message,
        };
      case "FAILED":
        throw new Error(json.message);
      case "COMPLETED": {
        const { anchorRecord } = json;
        const anchorRecordCid = new CID(anchorRecord.cid.toString());
        return {
          status: AnchorStatus.ANCHORED,
          docId: cidDoc.docId,
          cid: cidDoc.cid,
          message: json.message,
          anchorRecord: anchorRecordCid,
        };
      }
      default:
        throw new Error(`Unexpected status: ${json.status}`);
    }
  }
}
