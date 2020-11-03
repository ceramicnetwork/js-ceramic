import { DocState, Doctype } from "@ceramicnetwork/common"
import DocID from '@ceramicnetwork/docid'

export interface StateStore {
    open(): Promise<void>;
    close(): Promise<void>;
    save(document: Doctype): Promise<void>;
    load(docId: DocID): Promise<DocState | null>;
    exists(docId: DocID): Promise<boolean>;
    list(docId?: DocID): Promise<string[]>;
    remove(docId: DocID): Promise<void>;
}