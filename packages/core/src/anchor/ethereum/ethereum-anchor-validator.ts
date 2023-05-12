import * as uint8arrays from 'uint8arrays'
import { decode } from 'multiformats/hashes/digest'
import * as providers from '@ethersproject/providers'
import lru from 'lru_map'
import { AnchorProof, AnchorValidator, DiagnosticsLogger } from '@ceramicnetwork/common'
import { Block, TransactionResponse } from '@ethersproject/providers'
import { Interface } from '@ethersproject/abi'
import { create as createMultihash } from 'multiformats/hashes/digest'
import { CID } from 'multiformats/cid'
import { backOff } from 'exponential-backoff'

const SHA256_CODE = 0x12
const DAG_CBOR_CODE = 0x71

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
const TRANSACTION_CACHE_SIZE = 50
const BLOCK_CACHE_SIZE = 50
const V0_PROOF_TYPE = 'raw'
const V1_PROOF_TYPE = 'f(bytes32)' // See: https://namespaces.chainagnostic.org/eip155/caip168

const ABI = ['function anchorDagCbor(bytes32)']

const iface = new Interface(ABI)

//TODO (NET-1659): Finalize block numbers and smart contract addresses once CAS is creating smart contract anchors
const BLOCK_THRESHHOLDS = {
  'eip155:1': 1000000000, //mainnet
  'eip155:3': 1000000000, //ropsten
  'eip155:5': 1000000000, //goerli
  'eip155:100': 1000000000, //gnosis
  'eip155:1337': 1000000, //ganache
}
const ANCHOR_CONTRACT_ADDRESS = '0x231055A0852D67C7107Ad0d0DFeab60278fE6AdC'

const getCidFromV0Transaction = (txResponse: TransactionResponse): CID => {
  const withoutPrefix = txResponse.data.replace(/^(0x0?)/, '')
  return CID.decode(uint8arrays.fromString(withoutPrefix.slice(1), 'base16'))
}

const getCidFromV1Transaction = (txResponse: TransactionResponse): CID => {
  const decodedArgs = iface.decodeFunctionData('anchorDagCbor', txResponse.data)
  const rootCID = decodedArgs[0]
  const multihash = createMultihash(SHA256_CODE, uint8arrays.fromString(rootCID.slice(2), 'base16'))
  return CID.create(1, DAG_CBOR_CODE, multihash)
}

/**
 * Parses the transaction data to recover the CID.
 * @param txType transaction type of the anchor proof. Currently support `raw` and `f(bytes32)`
 * @param txResponse the retrieved transaction from the ethereum blockchain
 * @returns
 */
const getCidFromTransaction = (txType: string, txResponse: TransactionResponse): CID => {
  if (txType === V1_PROOF_TYPE) {
    return getCidFromV1Transaction(txResponse)
  } else {
    return getCidFromV0Transaction(txResponse)
  }
}

/**
 * Ethereum anchor service that stores root CIDs on Ethereum blockchain
 */
export class EthereumAnchorValidator implements AnchorValidator {
  private _chainId: string | null
  private readonly providersCache: lru.LRUMap<string, providers.BaseProvider>
  private readonly _transactionCache: lru.LRUMap<string, TransactionResponse>
  private readonly _blockCache: lru.LRUMap<string, Block>
  private readonly _logger: DiagnosticsLogger

  /**
   * @param ethereumRpcEndpoint
   * @param logger
   */
  constructor(readonly ethereumRpcEndpoint: string, logger: DiagnosticsLogger) {
    this.providersCache = new lru.LRUMap(MAX_PROVIDERS_COUNT)
    this._transactionCache = new lru.LRUMap(TRANSACTION_CACHE_SIZE)
    this._blockCache = new lru.LRUMap(BLOCK_CACHE_SIZE)
    this._logger = logger
  }

  /**
   * @param chainId - Chain ID for ethereum chain that we need to validate, or null. If null, then
   *   the `ethereumRpcEndpoint` needs to be chain-id specific so there's no ambiguity as to
   *   which chain we are operating with.
   */
  async init(chainId: string | null): Promise<void> {
    if (!chainId) {
      return
    }

    // Confirm that we have an eth provider that works for the same chain that the anchor service supports (if given)
    const provider = this._getEthProvider(chainId)
    const provider_chain_idnum = (await provider.getNetwork()).chainId
    const provider_chain = BASE_CHAIN_ID + ':' + provider_chain_idnum
    if (chainId != provider_chain) {
      throw new Error(
        `Configured eth provider is for chainId ${provider_chain}, but our anchor service uses chain ${chainId}`
      )
    }
    this._chainId = chainId
  }

  get chainId(): string {
    return this._chainId
  }

