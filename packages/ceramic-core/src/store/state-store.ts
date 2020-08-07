import { DocState, Doctype } from "@ceramicnetwork/ceramic-common"

export interface StateStore {
    open(): Promise<void>;
    close(): Promise<void>;
    save(document: Doctype): Promise<void>;
    load(docId: string): Promise<DocState | null>;
    exists(docId: string): Promise<boolean>;
    list(docId?: string): Promise<string[]>;
    remove(docId: string): Promise<void>;
}