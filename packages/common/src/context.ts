import type { Resolver } from "did-resolver"
import { CeramicApi, DIDProvider } from "./ceramic-api"

import { DID } from 'dids'
import type { AnchorService } from "./anchor-service"
import { IpfsApi, LoggerProvider } from "./index"

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
