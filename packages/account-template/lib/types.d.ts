import type Ceramic from '@ceramicnetwork/ceramic-core';
import type CeramicClient from '@ceramicnetwork/ceramic-http-client';
import type CoreDocument from '@ceramicnetwork/ceramic-core/lib/document';
import type ClientDocument from '@ceramicnetwork/ceramic-http-client/lib/document';
export declare type CeramicApi = Ceramic | CeramicClient;
export declare type CeramicDocument = CoreDocument | ClientDocument;
