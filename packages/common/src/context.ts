import type { CeramicApi } from "./ceramic-api"
import type { DID } from 'dids'
import type { AnchorService } from "./anchor-service"
import type { IpfsApi, LoggerProvider } from "./index"

/**
 * Encapsulates Ceramic context
 */
export interface Context {
    did?: DID;
    ipfs?: IpfsApi; // an ipfs instance
    anchorService?: AnchorService;
    loggerProvider?: LoggerProvider;

    api?: CeramicApi; // the self reference to the Ceramic API
}
