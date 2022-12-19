import {
  type SupportedNetwork,
  convertEthHashToCid,
  getCidFromAnchorEventLog,
} from '@ceramicnetwork/anchor-utils'
import type { AnchorProof } from '@ceramicnetwork/common'
import type { Block, Log } from '@ethersproject/providers'

export function createAnchorProof(chainId: SupportedNetwork, block: Block, log: Log): AnchorProof {
  return {
    chainId,
    blockNumber: block.number,
    blockTimestamp: block.timestamp,
    txHash: convertEthHashToCid(log.transactionHash),
    root: getCidFromAnchorEventLog(log),
  }
}
