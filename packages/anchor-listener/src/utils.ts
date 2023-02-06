import {
  type SupportedNetwork,
  convertEthHashToCid,
  getCidFromAnchorEventLog,
  CONTRACT_TX_TYPE,
} from '@ceramicnetwork/anchor-utils'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Log } from '@ethersproject/providers'

/**
 * Create an AnchorProof for a given chain ID and log
 *
 * @param chainId supported anchor network chain ID
 * @param log ethers.js Log object
 * @returns AnchorProof
 */
export function createAnchorProof(chainId: SupportedNetwork, log: Log): AnchorProof {
  return {
    chainId,
    txHash: convertEthHashToCid(log.transactionHash),
    root: getCidFromAnchorEventLog(log),
    txType: CONTRACT_TX_TYPE,
  }
}
