import { CID } from 'multiformats/cid'
import { MerkleTreeLeafLoader } from '../merkle-tree-leaf-loader.js'
import { TestUtils } from '@ceramicnetwork/common'

const NUM_ENTRIES = 9
const MOCK_MERKLE_TREE = [
  [
    ['l0', 'l1'],
    ['l2', 'l3'],
  ],
  [
    ['l4', 'l5'],
    [['l6'], ['l7', 'l8']],
  ],
  { numEntries: NUM_ENTRIES },
]
const ROOT_CID = TestUtils.randomCID()

class MockIpfsServce {
  async retrieveFromIPFS(cid: CID | string, path?: string): Promise<any> {
    const splitPath = (path ?? '').split('/')

    let value = MOCK_MERKLE_TREE
    for (const index of splitPath) {
      value = value[index]
    }

    return value
  }
}

describe('Merkle Tree Leaf Loader', () => {
  let merkleTreeLeafLoader: MerkleTreeLeafLoader

  beforeAll(async () => {
    const ipfsService = new MockIpfsServce()
    merkleTreeLeafLoader = new MerkleTreeLeafLoader(ipfsService, ROOT_CID)
  })

  test('can getMetadata', async () => {
    const metadata = await merkleTreeLeafLoader.getMetadata()
    expect(metadata).toEqual({ numEntries: NUM_ENTRIES })
  })

  test('can getLeaf', async () => {
    const results = await Promise.all(
      [...Array(NUM_ENTRIES).keys()].map((index) => merkleTreeLeafLoader.getLeaf(index))
    )

    expect(results).toEqual([...Array(NUM_ENTRIES).keys()].map((index) => `l${index}`))
  })

  test('cannot get leaf that does not exist', async () => {
    expect(merkleTreeLeafLoader.getLeaf(NUM_ENTRIES + 1)).rejects.toThrow(
      'Leaf at index 10 does not exist as there are only 9 leaves'
    )
  })
})
