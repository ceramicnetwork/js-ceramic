import CID from "cids";

import {EventEmitter} from "events";
import {AnchorProof} from "../../document";
import AnchorService from "../anchor-service";

import {ethers} from "ethers";
import { BaseProvider } from 'ethers/providers';
import {decode} from "typestub-multihashes";
import AnchorServiceResponse from "../anchor-service-response";

/**
 * Describes response from the external Ceramic Anchor Service
 */
class ResponseDto {
    status: string;
    message: string;
    scheduledFor?: number;
    anchorRecord?: {
        cid: CID | string;
    };
}

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
class CidDoc {
    constructor(public cid: CID, public docId: string) {
    }
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
 * Default development config for Ganache
 */
const DEFAULT_DEV_GANACHE_CONFIG = {
    rpc: {
        host: "http://localhost",
        port: "8545",
    },
};

/**
 * Default partial development service policy for Ganache
 */
const DEFAULT_DEV_GANACHE_SERVICE_POLICY_CONTENT = {
    doctype: "tile",
    owners: [] as string[],
    content: {
        serviceEndpoint: "http://localhost:3000/api/v0/requests",
        serviceFunctions: [] as any[]
    }
};

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export default class EthereumAnchorService extends EventEmitter implements AnchorService {

    private readonly _servicePolicy: any;
    private readonly cidToResMap: Map<CidDoc, AnchorServiceResponse>;

    /**
     * @param _servicePolicy - service configuration (polling interval, etc.)
     */
    constructor(_servicePolicy?: any) {
        super();

        this._servicePolicy = _servicePolicy ? _servicePolicy : DEFAULT_DEV_GANACHE_SERVICE_POLICY_CONTENT;
        this.cidToResMap = new Map<CidDoc, AnchorServiceResponse>();
    }

    /**
     * Requests anchoring service for current head of the document
     * @param docId - Document ID
     * @param head - Head CID of the document
     */
    async requestAnchor(docId: string, head: CID): Promise<void> {
        const cidDocPair: CidDoc = new CidDoc(head, docId);

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
        const response = await fetch(this._servicePolicy.content.serviceEndpoint, {
            method: "POST",
            body: JSON.stringify({
                docId: cidDocPair.docId,
                cid: cidDocPair.cid.toString()
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        const json = await response.json();
        const res = Object.assign(new ResponseDto(), JSON.parse(json));

        this.cidToResMap.set(cidDocPair, new AnchorServiceResponse(res.status, res.message, res.scheduledFor));
        this.emit(cidDocPair.docId,);
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
                const failedRes = new AnchorServiceResponse('FAILED', 'exceeded max timeout');
                this.cidToResMap.set(cidDocPair, failedRes);

                this.emit(cidDocPair.docId, failedRes);
                this.removeAllListeners(cidDocPair.docId);
                return;
            }
            try {
                const requestUrl = [this._servicePolicy.content.serviceEndpoint, cidDocPair.cid.toString()].join('/');
                const response = await fetch(requestUrl);
                const json = await response.json();

                const res: ResponseDto = Object.assign(new ResponseDto(), json);
                switch (res.status) {
                    case "PENDING": {
                        // just log
                        break;
                    }
                    case "PROCESSING": {
                        // just log
                        break;
                    }
                    case "FAILED": {
                        this.emit(cidDocPair.docId, new AnchorServiceResponse(res.status, res.message));
                        this.removeAllListeners(cidDocPair.docId);
                        return;
                    }
                    case "COMPLETED": {
                        const {anchorRecord} = res;
                        const anchorRecordCid = new CID(anchorRecord.cid.toString());
                        const anchorServiceResponse = new AnchorServiceResponse(res.status, res.message, null, anchorRecordCid);

                        this.emit(cidDocPair.docId, anchorServiceResponse);
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
     * @param proof - Anchor proof instance
     */
    async validateChainInclusion(proof: AnchorProof): Promise<void> {
        const decoded = decode(proof.txHash.multihash);
        const txHash = decoded.digest.toString("hex");

        // determine network based on a chain ID
        const provider: BaseProvider = EthereumAnchorService._getEthProvider(proof.chain);

        const transaction = await provider.getTransaction('0x' + txHash);
        const block = await provider.getBlock(transaction.blockHash);

        if (proof.root.toString() !== transaction.data) {
            throw new Error(`The root CID ${proof.root.toString()} is not in the transaction`);
        }

        if (proof.blockNumber != transaction.blockNumber) {
            throw new Error(`Block numbers are not the same`);
        }

        if (proof.blockTimestamp != block.timestamp) {
            throw new Error(`Block timestamps are not the same`);
        }
    }

    /**
     * Gets Ethereum provider based on chain ID
     * @param chain - CAIP-2 Chain ID
     * @private
     */
    private static _getEthProvider(chain: string): BaseProvider {
        if (!chain.startsWith('eip155')) {
            throw new Error('Invalid chain ID according to CAIP-2');
        }

        const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS.get(chain);
        if (ethNetwork == null) {
            // return default dev ganache provider
            const url = `${DEFAULT_DEV_GANACHE_CONFIG.rpc.host}:${DEFAULT_DEV_GANACHE_CONFIG.rpc.port}`;
            return new ethers.providers.JsonRpcProvider(url);
        }

        return ethers.getDefaultProvider(ethNetwork._network);
    }

}