  /**
   * isoldated method for fetching tx from cache, and if not set
   **/
  private async _getTransaction(
    provider: providers.BaseProvider,
    txHash: string
  ): Promise<TransactionResponse> {
    let tx = this._transactionCache.get(txHash)
    if (!tx) {
      tx = await backOff(async () => {
        try {
          return provider.getTransaction(txHash)
        } catch (e) {
          this._logger.warn(`Failed to get transaction: ${e}`)
          throw e
        }
      })
      this._transactionCache.set(txHash, tx)
    }
    return tx
  }

  private async _getValidTransaction(provider: providers.BaseProvider, txHash: string): Promise<TransactionResponse> {
    const tx = await this._getTransaction(provider, txHash)
    if (!tx) {
      throw new Error(`Failed to load transaction data for transaction ${txHash}`)
    }

    return tx
  }


  /**
   * Given a chainId and a transaction hash, loads information from ethereum about the transaction
   * and block the transaction was included in.
   * Testing has shown that when no ethereumRpcEndpoint has been provided and we are therefore using
   * the ethersproject's defaultProvider, we sometimes get back null for the transaction or block,
   * so this function also includes some extra error handling and throws exceptions with a warning
   * to use an actual ethereum rpc endpoint if the above behavior is seen.
   * @param chainId
   * @param txHash
   * @private
   */
  private async _getTransactionAndBlockInfo(
    chainId: string,
    txHash: string
  ): Promise<[TransactionResponse, Block]> {
    try {
      // determine network based on a chain ID
      const provider: providers.BaseProvider = this._getEthProvider(chainId)
      const transaction: TransactionResponse = await backOff(() => this._getValidTransaction(provider, txHash), {
        retry: (e) => {
          this._logger.warn(`Failed to get transaction from provider: ${e}`)
          return true
        },
      })

      let block = this._blockCache.get(transaction.blockHash)
      if (!block) {
        block = await backOff(async () => { return provider.getBlock(transaction.blockHash) }, {
          retry: (e) => {
            this._logger.warn(`Failed to get block from provider: ${e}`)
            return true
          },
        })
        this._blockCache.set(transaction.blockHash, block)
      }

      return [transaction, block]
    } catch (e) {
      this._logger.err(
        `Error loading transaction info for transaction ${txHash} from Ethereum: ${e}`
      )
      throw e
    }
  }

  async validateChainInclusion(anchorProof: AnchorProof): Promise<number> {
    const decoded = decode(anchorProof.txHash.multihash.bytes)
    const txHash = '0x' + uint8arrays.toString(decoded.digest, 'base16')
    const [txResponse, block] = await this._getTransactionAndBlockInfo(anchorProof.chainId, txHash)
    const txCid = getCidFromTransaction(anchorProof.txType, txResponse)

    if (!txCid.equals(anchorProof.root)) {
      throw new Error(`The root CID ${anchorProof.root} is not in the transaction`)
    }

    if (txResponse.blockNumber <= BLOCK_THRESHHOLDS[this._chainId]) {
      return block.timestamp
    }

    // if the block number is greater than the threshold and the txType is `raw` or non existent
    if (anchorProof.txType !== V1_PROOF_TYPE) {
      throw new Error(
        `Any anchor proofs created after block ${
          BLOCK_THRESHHOLDS[this._chainId]
        } must include the txType field. Anchor txn blockNumber: ${txResponse.blockNumber}`
      )
    }

    if (txResponse.to != ANCHOR_CONTRACT_ADDRESS) {
      throw new Error(
        `Anchor was created using address ${txResponse.to}. This is not the official anchoring contract address ${ANCHOR_CONTRACT_ADDRESS}`
      )
    }

    return block.timestamp
  }

  /**
   * Gets Ethereum provider based on chain ID
   * @param chain - CAIP-2 Chain ID
   * @private
   */
  private _getEthProvider(chain: string): providers.BaseProvider {
    const fromCache = this.providersCache.get(chain)

    if (fromCache) return fromCache

    if (!chain.startsWith('eip155')) {
      throw new Error(`Unsupported chainId '${chain}' - must be eip155 namespace`)
    }

    if (this._chainId && this._chainId != chain) {
      throw new Error(
        `Unsupported chainId '${chain}'. Configured anchor service only supports '${this._chainId}'`
      )
    }

    const ethNetwork: EthNetwork = ETH_CHAIN_ID_MAPPINGS[chain]
    const endpoint = this.ethereumRpcEndpoint || ethNetwork?.endpoint

    if (endpoint) {
      const provider = new providers.StaticJsonRpcProvider(endpoint)
      this.providersCache.set(chain, provider)
      return provider
    }

    if (ethNetwork == null) {
      throw new Error(`No ethereum provider available for chainId ${chain}`)
    }

    const provider = providers.getDefaultProvider(ethNetwork.network)
    this.providersCache.set(chain, provider)
    return provider
  }
}
