import { Networks } from '@ceramicnetwork/common'
import { randomUint32 } from '@stablelib/random'

/**
 * Protocol options that are derived from the specified Ceramic network name (e.g. "mainnet", "testnet-clay", etc)
 */
export type CeramicNetworkOptions = {
  name: Networks // Must be one of the supported network names
  pubsubTopic: string // The topic that will be used for broadcasting protocol messages
}

export class CustomTopicError extends Error {
  constructor() {
    super("Specifying pub/sub topic is only supported for the 'inmemory' and 'local' networks")
  }
}

export class UnrecognizedNetworkError extends Error {
  constructor(network: never) {
    super(
      `Unrecognized Ceramic network name: '${network}'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'`
    )
  }
}

const TOPIC_BY_NETWORK = {
  [Networks.MAINNET]: '/ceramic/mainnet',
  [Networks.ELP]: '/ceramic/mainnet',
  [Networks.TESTNET_CLAY]: '/ceramic/testnet-clay',
  [Networks.LOCAL]: `/ceramic/local-${randomUint32()}`,
  [Networks.INMEMORY]: `/ceramic/inmemory-${randomUint32()}`,
}

const ALLOW_CUSTOM_TOPIC = [Networks.INMEMORY, Networks.LOCAL]

export function pubsubTopicFromNetwork(network: Networks, customTopic: string | undefined): string {
  if (customTopic && !ALLOW_CUSTOM_TOPIC.includes(network)) {
    throw new CustomTopicError()
  }
  return customTopic || TOPIC_BY_NETWORK[network]

  // switch (network) {
  //   case Networks.MAINNET:
  //     return '/ceramic/mainnet'
  //   case Networks.ELP:
  //     return '/ceramic/mainnet'
  //   case Networks.TESTNET_CLAY:
  //     return '/ceramic/testnet-clay'
  //   case Networks.DEV_UNSTABLE:
  //     return '/ceramic/dev-unstable'
  //   case Networks.LOCAL:
  //     // Default to a random pub/sub topic so that local deployments are isolated from each other
  //     // by default.  Allow specifying a specific pub/sub topic so that test deployments *can*
  //     // be made to talk to each other if needed.
  //     if (customTopic) {
  //       return customTopic
  //     } else {
  //       return `/ceramic/local-${randomUint32()}`
  //     }
  //   case Networks.INMEMORY:
  //     // Default to a random pub/sub topic so that inmemory deployments are isolated from each other
  //     // by default.  Allow specifying a specific pub/sub topic so that test deployments *can*
  //     // be made to talk to each other if needed.
  //     if (customTopic) {
  //       return customTopic
  //     } else {
  //       return `/ceramic/inmemory-${randomUint32()}`
  //     }
  //   default: {
  //     throw new UnrecognizedNetworkError(network)
  //   }
  // }
}
