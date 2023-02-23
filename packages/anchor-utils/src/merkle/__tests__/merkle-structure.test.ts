import { Node, CompareFunction, MetadataFunction } from '../merkle-elements.js'
import type { MerkleTree } from '../merkle-tree.js'
import { MerkleTreeFactory } from '../merkle-tree-factory.js'
import { expect, describe, test } from '@jest/globals'
import { StringConcat } from './string-concat.js'

class StringCompare implements CompareFunction<string> {
  compare(n1: Node<string>, n2: Node<string>): number {
    return n1.data.localeCompare(n2.data)
  }
}

class StringConcatMetadata implements MetadataFunction<string, string> {
  generateMetadata(leaves: Array<Node<string>>): string {
    let res
    for (const node of leaves) {
      if (res) {
        res = res + ' + ' + node.data
      } else {
        res = node.data
      }
    }
    return res
  }
}

const STRING_CONCAT_FACTORY = new MerkleTreeFactory(new StringConcat())

describe('Merkle tree structure tests', () => {
  test('should handle null case', async () => {
    await expect(STRING_CONCAT_FACTORY.build(null)).rejects.toThrow(
      /Cannot generate Merkle structure with no elements/
    )
  })

  test('Enforces depth limit', async () => {
    const merkleTreeFactory = new MerkleTreeFactory<string, string, string>(
      new StringConcat(),
      undefined,
      undefined,
      2
    )
    // No problem building with limit so long as there are fewer than 2^limit nodes
    const merkleTree = await merkleTreeFactory.build(['A', 'B', 'C', 'D'])

    expect(merkleTree.root.data).toBe('Hash(Hash(A + B) + Hash(C + D))')

    // Fails to build when there are more nodes than can fit within the depth limit
    await expect(merkleTreeFactory.build(['A', 'B', 'C', 'D', 'E'])).rejects.toThrow(
      'Merkle tree exceeded configured limit of 2 levels (4 nodes)'
    )
  })

  test('should handle the base case: [A]', async () => {
    const leaves = ['A']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(A + null)')
  })

  test('should create a root from two leaves: [A,B]', async () => {
    const leaves = ['A', 'B']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(A + B)')
  })

  test('should create a root from four leaves: [A,B,C,D]', async () => {
    const leaves = ['A', 'B', 'C', 'D']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(Hash(A + B) + Hash(C + D))')
  })

  test('should create a root from four leaves: [B,D,A,C]', async () => {
    const leaves = ['B', 'D', 'A', 'C']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(Hash(B + D) + Hash(A + C))')
  })

  test('should create a root from four leaves (sorted): [B,D,A,C]', async () => {
    const leaves = ['B', 'D', 'A', 'C']
    const factory = new MerkleTreeFactory(new StringConcat(), new StringCompare())
    const merkleTree = await factory.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(Hash(A + B) + Hash(C + D))')
  })

  test('should create a root from three leaves: [A,B,C]', async () => {
    const leaves = ['A', 'B', 'C']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(A + Hash(B + C))')
  })

  test('should create a root from five leaves: [A,B,C,D,E]', async () => {
    const leaves = ['A', 'B', 'C', 'D', 'E']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(Hash(A + B) + Hash(C + Hash(D + E)))')
  })

  test('should create a root from six leaves: [A,B,C,D,E,F]', async () => {
    const leaves = ['A', 'B', 'C', 'D', 'E', 'F']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe('Hash(Hash(A + Hash(B + C)) + Hash(D + Hash(E + F)))')
  })

  test('should create a root from seven leaves: [A,B,C,D,E,F,G]', async () => {
    const leaves = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

    expect(merkleTree.root.data).toBe(
      'Hash(Hash(A + Hash(B + C)) + Hash(Hash(D + E) + Hash(F + G)))'
    )
  })

  test('should create metadata', async () => {
    const leaves = ['B', 'D', 'A', 'C']
    const factory = new MerkleTreeFactory(
      new StringConcat(),
      new StringCompare(),
      new StringConcatMetadata()
    )
    const merkleTree = await factory.build(leaves)

    expect(merkleTree.metadata).toEqual('A + B + C + D')
    expect(merkleTree.root.data).toBe('Hash(Hash(A + B) + Hash(C + D) + Metadata(A + B + C + D))')
  })
})

const findNodeDepth = async (node: Node<any>): Promise<number> => {
  if (!node) {
    return 0
  }

  let depth = 0
  while (node) {
    node = node.parent
    depth++
  }
  return depth
}

const findMinAndMaxNodeDepth = async (
  tree: MerkleTree<any, any, any>
): Promise<[number, number]> => {
  let minDepth = tree.leafNodes.length
  let maxDepth = 0

  for (const node of tree.leafNodes) {
    const depth = await findNodeDepth(node)
    if (depth < minDepth) {
      minDepth = depth
    }
    if (depth > maxDepth) {
      maxDepth = depth
    }
  }
  return [minDepth, maxDepth]
}

describe('Merkle tree balance test', () => {
  test('Tree should be balanced', async () => {
    const inputs = []
    for (let i = 1; i < 100; i++) {
      // Create an array of numbers from 0-i in increasing order
      const arr = Array.from(Array(i).keys())
      inputs.push(arr.map((i) => i.toString()))
    }

    for (const leaves of inputs) {
      const merkleTree = await STRING_CONCAT_FACTORY.build(leaves)

      const [minDepth, maxDepth] = await findMinAndMaxNodeDepth(merkleTree)
      // There shouldn't be more than 1 level difference between the deepest and shallowest nodes in the tree
      expect(maxDepth - minDepth).toBeLessThanOrEqual(1)
    }
  })
})
