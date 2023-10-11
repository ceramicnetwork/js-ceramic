import * as providers from '@ethersproject/providers'
import { LRUCache } from 'least-recent'

/**
 * Ethereum network configuration
 */
interface EthNetwork {
  network: string
  chain: string
  chainId: number
  networkId: number
  type: string
  endpoint?: string
}

/**
 * Maps some of Ethereum chain IDs to network configuration
 */
const ETH_CHAIN_ID_MAPPINGS: Record<string, EthNetwork> = {
  'eip155:1': { network: 'mainnet', chain: 'ETH', chainId: 1, networkId: 1, type: 'Production' },
  'eip155:3': { network: 'ropsten', chain: 'ETH', chainId: 3, networkId: 3, type: 'Test' },
  'eip155:4': { network: 'rinkeby', chain: 'ETH', chainId: 4, networkId: 4, type: 'Test' },
  'eip155:5': { network: 'goerli', chain: 'ETH', chainId: 5, networkId: 5, type: 'Test' },
  'eip155:100': {
    network: 'mainnet',
    chain: 'Gnosis',
    chainId: 100,
    networkId: 100,
    type: 'Test',
    endpoint: 'https://rpc.ankr.com/gnosis',
  },
}

const BASE_CHAIN_ID = 'eip155'
const MAX_PROVIDERS_COUNT = 100

export interface IProvidersCache {
  getProvider(chainId: string | null): Promise<providers.BaseProvider>
  ethereumRpcEndpoint: string
}

/**
 * Providers cache
 */
export class ProvidersCache {
  private readonly cache: LRUCache<string, providers.BaseProvider>

  /**
   * @param ethereumRpcEndpoint
   */
  constructor(readonly ethereumRpcEndpoint: string) {
    this.cache = new LRUCache(MAX_PROVIDERS_COUNT)
  }

  /**
   * Gets Ethereum provider based on chain ID
   * @param chain - CAIP-2 Chain ID
   * @private
   */
  async getProvider(chainId: string | null): Promise<providers.BaseProvider> {
    const fromCache = this.cache.get(chainId)

    if (fromCache) return fromCache

    if (!chainId.startsWith('eip155')) {
      throw new Error(`Unsupported chainId '${chainId}' - must be eip155 namespace`)
    }

    const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS[chainId]
    const endpoint = this.ethereumRpcEndpoint || ethNetwork?.endpoint

    let provider
    if (endpoint) {
      provider = new providers.StaticJsonRpcProvider(endpoint)
      return provider
    } else {
      if (ethNetwork == null) {
        throw new Error(`No ethereum provider available for chainId ${chainId}`)
      }

      provider = providers.getDefaultProvider(ethNetwork.network)
    }

    this.cache.set(chainId, provider)
    const provider_chain_idnum = (await provider.getNetwork()).chainId
    const provider_chain = BASE_CHAIN_ID + ':' + provider_chain_idnum
    if (chainId != provider_chain) {
      throw new Error(
        `Configured eth provider is for chainId ${provider_chain}, but desired chain is ${chainId}`
      )
    }
    return provider
  }
}
