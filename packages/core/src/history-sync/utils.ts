import { CID } from 'multiformats/cid'
import type { IpfsService, TreeMetadata } from './interfaces.js'
import { PathDirection, pathString, pathByIndex } from '@ceramicnetwork/anchor-utils'

const METADATA_PATH = '2'

/**
 * Retrieves the leaves of a Merkle Tree based on the merkle trees metadata
 */
export class MerkleTreeLoader {
  private _metadata: TreeMetadata

  constructor(private readonly ipfsService: IpfsService, private readonly rootCid: CID) {}

  /**
   * retrieves the merkle tree's metadata. The metadata must include the number of leaves in the tree
   * @returns promise for the metadata
   */
  async getMetadata(): Promise<TreeMetadata> {
    if (!this._metadata) {
      this._metadata = await this.ipfsService.retrieveFromIPFS(this.rootCid, METADATA_PATH)
    }

    return this._metadata
  }

  /**
   * retreives the path to the leaf and the cid found at the provided index
   * @param index index of the leaf
   * @returns promise for the cid stored in the leaf
   */
  async getLeafData(index: number): Promise<{ cid: CID; path: PathDirection[] }> {
    const metadata = await this.getMetadata()
    const path = pathByIndex(index, metadata.numEntries)

    const parent = await this.ipfsService.retrieveFromIPFS(
      this.rootCid,
      pathString(path.slice(0, -1))
    )
    const lastPathDirection = path[path.length - 1]
    const cid = parent[lastPathDirection]

    return { cid, path }
  }
}
