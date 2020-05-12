import { DocState } from "../../document"
import PinningService from "../pinning-service"

export default class MockPinningService implements PinningService {
    /**
     * Open pinning service
     */
    async open(): Promise<void> {
        return
    }

    /**
     * Pin document
     */
    async pin(): Promise<void> {
        return
    }

    /**
     * Load document
     */
    async loadState(): Promise<DocState> {
        return null
    }

    /**
     * Is document pinned locally?
     */
    async isDocPinned(): Promise<boolean> {
        return false
    }

    /**
     * Unpin document
     */
    async rm(): Promise<void> {
        return
    }

    /**
     * List pinned document
     */
    async ls(): Promise<string[]> {
        return []
    }

    /**
     * Close pinning service
     */
    async close(): Promise<void> {
        return
    }
}