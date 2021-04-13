import { DocState, DocStateHolder } from '@ceramicnetwork/common';
import StreamID from '@ceramicnetwork/streamid'

export interface StateStore {
    open(networkName: string): void;
    close(): Promise<void>;
    save(docStateHolder: DocStateHolder): Promise<void>;
    load(streamId: StreamID): Promise<DocState | null>;
    list(streamId?: StreamID): Promise<string[]>;
    remove(streamId: StreamID): Promise<void>;
}
