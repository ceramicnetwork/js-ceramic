import type { CID } from 'multiformats/cid'
import type { AbortOptions } from '@ceramicnetwork/common'
import { type ICandidate, Node } from '@ceramicnetwork/anchor-utils'
import type {
  MetadataFunction,
  CIDHolder,
  MergeFunction,
  TreeMetadata,
} from '@ceramicnetwork/anchor-utils'

interface IIpfsService {
  storeRecord(record: any, options?: AbortOptions): Promise<CID>
}

/**
 * Implements IPFS merge CIDs
 */
export class IpfsMerge implements MergeFunction<CIDHolder, TreeMetadata> {
  constructor(private readonly ipfsService: IIpfsService) {}

  async merge(
    left: Node<CIDHolder>,
    right: Node<CIDHolder> | null = null,
    metadata: TreeMetadata | null = null
  ): Promise<Node<CIDHolder>> {
    const merged = [left.data.cid, right?.data?.cid || null]

    if (metadata) {
      const metadataCid = await this.ipfsService.storeRecord(metadata)
      merged.push(metadataCid)
    }

    const mergedCid = await this.ipfsService.storeRecord(merged)
    return new Node<CIDHolder>({ cid: mergedCid }, left, right)
  }
}

/**
 * Implements IPFS merge CIDs
 */
export class BloomMetadata implements MetadataFunction<ICandidate, TreeMetadata> {
  generateMetadata(leaves: Array<Node<ICandidate>>): TreeMetadata {
    return {
      numEntries: leaves.length,
      bloomFilter: {
        type: 'test',
        data: {},
      },
      streamIds: leaves.map((node) => node.data.streamId.toString()),
    }
  }
}
