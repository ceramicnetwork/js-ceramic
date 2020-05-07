import CID from "cids";
import fetch from "node-fetch";
import https from "https"

import { AnchorProof } from "../../document";

import { decode } from "typestub-multihashes";
import * as providers from "@ethersproject/providers"
import { CeramicConfig } from "../../ceramic";

import AnchorService from "../anchor-service";
import AnchorServiceResponse from "../anchor-service-response";

/**
 * CID-docId pair
 */
interface CidDoc {
    readonly cid: CID;
    readonly docId: string;
}

const DEFAULT_POLL_TIME = 5000; // 5 seconds
const DEFAULT_MAX_POLL_TIME = 7200000; // 2 hours

/**
 * Ethereum network configuration
 */
interface EthNetwork {
    network: string;
    chain: string;
    chainId: number;
    networkId: number;
    type: string;
}

/**
 * Maps some of Ethereum chain IDs to network configuration
 */
const ETH_CHAIN_ID_MAPPINGS: Record<string, EthNetwork> = {
    "eip155:1": { network: "mainnet", chain: "ETH", chainId: 1, networkId: 1, type: "Production" },
    "eip155:3": { network: "ropsten", chain: "ETH", chainId: 3, networkId: 3, type: "Test" },
};

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export default class EthereumAnchorService extends AnchorService {

    private readonly cidToResMap: Map<CidDoc, AnchorServiceResponse>;

    /**
     * @param _config - service configuration (polling interval, etc.)
     */
    constructor(private _config: CeramicConfig) {
        super();

        this.cidToResMap = new Map<CidDoc, AnchorServiceResponse>();
    }

    /**
     * Requests anchoring service for current head of the document
     * @param docId - Document ID
     * @param head - Head CID of the document
     */
    async requestAnchor(docId: string, head: CID): Promise<void> {
        const cidDocPair: CidDoc = { cid: head, docId };

        // send initial request
        await this._sendReq(cidDocPair);
        this._poll(cidDocPair); // start polling
    }

    /**
     * Send requests to an external Ceramic Anchor Service
     * @param cidDocPair - mapping
     * @private
     */
    async _sendReq(cidDocPair: CidDoc): Promise<void> {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });

        const response = await fetch(this._config.anchorServiceUrl, {
            method: "POST", body: JSON.stringify({
                docId: cidDocPair.docId, cid: cidDocPair.cid.toString()
            }), headers: {
                "Content-Type": "application/json"
            },
            agent: httpsAgent
        });

        if (!response.ok) {
            this.emit(cidDocPair.docId, {
                status: 'FAILED',
                message: `Failed to send request. Status ${response.statusText}`
            });
            return;
        }
        const json = await response.json();

        const res = { status: json.status, message: json.message, anchorScheduledFor: json.scheduledAt };
        this.cidToResMap.set(cidDocPair, res);
        this.emit(cidDocPair.docId, res);
    }

    /**
     * Start polling for CidDocPair mapping
     * @param cidDoc - CID to Doc mapping
     * @param pollTime - Single poll timeout
     * @param maxPollingTime - Global timeout for max polling in milliseconds
     * @private
     */
    async _poll(cidDoc: CidDoc, pollTime?: number, maxPollingTime?: number): Promise<void> {
        const started = new Date().getTime();
        const maxTime = started + (maxPollingTime | DEFAULT_MAX_POLL_TIME);

        let poll = true;
        while (poll) {
            if (started > maxTime) {
                const failedRes = { status: 'FAILED', message: 'exceeded max timeout' };
                this.cidToResMap.set(cidDoc, failedRes);

                this.emit(cidDoc.docId, failedRes);
                return; // exit loop
            }

            await new Promise(resolve => setTimeout(resolve, DEFAULT_POLL_TIME));

            try {
                const httpsAgent = new https.Agent({
                    rejectUnauthorized: false,
                });
                const requestUrl = [this._config.anchorServiceUrl, cidDoc.cid.toString()].join('/');
                const response = await fetch(requestUrl, {
                    agent: httpsAgent,
                });
                const json = await response.json();

                switch (json.status) {
                    case "PENDING": {
                        // just log
                        break;
                    }
                    case "PROCESSING": {
                        this.emit(cidDoc.docId, { status: json.status, message: json.message });
                        break;
                    }
                    case "FAILED": {
                        this.emit(cidDoc.docId, { status: json.status, message: json.message });
                        poll = false;
                        break;
                    }
                    case "COMPLETED": {
                        const { anchorRecord } = json;
                        const anchorRecordCid = new CID(anchorRecord.cid.toString());

                        this.emit(cidDoc.docId, {
                            status: json.status, message: json.message, anchorRecord: anchorRecordCid
                        });
                        poll = false;
                        break;
                    }
                }
            } catch (e) {
                // just log
            }
        }
    }

    /**
     * Validate anchor proof on the chain
     * @param anchorProof - Anchor proof instance
     */
    async validateChainInclusion(anchorProof: AnchorProof): Promise<void> {
        const decoded = decode(anchorProof.txHash.multihash);
        const txHash = decoded.digest.toString("hex");

        // determine network based on a chain ID
        const provider: providers.BaseProvider = this._getEthProvider(anchorProof.chainId);

        const transaction = await provider.getTransaction('0x' + txHash);
        const block = await provider.getBlock(transaction.blockHash);

        const txValueHexNumber = parseInt(transaction.data, 16);
        const rootValueHexNumber = parseInt('0x' + anchorProof.root.toBaseEncodedString('base16'), 16);

        if (txValueHexNumber !== rootValueHexNumber) {
            throw new Error(`The root CID ${anchorProof.root.toString()} is not in the transaction`);
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
        if (!chain.startsWith('eip155')) {
            throw new Error('Invalid chain ID according to CAIP-2');
        }

        const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS[chain];
        if (ethNetwork == null) {
            // defaults to configuration Ethereum RPC URL
            return new providers.JsonRpcProvider(this._config.ethereumRpcUrl);
        }

        return providers.getDefaultProvider(ethNetwork.network);
    }

}