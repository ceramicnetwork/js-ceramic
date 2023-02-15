import { type MergeFunction, Node, PathDirection } from './merkle-elements.js'

/**
 * Calculate path from Merkle tree root to `element`.
 * Uses tail recursion.
 *
 * @return Array of proof nodes.
 */
function pathFromRoot<TData>(
  element: Node<TData>,
  result: Array<PathDirection> = []
): Array<PathDirection> {
  const parent = element.parent
  if (!parent) {
    // We're at the root
    return result.reverse()
  }

  return pathFromRoot(
    parent,
    result.concat(parent.left === element ? PathDirection.L : PathDirection.R)
  )
}

/**
 * Calculate Merkle tree proof for `element`.
 * Uses tail recursion.
 */
function calculateProof<TData, TLeaf extends TData>(
  element: Node<TLeaf>,
  result: Array<Node<TData>> = []
): Array<Node<TData>> {
  const parent = element.parent
  if (!parent) {
    // We're at the root
    return result
  }

  const proofNode = parent.left === element ? parent.right : parent.left
  if (!proofNode) throw new Error(`Empty proof node`)
  return calculateProof(parent, result.concat(proofNode))
}

/**
 * Merkle tree structure.
 * Type 'TData' is the type of the nodes in the tree. Type 'TLeaf' is the type of the leaf nodes specifically,
 * which may be a more specific sub-type of 'TData'. Type 'TMetadata' is the type of the metadata.
 */
export class MerkleTree<TData, TLeaf extends TData, TMetadata> {
  constructor(
    /**
     * Function that merges nodes at lower levels to produce nodes for higher levels of the tree
     */
    private readonly mergeFn: MergeFunction<TData, TMetadata>,
    /**
     * Node corresponding to the root of the merkle tree.
     */
    readonly root: Node<TData>,
    /**
     * Leaf nodes of the tree
     */
    readonly leafNodes: Array<Node<TLeaf>>,
    /**
     * Tree metadata
     */
    readonly metadata: TMetadata | null
  ) {}

  /**
   * Get proof for particular element by index.  The proof is an array of nodes representing
   * the various subtrees that do *not* contain the given element. The idea is that
   * by repeatedly merging the element with successive nodes from the proof array, you eventually
   * should get the root node of the original merkle tree.
   * @param elemIndex - Element index
   * @returns Array of proof Nodes.
   */
  getProof(elemIndex: number): Array<Node<TData>> {
    const leaf = this.leafNodes[elemIndex]
    if (!leaf) throw new Error(`Empty leaf at index ${elemIndex}`)
    return calculateProof(leaf)
  }

  /**
   * Get direct path for particular element by index
   * @param elemIndex - Element index
   * @returns Array of PathDirection objects representing the path from the root of the tree to
   * the element requested
   */
  getDirectPathFromRoot(elemIndex: number): PathDirection[] {
    const leaf = this.leafNodes[elemIndex]
    if (!leaf) throw new Error(`Empty leaf at index ${elemIndex}`)
    return pathFromRoot(leaf)
  }

  /**
   * Verifies proof for an element
   * @param proof - Node path proof [{...}]
   * @param element - Node element
   * @returns {Promise<boolean>}
   */
  async verifyProof(proof: Node<TData>[], element: TData): Promise<boolean> {
    let current = new Node(element, null, null)
    for (const p of proof) {
      const parent = p.parent
      if (!parent) throw new Error(`No parent for node ${p}`)
      const isLeft = parent.left == p
      const isRoot = p == proof[proof.length - 1]
      const metadata = isRoot ? this.metadata : null
      if (isLeft) {
        current = await this.mergeFn.merge(p, current, metadata)
      } else {
        current = await this.mergeFn.merge(current, p, metadata)
      }
    }
    return this.root.data === current.data
  }
}

/**
 * Construct path for element at `index` in a Merkle tree that contains `leavesCount` leaves.
 * @param index - index of an element.
 * @param leavesCount - total number of leaves in the tree.
 */
export function pathByIndex(index: number, leavesCount: number): PathDirection[] {
  if (index >= leavesCount) {
    throw Error(`Leaf at index ${index} does not exist as there are only ${leavesCount} leaves`)
  }

  // only one leaf in the entire tree
  if (leavesCount === 1) {
    return [PathDirection.L]
  }

  return pathByIndexHelper(index, leavesCount)
}

function pathByIndexHelper(
  index: number,
  leavesCount: number,
  path: Array<PathDirection> = []
): Array<PathDirection> {
  if (leavesCount <= 1) {
    return path
  }

  if (leavesCount === 2) {
    index === 0 ? path.push(PathDirection.L) : path.push(PathDirection.R)
    return path
  }

  const middleIndex = Math.trunc(leavesCount / 2)
  if (index < middleIndex) {
    path.push(PathDirection.L)
    return pathByIndexHelper(index, middleIndex, path)
  } else {
    path.push(PathDirection.R)
    return pathByIndexHelper(index - middleIndex, leavesCount - middleIndex, path)
  }
}
