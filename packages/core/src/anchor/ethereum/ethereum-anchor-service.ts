import CID from "cids"
import fetch from "cross-fetch"

import { decode } from "typestub-multihashes"
import * as providers from "@ethersproject/providers"
import { CeramicConfig } from "../../ceramic"

import AnchorServiceResponse from "../anchor-service-response"
import { AnchorService, AnchorStatus } from "@ceramicnetwork/common"
import { AnchorProof, CeramicApi } from "@ceramicnetwork/common"

/**
 * CID-docId pair
 */
interface CidDoc {
    readonly cid: CID
    readonly docId: string
}

const DEFAULT_POLL_TIME = 60000 // 60 seconds
const DEFAULT_MAX_POLL_TIME = 7200000 // 2 hours

const MAX_NUMBER_OF_EVENT_LISTENERS = 100 // soft limit for maximum number of listeners ~ concurrent anchoring requests

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
export default class EthereumAnchorService extends AnchorService {

    private _ceramic: CeramicApi
    private readonly cidToResMap: Map<CidDoc, AnchorServiceResponse>
    private readonly requestsApiEndpoint: string
    private readonly chainIdApiEndpoint: string
    private _supportedChains: string[]

    /**
     * @param _config - service configuration (polling interval, etc.)
     */
    constructor(private _config: CeramicConfig) {
        super()

        this.cidToResMap = new Map<CidDoc, AnchorServiceResponse>()
        this.requestsApiEndpoint = this._config.anchorServiceUrl + '/api/v0/requests'
        this.chainIdApiEndpoint = this._config.anchorServiceUrl + '/api/v0/service-info/supported_chains'

        this.setMaxListeners(MAX_NUMBER_OF_EVENT_LISTENERS)
    }

    /**
     * Set Ceramic API instance
     *
     * @param ceramic - Ceramic API used for various purposes
     */
    set ceramic(ceramic: CeramicApi) {
        this._ceramic = ceramic
    }

    async init(): Promise<void> {
        // Get the chainIds supported by our anchor service
        const response = await fetch(this.chainIdApiEndpoint)
        const json = await response.json()
        this._supportedChains = json.supportedChains
        if (this._supportedChains.length > 1) {
            throw new Error("Anchor service returned multiple supported chains, which isn't supported yet")
        }

        // Confirm that we have an eth provider that works for each of the chains that the anchor service supports
        for (const chain of this._supportedChains) {
            const provider = this._getEthProvider(chain)
            const provider_chain_idnum = (await provider.getNetwork()).chainId
            const provider_chain = BASE_CHAIN_ID + ':' + provider_chain_idnum
            if (chain != provider_chain) {
                throw new Error(`Configured eth provider is for chainId ${provider_chain}, but our anchor service uses chain ${chain}`)
            }
        }
    }

    /**
     * Requests anchoring service for current tip of the document
     * @param docId - Document ID
     * @param tip - Tip CID of the document
     */
    async requestAnchor(docId: string, tip: CID): Promise<void> {
        const cidDocPair: CidDoc = { cid: tip, docId }

        // send initial request
        await this._sendReq(cidDocPair)
        this._poll(cidDocPair) // start polling
    }

    /**
     * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
     * anchor service.
     */
    async getSupportedChains(): Promise<Array<string>> {
        return this._supportedChains
    }

    /**
     * Send requests to an external Ceramic Anchor Service
     * @param cidDocPair - mapping
     * @private
     */
    async _sendReq(cidDocPair: CidDoc): Promise<void> {
        const response = await fetch(this.requestsApiEndpoint, {
            method: "POST", body: JSON.stringify({
                docId: cidDocPair.docId, cid: cidDocPair.cid.toString()
            }), headers: {
                "Content-Type": "application/json"
            }
        })

        if (!response.ok) {
            this.emit(cidDocPair.docId, {
                status: 'FAILED',
                message: `Failed to send request. Status ${response.statusText}`
            })
            return
        }
        const json = await response.json()

        const res = { status: json.status, message: json.message, anchorScheduledFor: json.scheduledAt }
        this.cidToResMap.set(cidDocPair, res)
        this.emit(cidDocPair.docId, res)
    }

