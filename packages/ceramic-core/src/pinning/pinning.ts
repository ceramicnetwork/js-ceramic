import {Context} from "@ceramicnetwork/ceramic-common";
import CID from "cids";

export interface Pinning {
    open(): Promise<void>;
    close(): Promise<void>;
    pin(cid: CID): Promise<void>;
    unpin(cid: CID): Promise<void>;
}

export interface PinningStatic {
    designator: string;
    new (connectionString: string, context: Context): Pinning;
}