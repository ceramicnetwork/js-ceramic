import { Resolver } from "did-resolver"
import { CeramicApi, DIDProvider } from "./ceramic-api"

import { DID } from 'dids'
import type { AnchorService } from "./anchor-service"
import { IPFSApi } from "./declarations"

/**
 * Encapsulates Ceramic context
 */
export interface Context {
    did?: DID;
    ipfs?: IPFSApi; // an ipfs instance
    resolver?: Resolver; // a DID resolver instance
    provider?: DIDProvider; // a DID provider (3ID provider initially)
    anchorService?: AnchorService;

    api?: CeramicApi; // the self reference to the Ceramic API
}
