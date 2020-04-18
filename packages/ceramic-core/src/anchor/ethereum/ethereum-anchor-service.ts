import CID from "cids";
import { ethers } from "ethers";
import fetch from "node-fetch";

import { EventEmitter } from "events";
import { AnchorProof } from "../../document";

import { BaseProvider } from 'ethers/providers';
import { decode } from "typestub-multihashes";
import { CeramicConfig } from "../../ceramic";

import AnchorService from "../anchor-service";
import AnchorServiceResponse from "../anchor-service-response";


/**
 * Simple poller implementation
 */
class Poller extends EventEmitter {
    /**
     * @param {int} timeout how long should we wait after the poll started?
     */
    constructor(private timeout = 100) {
        super();
    }

    /**
     * Poll function which uses setTimeout instead of setInterval
     */
    poll(): void {
        setTimeout(() => this.emit("poll"), this.timeout);
    }

    /**
     * On poll listener
     * @param cb - Callback function
     */
    async onPoll(cb: any): Promise<void> {
        this.on("poll", cb);
    }
}

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
class EthNetwork {
    constructor(public _network: string, public _chain: string, public _networkId: number, public _type: string) {
    }
}

/**
 * Maps Ethereum chain IDs to network configuration
 */
const ETH_CHAIN_ID_MAPPINGS: Map<string, EthNetwork> = new Map([
    ["eip155:1", new EthNetwork("mainnet", "ETH", 1, "Production")],
    ["eip155:3", new EthNetwork("ropsten", "ETH", 3, "Test")],
    ["eip155:4", new EthNetwork("rinkeby", "ETH", 4, "Test")],
    ["eip155:5", new EthNetwork("goerli", "ETH", 5, "Test")],
    ["eip155:2018", new EthNetwork("dev", "ETH", 2018, "Development")],
    ["eip155:61", new EthNetwork("classic", "ETH", 1, "Production")],
    ["eip155:63", new EthNetwork("mordor", "ETH", 7, "Test")],
    ["eip155:6", new EthNetwork("kotti", "ETH", 6, "Test")],
]);


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

        // start polling
        await this._poll(cidDocPair);
    }

    /**
     * Send requests to an external Ceramic Anchor Service
     * @param cidDocPair - mapping
     * @private
     */
    async _sendReq(cidDocPair: CidDoc): Promise<void> {
        const response = await fetch(this._config.anchorServiceUrl, {
            method: "POST", body: JSON.stringify({
                docId: cidDocPair.docId, cid: cidDocPair.cid.toString()
            }), headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            // bad request
            // just log
            return;
        }
        const json = await response.json();

        const res = { status: json.status, message: json.message, anchorScheduledFor: json.scheduledFor };
        this.cidToResMap.set(cidDocPair, res);
        this.emit(cidDocPair.docId, res);
    }

    /**
     * Start polling for CidDocPair mapping
     * @param cidDocPair - CID to Doc mapping
     * @param pollTime - Single poll timeout
     * @param maxPollingTime - Global timeout for max polling in milliseconds
     * @private
     */
    async _poll(cidDocPair: CidDoc, pollTime?: number, maxPollingTime?: number): Promise<void> {
        const poller = new Poller(pollTime | DEFAULT_POLL_TIME);

        const started = new Date().getTime();
        const maxTime = started + (maxPollingTime | DEFAULT_MAX_POLL_TIME);

        const task: Function = async (): Promise<void> => {
            if (started > maxTime) {
                const failedRes = { status: 'FAILED', message: 'exceeded max timeout' };
                this.cidToResMap.set(cidDocPair, failedRes);

                this.emit(cidDocPair.docId, failedRes);
                this.removeAllListeners(cidDocPair.docId);
                return;
            }
            try {
                const requestUrl = [this._config.anchorServiceUrl, cidDocPair.cid.toString()].join('/');
                const response = await fetch(requestUrl);
                if (!response.ok) {
                    // just log
                    poller.poll(); // continue to poll
                }
                const json = await response.json();

                switch (json.status) {
                    case "PENDING": {
                        // just log
                        break;
                    }
                    case "PROCESSING": {
                        // just log
                        break;
                    }
                    case "FAILED": {
                        this.emit(cidDocPair.docId, { status: json.status, message: json.message });
                        this.removeAllListeners(cidDocPair.docId);
                        return;
                    }
                    case "COMPLETED": {
                        const { anchorRecord } = json;
                        const anchorRecordCid = new CID(anchorRecord.cid.toString());

                        this.emit(cidDocPair.docId, {
                            status: json.status,
                            message: json.message,
                            anchorRecord: anchorRecordCid
                        });
                        this.removeAllListeners(cidDocPair.docId);
                        return;
                    }
                }

                poller.poll(); // continue to poll
            } catch (e) {
                // just log an error
                poller.poll(); // continue to poll
            }
        };

        await poller.onPoll(task);
        poller.poll(); // start polling
    }

    /**
     * Validate anchor proof on the chain
     * @param anchorProof - Anchor proof instance
     */
    async validateChainInclusion(anchorProof: AnchorProof): Promise<void> {
        const decoded = decode(anchorProof.txHash.multihash);
        const txHash = decoded.digest.toString("hex");

        // determine network based on a chain ID
        const provider: BaseProvider = this._getEthProvider(anchorProof.chainId);

        const transaction = await provider.getTransaction('0x' + txHash);
        const block = await provider.getBlock(transaction.blockHash);

        const txValueHexNumber = parseInt(transaction.data, 16);
        const rootValueHexNumber = parseInt('0x' + anchorProof.root.toBaseEncodedString('base16'), 16);

        if (txValueHexNumber !== rootValueHexNumber) {
            throw new Error(`The root CID ${anchorProof.root.toString()} is not in the transaction`);
        }

        if (anchorProof.blockNumber != transaction.blockNumber) {
            throw new Error(`Block numbers are not the same`);
        }

        if (anchorProof.blockTimestamp != block.timestamp) {
            throw new Error(`Block timestamps are not the same`);
        }
    }

    /**
     * Gets Ethereum provider based on chain ID
     * @param chain - CAIP-2 Chain ID
     * @private
     */
    private _getEthProvider(chain: string): BaseProvider {
        if (!chain.startsWith('eip155')) {
            throw new Error('Invalid chain ID according to CAIP-2');
        }

        const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS.get(chain);
        if (ethNetwork == null) {
            // defaults to configuration Ethereum RPC URL
            return new ethers.providers.JsonRpcProvider(this._config.ethereumRpcUrl);
        }

        return ethers.getDefaultProvider(ethNetwork._network);
    }

}