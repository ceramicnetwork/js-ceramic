export interface MergeFunction<TValue, TMetadata> {
  /**
   * Merges two nodes.
   * @param n1 - Node 1 to merge.
   * @param n2 - Node 2 to merge.
   * @param metadata - optional tree metadata, generally only given when building the root node.
   */
  merge(
    n1: Node<TValue>,
    n2: Node<TValue> | null,
    metadata: TMetadata | null
  ): Promise<Node<TValue>>
}

export interface CompareFunction<TValue> {
  /**
   * Compares two Merkle tree nodes.
   * @param n1 - Node 1 to compare.
   * @param n2 - Node 2 to compare.
   */
  compare(n1: Node<TValue>, n2: Node<TValue>): number
}

export interface MetadataFunction<TValue, TMetadata> {
  /**
   * Generates the tree metadata from the leaf nodes
   */
  generateMetadata(leafNodes: Array<Node<TValue>>): TMetadata
}

/**
 * Interface of one Merkle node
 */
export class Node<TValue> {
  parent?: Node<TValue>

  constructor(
    readonly data: TValue,
    readonly left: Node<TValue> | null = null,
    readonly right: Node<TValue> | null = null
  ) {}

  toString(): string {
    return String(this.data)
  }
}

/**
 * Metadata containing a bloom filter based on the metadata of the streams in the tree
 */
export interface BloomMetadata {
  type: string
  data: any
}

/**
 * Metadata related to the merkle tree
 */
export interface TreeMetadata {
  numEntries: number
  bloomFilter: BloomMetadata
  streamIds: string[]
}
