import Ipfs from "ipfs"
import { DIDProvider } from "./ceramic-api"

export interface Context {
    ipfs: Ipfs.Ipfs; // an ipfs instance
    resolver: any; // a DID resolver instance
    provider: DIDProvider; // a DID provider (3ID provider initially)
    anchorService: AnchorService;
}
