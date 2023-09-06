import { Networks, type AnchorService } from '@ceramicnetwork/common'

export const DEFAULT_ANCHOR_SERVICE_URLS = {
  [Networks.MAINNET]: 'https://cas.3boxlabs.com',
  [Networks.ELP]: 'https://cas.3boxlabs.com',
  [Networks.TESTNET_CLAY]: 'https://cas-clay.3boxlabs.com',
  [Networks.DEV_UNSTABLE]: 'https://cas-qa.3boxlabs.com',
  [Networks.LOCAL]: 'http://localhost:8081',
}

const SUPPORTED_CHAINS_BY_NETWORK = {
  [Networks.MAINNET]: ['eip155:1'], // Ethereum mainnet
  [Networks.ELP]: ['eip155:1'], // Ethereum mainnet
  [Networks.TESTNET_CLAY]: ['eip155:3', 'eip155:4', 'eip155:100'], // Ethereum Ropsten, Rinkeby, Gnosis Chain
  [Networks.DEV_UNSTABLE]: ['eip155:3', 'eip155:4', 'eip155:5'], // Ethereum Ropsten, Rinkeby, Goerli
  [Networks.LOCAL]: ['eip155:1337'], // Ganache
  [Networks.INMEMORY]: ['inmemory:12345'], // Our fake in-memory anchor service chainId
}

export class UnusableAnchorChainsError extends Error {
  constructor(
    network: Networks,
    casURL: string,
    availableChains: Array<string>,
    supportedChains: Array<string>
  ) {
    super(
      `No usable chainId for anchoring was found.  The ceramic network '${network}' supports the chains: ['${supportedChains.join(
        "', '"
      )}'], but the configured anchor service '${casURL}' only supports the chains: ['${availableChains.join(
        "', '"
      )}']`
    )
  }
}

/**
 * Given the ceramic network we are running on and the anchor service we are connected to, figure
 * out the set of caip2 chain IDs that are supported for stream anchoring
 */
export async function usableAnchorChains(network: Networks, anchorService: AnchorService): Promise<string[]> {
  const casChains = await anchorService.getSupportedChains()
  const casURL = anchorService.url
  const supportedChains = SUPPORTED_CHAINS_BY_NETWORK[network]
  // Now that we know the set of supported chains for the specified network, get the actually
  // configured chainId from the anchorService and make sure it's valid.
  const usableChains = supportedChains.filter((c) => casChains.includes(c))
  if (usableChains.length === 0) {
    throw new UnusableAnchorChainsError(network, casURL, casChains, supportedChains)
  }
  return usableChains
}
