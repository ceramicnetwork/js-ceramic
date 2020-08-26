import type { Ipfs } from "ipfs"
import { Resolver } from "did-resolver"
import { CeramicApi, DIDProvider } from "./ceramic-api"

import { DID } from 'dids'
import type { AnchorService } from "./anchor-service"

export interface Context {
    user?: DID;
    ipfs?: Ipfs; // an ipfs instance
    resolver?: Resolver; // a DID resolver instance
    provider?: DIDProvider; // a DID provider (3ID provider initially)
    anchorService?: AnchorService;

    api?: CeramicApi; // the self reference to the Ceramic API
}
