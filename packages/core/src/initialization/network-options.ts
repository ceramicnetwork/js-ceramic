import { Networks } from '@ceramicnetwork/common'

/**
 * Protocol options that are derived from the specified Ceramic network name (e.g. "mainnet", "testnet-clay", etc)
 */
export type CeramicNetworkOptions = {
  name: Networks // Must be one of the supported network names
  pubsubTopic: string // The topic that will be used for broadcasting protocol messages
}
