import { Node } from '@ceramicnetwork/anchor-utils'
import type { MetadataFunction, MergeFunction, CompareFunction } from '@ceramicnetwork/anchor-utils'

export class MerkleTree<TData, TLeaf extends TData, TMetadata> {
  /**
   * Node corresponding to the root of the merkle tree.
   */
  readonly root: Node<TData>
  /**
   * Leaf nodes of the tree
   */
  readonly leafNodes: Array<Node<TLeaf>>
  /**
   * Tree metadata
   */
  readonly metadata: TMetadata
}

/**
 * When no leaves present.
 */
class EmptyLeavesError extends Error {
  constructor() {
    super('Cannot generate Merkle structure with no elements')
  }
}

/**
 * When number of leaves exceeds number of leaves available (`2^depthLimit`) for `depthLimit`.
 */
class MerkleDepthError extends Error {
  constructor(depthLimit: number, leavesLimit: number) {
    super(`Merkle tree exceeded configured limit of ${depthLimit} levels (${leavesLimit} nodes)`)
  }
}

export class MerkleTreeFactory<TData, TLeaf extends TData, TMetadata> {
  constructor(
    /**
     * A function that merges nodes at lower levels to produce nodes for higher levels of the tree.
     */
    private readonly mergeFn: MergeFunction<TData, TMetadata>,
    /**
     * A function for sorting the leaves before building the tree.
     */
    private readonly compareFn?: CompareFunction<TLeaf>,
    /**
     * A function for generating the tree metadata from the leaves.
     */
    private readonly metadataFn?: MetadataFunction<TLeaf, TMetadata>,
    /**
     * Limit to the number of levels the tree is allowed to have.
     */
    private readonly depthLimit?: number
  ) {}

  async build(leaves?: Array<TLeaf>): Promise<MerkleTree<TData, TLeaf, TMetadata>> {
    // Assert if we have any leaves
    if (!leaves || !leaves.length) throw new EmptyLeavesError()

    // Assert we do not overflow the tree
    const leavesLimit = Math.pow(2, this.depthLimit)
    if (this.depthLimit && leavesLimit < leaves.length) {
      throw new MerkleDepthError(this.depthLimit, leavesLimit)
    }

    const nodes = leaves.map((leaf) => new Node(leaf))
    if (this.compareFn) {
      nodes.sort(this.compareFn.compare)
    }

    const metadata = this.metadataFn ? await this.metadataFn.generateMetadata(nodes) : null

    const root = await this.buildLevel(nodes, 0, metadata)
    return { root, leafNodes: nodes, metadata }
  }

  private async buildLevel(
    elements: Node<TData>[],
    currentDepth: number,
    metadata: TMetadata | null = null
  ): Promise<Node<TData>> {
    // if there is only one leaf for the whole tree
    if (elements.length === 1 && currentDepth === 0) {
      const merged = await this.mergeFn.merge(elements[0], null, metadata)
      elements[0].parent = merged
      return merged
    }

    if (elements.length === 1) {
      return elements[0]
    }

    const middleIndex = Math.trunc(elements.length / 2)
    const leftElements = elements.slice(0, middleIndex)
    const rightElements = elements.slice(middleIndex)
    const nextDepth = currentDepth + 1
    const leftNode = await this.buildLevel(leftElements, nextDepth)
    const rightNode = await this.buildLevel(rightElements, nextDepth)
    const merged = await this.mergeFn.merge(leftNode, rightNode, metadata)
    leftNode.parent = merged
    rightNode.parent = merged
    return merged
  }
}
