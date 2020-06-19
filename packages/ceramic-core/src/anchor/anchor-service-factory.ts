import MockAnchorService from "./mock/mock-anchor-service";
import EthereumAnchorService from "./ethereum/ethereum-anchor-service";
import Dispatcher from "../dispatcher";
import type { CeramicConfig } from "../ceramic";
import AnchorService from "ceramic-common/lib/anchor-service"

/**
 * AnchorService factory class
 */
export class AnchorServiceFactory {
    private readonly mockAnchorService: MockAnchorService;
    private readonly ethereumAnchorService: EthereumAnchorService;

    constructor(_dispatcher: Dispatcher, private _config?: CeramicConfig) {
        this.ethereumAnchorService = new EthereumAnchorService(_config);
        this.mockAnchorService = new MockAnchorService(_dispatcher, _config);
    }

    /**
     * Get AnchorService instance by type
     */
    public get(): AnchorService {
        if (this._config.anchorServiceUrl) {
            // defaults to Ethereum based anchor service
            return this.ethereumAnchorService;
        }
        return this.mockAnchorService;
    }

}
