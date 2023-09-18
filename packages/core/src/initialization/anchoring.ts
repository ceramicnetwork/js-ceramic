import { type AnchorService, type DiagnosticsLogger, Networks } from '@ceramicnetwork/common'
import { DIDAnchorServiceAuth } from '../anchor/auth/did-anchor-service-auth.js'
import type { CeramicConfig } from '../ceramic.js'
import { InMemoryAnchorService } from '../anchor/memory/in-memory-anchor-service.js'
import {
  AuthenticatedEthereumAnchorService,
  EthereumAnchorService,
} from '../anchor/ethereum/ethereum-anchor-service.js'

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

export class CustomMainnetCasError extends Error {
  constructor() {
    super('Cannot use custom anchor service on Ceramic mainnet')
  }
}

const TRAILING_SLASH = new RegExp(/\/+$/g) // slash at the end of the string
const MAINNET_CAS_URLS = [
  'https://cas-internal.3boxlabs.com',
  'https://cas-direct.3boxlabs.com',
  DEFAULT_ANCHOR_SERVICE_URLS[Networks.MAINNET],
  DEFAULT_ANCHOR_SERVICE_URLS[Networks.ELP],
]
export function makeAnchorServiceUrl(fromConfig: string | undefined, network: Networks): string {
  const casUrl = fromConfig?.replace(TRAILING_SLASH, '') || DEFAULT_ANCHOR_SERVICE_URLS[network]
  if (isMainnet(network) && !MAINNET_CAS_URLS.includes(casUrl)) {
    throw new CustomMainnetCasError()
  }
  return casUrl
}

function isMainnet(network: Networks): boolean {
  return network == Networks.MAINNET || network == Networks.ELP
}

/**
 * Given the ceramic network we are running on and the anchor service we are connected to, figure
 * out the set of caip2 chain IDs that are supported for stream anchoring
 */
export async function usableAnchorChains(
  network: Networks,
  anchorService: AnchorService
): Promise<string[]> {
  const casChains = await anchorService.getSupportedChains()
  const casUrl = anchorService.url
  const supportedChains = SUPPORTED_CHAINS_BY_NETWORK[network]

  // Now that we know the set of supported chains for the specified network, get the actually
  // configured chainId from the anchorService and make sure it's valid.
  const usableChains = supportedChains.filter((c) => casChains.includes(c))
  if (usableChains.length === 0) {
    throw new UnusableAnchorChainsError(network, casUrl, casChains, supportedChains)
  }
  return usableChains
}

export function makeAnchorServiceAuth(
  authMethod: string | undefined,
  anchorServiceUrl: string,
  network: Networks,
  logger: DiagnosticsLogger
): DIDAnchorServiceAuth | null {
  if (authMethod) {
    try {
      return new DIDAnchorServiceAuth(anchorServiceUrl, logger)
    } catch (error) {
      throw new Error(`DID auth method for anchor service failed to instantiate`)
    }
  } else {
    if (isMainnet(network)) {
      logger.warn(
        `DEPRECATION WARNING: The default IP address authentication will soon be deprecated. Update your daemon config to use DID based authentication.`
      )
    }
    return null
  }
}

export function makeAnchorService(
  config: CeramicConfig,
  network: Networks,
  anchorServiceUrl: string,
  logger: DiagnosticsLogger
): AnchorService {
  if (network === Networks.INMEMORY) {
    return new InMemoryAnchorService(config as any)
  } else {
    const anchorServiceAuth = makeAnchorServiceAuth(
      config.anchorServiceAuthMethod,
      anchorServiceUrl,
      network,
      logger
    )
    if (anchorServiceAuth) {
      return new AuthenticatedEthereumAnchorService(anchorServiceAuth, anchorServiceUrl, logger)
    } else {
      return new EthereumAnchorService(anchorServiceUrl, logger)
    }
  }
}
