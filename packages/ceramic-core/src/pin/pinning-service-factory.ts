import * as Ipfs from "ipfs"

import { CeramicConfig } from "../ceramic"

import PinningService from "./pinning-service"
import MockPinningService from "./mock/mock-pinning-service"
import LevelPinningService from "./level/level-pinning-service"

/**
 * PinningService factory class
 */
export default class PinningServiceFactory {
    private readonly mockPinningService: MockPinningService
    private readonly levelPinningService: LevelPinningService

    constructor(ipfs: Ipfs.Ipfs, ceramicConfig: CeramicConfig) {
        this.mockPinningService = new MockPinningService()

        if (ceramicConfig.pinningStorePath) {
            this.levelPinningService = new LevelPinningService(ipfs, ceramicConfig.pinningStorePath)
        }
    }

    /**
     * Get AnchorService instance by type
     */
    public get(): PinningService {
        if (this.levelPinningService != null) {
            return this.levelPinningService
        }
        return this.mockPinningService
    }

}