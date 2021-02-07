import { Resolver } from "did-resolver"
import { CeramicApi, DIDProvider } from "./ceramic-api"

import { DID } from 'dids'
import type { AnchorService } from "./anchor-service"
import { IpfsApi } from "./index"
import { DiagnosticsLogger } from "@ceramicnetwork/logger";

/**
 * Encapsulates Ceramic context
 */
export interface Context {
    did?: DID;
    ipfs?: IpfsApi; // an ipfs instance
    resolver?: Resolver; // a DID resolver instance
    provider?: DIDProvider; // a DID provider (3ID provider initially)
    anchorService?: AnchorService;
    logger?: DiagnosticsLogger,

    api?: CeramicApi; // the self reference to the Ceramic API
}
