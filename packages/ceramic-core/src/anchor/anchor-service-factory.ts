import MockAnchorService from "./mock/mock-anchor-service";
import EthereumAnchorService from "./ethereum/ethereum-anchor-service";
import Dispatcher from "../dispatcher";
import AnchorService from "./anchor-service";

/**
 * AnchorService factory class
 */
export class AnchorServiceFactory {
    private readonly mockAnchorService: MockAnchorService;
    private readonly ethereumAnchorService: EthereumAnchorService;

    constructor(_dispatcher: Dispatcher, private _servicePolicy?: any) {
        this.ethereumAnchorService = new EthereumAnchorService(_servicePolicy);
        this.mockAnchorService = new MockAnchorService(_dispatcher, _servicePolicy);
    }

    /**
     * Get AnchorService instance by type
     */
    public get(): AnchorService {
        // determine the anchor service based on _servicePolicy
        if (this._servicePolicy) {
            return this.ethereumAnchorService;
        }
        return this.mockAnchorService;
    }

}