import type CID from "cids";
import type {Context} from "./context";

export interface PinningBackend {
    id: string;
    open(): Promise<void>;
    close(): Promise<void>;
    pin(cid: CID): Promise<void>;
    unpin(cid: CID): Promise<void>;
    ls(): Promise<CidList>;
    info(): Promise<PinningInfo>;
}

export interface PinningBackendStatic {
    designator: string;
    new (connectionString: string, context: Context): PinningBackend;
}

export type CidString = string;
export type Designator = string;
export type CidList = Record<CidString, Designator[]>;

export type PinningInfo = Record<string, any>;
