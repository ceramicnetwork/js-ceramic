import type { Ipfs } from "ipfs"
import { Resolver } from "did-resolver"
import { CeramicApi, DIDProvider } from "./ceramic-api"

import type { User } from "./user"
import type { AnchorService } from "./anchor-service"

export interface Context {
    user?: User;
    ipfs?: Ipfs; // an ipfs instance
    resolver?: Resolver; // a DID resolver instance
    provider?: DIDProvider; // a DID provider (3ID provider initially)
    anchorService?: AnchorService;

    api?: CeramicApi; // the self reference to the Ceramic API
}
