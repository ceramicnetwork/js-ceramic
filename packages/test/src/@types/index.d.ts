import type Ceramic from '@ceramicnetwork/ceramic-core'
import type CeramicClient from '@ceramicnetwork/ceramic-http-client'

declare global {
  type CeramicApi = Ceramic | CeramicClient;
}
