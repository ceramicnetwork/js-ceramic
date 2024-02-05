import { Networks } from '@ceramicnetwork/common'
import { randomUint32 } from '@stablelib/random'

const DEFAULT_NETWORK = Networks.INMEMORY

const NETWORK_OFFSET = randomUint32()
const TOPIC_BY_NETWORK = {
  [Networks.MAINNET]: '/ceramic/mainnet',
  [Networks.TESTNET_CLAY]: '/ceramic/testnet-clay',
  [Networks.DEV_UNSTABLE]: '/ceramic/dev-unstable',
  // Default to a random pub/sub topic so that local deployments are isolated from each other
  // by default.  Allow specifying a specific pub/sub topic so that test deployments *can*
  // be made to talk to each other if needed.
  [Networks.LOCAL]: `/ceramic/local-${NETWORK_OFFSET}`,
  [Networks.INMEMORY]: `/ceramic/inmemory-${NETWORK_OFFSET}`,
}

const ALLOW_CUSTOM_TOPIC = [Networks.INMEMORY, Networks.LOCAL]

/**
 * Protocol options that are derived from the specified Ceramic network name (e.g. "mainnet", "testnet-clay", etc)
 */
export type CeramicNetworkOptions = {
  name: Networks // Must be one of the supported network names
  pubsubTopic: string // The topic that will be used for broadcasting protocol messages
  offset: number // A random offset that is added to the pubsub topic to isolate local/inmemory deployments
}

export class CustomTopicError extends Error {
  constructor() {
    super("Specifying pub/sub topic is only supported for the 'inmemory' and 'local' networks")
  }
}

export class UnrecognizedNetworkError extends Error {
  constructor(network: string) {
    super(
      `Unrecognized Ceramic network name: '${network}'. Supported networks are: 'mainnet', 'testnet-clay', 'dev-unstable', 'local', 'inmemory'`
    )
  }
}

export function assertNetwork(input: string): asserts input is Networks {
  const isValid = Object.keys(TOPIC_BY_NETWORK).includes(input)
  if (!isValid) throw new UnrecognizedNetworkError(input)
}

export function pubsubTopicFromNetwork(network: Networks, customTopic: string | undefined): string {
  if (customTopic && !ALLOW_CUSTOM_TOPIC.includes(network)) {
    throw new CustomTopicError()
  }
  return customTopic || TOPIC_BY_NETWORK[network]
}

export function networkOptionsByName(
  networkName: string = DEFAULT_NETWORK,
  customTopic: string | undefined
): CeramicNetworkOptions {
  assertNetwork(networkName)
  const pubsubTopic = pubsubTopicFromNetwork(networkName, customTopic)
  return {
    name: networkName,
    pubsubTopic: pubsubTopic,
    offset: networkName === Networks.LOCAL ? NETWORK_OFFSET : 0,
  }
}
