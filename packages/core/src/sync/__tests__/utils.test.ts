import { CID } from 'multiformats/cid'
import { MerkleTreeLoader } from '../utils.js'
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

describe('Merkle Tree Loader', () => {
  let merkleTreeLoader: MerkleTreeLoader

  beforeAll(async () => {
    const ipfsService = new MockIpfsServce()
    merkleTreeLoader = new MerkleTreeLoader(ipfsService, ROOT_CID)
  })

  test('can getMetadata', async () => {
    const metadata = await merkleTreeLoader.getMetadata()
    expect(metadata).toEqual({ numEntries: NUM_ENTRIES })
  })

  test('can getLeaf', async () => {
    const results = await Promise.all(
      [...Array(NUM_ENTRIES).keys()].map((index) => merkleTreeLoader.getLeafData(index))
    )

    expect(results).toEqual([
      { cid: 'l0', path: [0, 0, 0] },
      { cid: 'l1', path: [0, 0, 1] },
      { cid: 'l2', path: [0, 1, 0] },
      { cid: 'l3', path: [0, 1, 1] },
      { cid: 'l4', path: [1, 0, 0] },
      { cid: 'l5', path: [1, 0, 1] },
      { cid: 'l6', path: [1, 1, 0] },
      { cid: 'l7', path: [1, 1, 1, 0] },
      { cid: 'l8', path: [1, 1, 1, 1] },
    ])
  })

  test('cannot get leaf that does not exist', async () => {
    expect(merkleTreeLoader.getLeafData(NUM_ENTRIES + 1)).rejects.toThrow(
      'Leaf at index 10 does not exist as there are only 9 leaves'
    )
  })
})
