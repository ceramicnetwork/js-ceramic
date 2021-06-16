import CID from "cids"
import * as uint8arrays from 'uint8arrays'
import { decode } from "multihashes"
import * as providers from "@ethersproject/providers"
import { LRUMap } from 'lru_map';
import {
  AnchorProof,
  CeramicApi,
  AnchorServiceResponse,
  AnchorService,
  AnchorStatus,
  DiagnosticsLogger,
  fetchJson,
} from "@ceramicnetwork/common";
import StreamID from "@ceramicnetwork/streamid";
import { Observable, interval, from, concat, of } from "rxjs";
import { concatMap, catchError, map } from "rxjs/operators";
import {Block, TransactionResponse } from "@ethersproject/providers"

/**
 * CID-streamId pair
 */
interface CidAndStream {
    readonly cid: CID
    readonly streamId: StreamID
}

const POLL_INTERVAL = 60000 // 60 seconds
const MAX_POLL_TIME = 86400000 // 24 hours

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
const MAX_PROVIDERS_COUNT = 100

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export default class EthereumAnchorService implements AnchorService {
  private readonly requestsApiEndpoint: string;
  private readonly chainIdApiEndpoint: string;
  private _chainId: string;
  private readonly providersCache: LRUMap<string, providers.BaseProvider>
  private readonly _logger: DiagnosticsLogger

  /**
   * @param anchorServiceUrl
   * @param ethereumRpcEndpoint
   */
  constructor(readonly anchorServiceUrl: string, readonly ethereumRpcEndpoint: string, logger: DiagnosticsLogger) {
    this.requestsApiEndpoint = this.anchorServiceUrl + "/api/v0/requests";
    this.chainIdApiEndpoint =
      this.anchorServiceUrl + "/api/v0/service-info/supported_chains";
    this.providersCache = new LRUMap(MAX_PROVIDERS_COUNT)
    this._logger = logger
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
    const response = await fetchJson(this.chainIdApiEndpoint)
    if (response.supportedChains.length > 1) {
        throw new Error("Anchor service returned multiple supported chains, which isn't supported by js-ceramic yet")
    }
    this._chainId = response.supportedChains[0]

    // Confirm that we have an eth provider that works for the same chain that the anchor service supports
    const provider = this._getEthProvider(this._chainId)
    const provider_chain_idnum = (await provider.getNetwork()).chainId
    const provider_chain = BASE_CHAIN_ID + ':' + provider_chain_idnum
    if (this._chainId != provider_chain) {
        throw new Error(`Configured eth provider is for chainId ${provider_chain}, but our anchor service uses chain ${this._chainId}`)
    }
  }

  /**
   * Requests anchoring service for current tip of the stream
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  requestAnchor(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse> {
    const cidStreamPair: CidAndStream = { cid: tip, streamId };
    return concat(
      this._announcePending(cidStreamPair),
      this._makeRequest(cidStreamPair),
      this.pollForAnchorResponse(streamId, tip)
    ).pipe(
      catchError((error) =>
        of<AnchorServiceResponse>({
          status: AnchorStatus.FAILED,
          streamId: streamId,
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

  private _announcePending(cidStream: CidAndStream): Observable<AnchorServiceResponse> {
    return of({
      status: AnchorStatus.PENDING,
      streamId: cidStream.streamId,
      cid: cidStream.cid,
      message: "Sending anchoring request",
      anchorScheduledFor: null,
    });
  }

  /**
   * Send requests to an external Ceramic Anchor Service
   * @param cidStreamPair - mapping
   * @private
   */
  private _makeRequest(cidStreamPair: CidAndStream): Observable<AnchorServiceResponse> {
    return from(
      fetchJson(this.requestsApiEndpoint, {
        method: "POST",
        body: {
          streamId: cidStreamPair.streamId.toString(),
          docId: cidStreamPair.streamId.toString(),
          cid: cidStreamPair.cid.toString(),
        },
      })
    ).pipe(
      map((response) => {
        return this.parseResponse(cidStreamPair, response)
      })
    );
  }

  /**
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse> {
    const started = new Date().getTime();
    const maxTime = started + MAX_POLL_TIME;
    const requestUrl = [this.requestsApiEndpoint, tip.toString()].join(
      "/"
    );
    const cidStream = { cid: tip, streamId }

    return interval(POLL_INTERVAL).pipe(
      concatMap(async () => {
        const now = new Date().getTime();
        if (now > maxTime) {
          throw new Error("Exceeded max timeout");
        } else {
          const response = await fetchJson(requestUrl);
          return this.parseResponse(cidStream, response)
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
    try {
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
    } catch (e) {
      this._logger.err(`Error loading transaction info for transaction ${txHash} from Ethereum: ${e}`)
      throw e
    }
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
      throw new Error(`Block numbers are not the same. AnchorProof blockNumber: ${anchorProof.blockNumber}, eth txn blockNumber: ${transaction.blockNumber}`);
    }

    if (anchorProof.blockTimestamp !== block.timestamp) {
      throw new Error(`Block timestamps are not the same. AnchorProof blockTimestamp: ${anchorProof.blockTimestamp}, eth txn blockTimestamp: ${block.timestamp}`);
    }
  }

  /**
   * Gets Ethereum provider based on chain ID
   * @param chain - CAIP-2 Chain ID
   * @private
   */
  private _getEthProvider(chain: string): providers.BaseProvider {
    const fromCache = this.providersCache.get(chain);
    if (fromCache) return fromCache;

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
      const provider = new providers.JsonRpcProvider(this.ethereumRpcEndpoint);
      this.providersCache.set(chain, provider);
      return provider;
    }

    const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS[chain];
    if (ethNetwork == null) {
      throw new Error(`No ethereum provider available for chainId ${chain}`);
    }

    const provider = providers.getDefaultProvider(ethNetwork.network);
    this.providersCache.set(chain, provider);
    return provider;
  }

  /**
   * Parse JSON that CAS returns.
   */
  private parseResponse(cidStream: CidAndStream, json: any): AnchorServiceResponse {
    if (json.error) {
      return {
        status: AnchorStatus.FAILED,
        streamId: cidStream.streamId,
        cid: cidStream.cid,
        message: json.error,
      };
    }

    switch (json.status) {
      case "PENDING":
        return {
          status: AnchorStatus.PENDING,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
          anchorScheduledFor: json.scheduledAt,
        };
      case "PROCESSING":
        return {
          status: AnchorStatus.PROCESSING,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
        };
      case "FAILED":
        return {
          status: AnchorStatus.FAILED,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
        };
      case "COMPLETED": {
        const { anchorRecord } = json;
        const anchorRecordCid = new CID(anchorRecord.cid.toString());
        return {
          status: AnchorStatus.ANCHORED,
          streamId: cidStream.streamId,
          cid: cidStream.cid,
          message: json.message,
          anchorRecord: anchorRecordCid,
        };
      }
      default:
        throw new Error(`Unexpected status: ${json.status}`);
    }
  }
}
