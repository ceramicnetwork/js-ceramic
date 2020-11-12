import {DocMetadata} from "@ceramicnetwork/common";

/**
 * Describes the structure of a Genesis Record for the Tile doctype
 */
export interface GenesisRecord {
    data: any,
    header: DocMetadata,
    unique: string,
    chainId: string,
}

// TODO Add AnchorRecord and SignedRecord