import { Resolver } from "did-resolver"
import { CeramicApi, DIDProvider } from "./ceramic-api"

import { DID } from 'dids'
import type { AnchorService } from "./anchor-service"
import { IpfsApi } from "./index"

/**
 * Encapsulates Ceramic context
 */
export interface Context {
    did?: DID;
    ipfs?: IpfsApi; // an ipfs instance
    resolver?: Resolver; // a DID resolver instance
    provider?: DIDProvider; // a DID provider (3ID provider initially)
    anchorServices?: Record<string, Array<AnchorService>>; // mapping from chainId(s) to the AnchorService instance(s)
    chainInfo?: ChainInfo; // chain IDs information

    api?: CeramicApi; // the self reference to the Ceramic API
}

/**
 * Chain IDs information
 */
export interface ChainInfo {
    preferredChain?: string
    supportedChains?: Array<string>
}