    /**
     * Start polling for CidDocPair mapping
     * @param cidDoc - CID to Doc mapping
     * @param pollTime - Single poll timeout
     * @param maxPollingTime - Global timeout for max polling in milliseconds
     * @private
     */
    async _poll(cidDoc: CidDoc, pollTime?: number, maxPollingTime?: number): Promise<void> {
        const started = new Date().getTime()
        const maxTime = started + (maxPollingTime | DEFAULT_MAX_POLL_TIME)

        let poll = true
        while (poll) {
            if (started > maxTime) {
                const failedRes = { status: 'FAILED', message: 'exceeded max timeout' }
                this.cidToResMap.set(cidDoc, failedRes)

                this.emit(cidDoc.docId, failedRes)
                return // exit loop
            }

            await new Promise(resolve => setTimeout(resolve, DEFAULT_POLL_TIME))

            try {
                const requestUrl = [this.requestsApiEndpoint, cidDoc.cid.toString()].join('/')
                const response = await fetch(requestUrl)

                if (response.status === HTTP_STATUS_NOT_FOUND) {
                    // the anchor request does not exist, fail and stop polling
                    // TODO
                    this.emit(cidDoc.docId, {
                        status: AnchorStatus[AnchorStatus.FAILED], message: 'Request not found.'
                    })
                    poll = false
                    break
                }

                const json = await response.json()
                switch (json.status) {
                    case "PENDING": {
                        // just log
                        break
                    }
                    case "PROCESSING": {
                        this.emit(cidDoc.docId, { status: json.status, message: json.message })
                        break
                    }
                    case "FAILED": {
                        this.emit(cidDoc.docId, { status: json.status, message: json.message })
                        poll = false
                        break
                    }
                    case "COMPLETED": {
                        const { anchorRecord } = json
                        const anchorRecordCid = new CID(anchorRecord.cid.toString())

                        this.emit(cidDoc.docId, {
                            status: json.status, message: json.message, anchorRecord: anchorRecordCid
                        })
                        poll = false
                        break
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
        const decoded = decode(Buffer.from(anchorProof.txHash.multihash))
        const txHash = decoded.digest.toString("hex")

        // determine network based on a chain ID
        const provider: providers.BaseProvider = this._getEthProvider(anchorProof.chainId)

        const transaction = await provider.getTransaction('0x' + txHash)
        const block = await provider.getBlock(transaction.blockHash)

        const txValueHexNumber = parseInt(transaction.data, 16)
        const rootValueHexNumber = parseInt('0x' + anchorProof.root.toBaseEncodedString('base16'), 16)

        if (txValueHexNumber !== rootValueHexNumber) {
            throw new Error(`The root CID ${anchorProof.root.toString()} is not in the transaction`)
        }

        if (anchorProof.blockNumber !== transaction.blockNumber) {
            throw new Error(`Block numbers are not the same`)
        }

        if (anchorProof.blockTimestamp !== block.timestamp) {
            throw new Error(`Block timestamps are not the same`)
        }
    }

    /**
     * Gets Ethereum provider based on chain ID
     * @param chain - CAIP-2 Chain ID
     * @private
     */
    private _getEthProvider(chain: string): providers.BaseProvider {
        if (!chain.startsWith('eip155')) {
            throw new Error('Invalid chain ID according to CAIP-2')
        }

        if (!this._supportedChains.includes(chain)) {
            throw new Error(`Unsupported chainId ${chain}`)
        }

        if (this._config.ethereumRpcUrl) {
            return new providers.JsonRpcProvider(this._config.ethereumRpcUrl)
        }

        const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS[chain]
        if (ethNetwork == null) {
            throw new Error(`No ethereum provider available for chainId ${chain}`)
        }

        return providers.getDefaultProvider(ethNetwork.network)
    }

}
