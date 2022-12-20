import {
  type SupportedNetwork,
  convertEthHashToCid,
  getCidFromAnchorEventLog,
} from '@ceramicnetwork/anchor-utils'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Block, Log } from '@ethersproject/providers'

/**
 * Create an AnchorProof for a given chain ID, block and log
 *
 * @param chainId supported anchor network chain ID
 * @param block ethers.js Block object
 * @param log ethers.js Log object
 * @returns AnchorProof
 */
export function createAnchorProof(chainId: SupportedNetwork, block: Block, log: Log): AnchorProof {
  return {
    chainId,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    txHash: convertEthHashToCid(log.transactionHash),
    root: getCidFromAnchorEventLog(log),
  }
}
