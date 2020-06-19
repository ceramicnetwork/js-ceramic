import Ipfs from "ipfs"
import { Resolver } from "did-resolver"
import { CeramicApi, DIDProvider } from "./ceramic-api"

import User from "./user"
import AnchorService from "./anchor-service"

export interface Context {
    user?: User;
    ipfs?: Ipfs.Ipfs; // an ipfs instance
    resolver?: Resolver; // a DID resolver instance
    provider?: DIDProvider; // a DID provider (3ID provider initially)
    anchorService?: AnchorService;

    api?: CeramicApi; // the self reference to the Ceramic API
}
