import { type ICandidate, Node } from '@ceramicnetwork/anchor-utils'
import type { MetadataFunction, TreeMetadata } from '@ceramicnetwork/anchor-utils'

/**
 * Implements IPFS merge CIDs
 */
export class FauxBloomMetadata implements MetadataFunction<ICandidate, TreeMetadata> {
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
