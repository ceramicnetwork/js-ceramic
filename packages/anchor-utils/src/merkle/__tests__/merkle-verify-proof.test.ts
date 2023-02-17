import { MerkleTree } from '../merkle-tree.js'
import { expect, describe, test, beforeAll } from '@jest/globals'
import { MerkleTreeFactory } from '../merkle-tree-factory.js'
import { StringConcat } from './string-concat.js'

const leaves: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
const factory = new MerkleTreeFactory(new StringConcat())

let tree: MerkleTree<string, string, string>

describe('Merkle tree proof verification', () => {
  beforeAll(async () => {
    tree = await factory.build(leaves)
  })

  describe('a given merkle tree', () => {
    describe('untampered proofs', () => {
      test.each(leaves)(`should verify the proof for leaf index %p`, async (leaf) => {
        const index = leaves.indexOf(leaf)
        const proof = tree.getProof(index)
        const verified = await tree.verifyProof(proof, leaves[index])
        expect(verified).toBeTruthy()
      })
    })

    describe('tampered proofs', () => {
      describe('verifying a different node with a proof', () => {
        test('should not verify the proof', async () => {
          const proof = tree.getProof(2)
          const verified = await tree.verifyProof(proof, leaves[3])
          expect(verified).toBeFalsy()
        })
      })
    })
  })
})
