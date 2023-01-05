import { CID } from 'multiformats/cid'
import { IpfsService } from './interfaces.js'

const METADATA_PATH = '2'

interface Metadata {
  numEntries: number
  streamIds: string[]
}

enum PathDirection {
  L,
  R,
}

const getPath = (index: number, leavesCount: number): PathDirection[] => {
  if (index >= leavesCount) {
    throw Error(`Leaf at index ${index} does not exist as there are only ${leavesCount} leaves`)
  }

  // only one leaf in the entire tree
  if (leavesCount === 1) {
    return [PathDirection.L]
  }

  return getPathHelper(index, leavesCount)
}

const getPathHelper = (index: number, leavesCount: number, path = []): PathDirection[] => {
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
    return getPathHelper(index, middleIndex, path)
  }

  path.push(PathDirection.R)
  return getPathHelper(index - middleIndex, leavesCount - middleIndex, path)
}

/**
 * Retrieves the leaves of a Merkle Tree based on the merkle trees metadata
 */
export class MerkleTreeLoader {
  private _metadata: Metadata
  constructor(private readonly ipfsService: IpfsService, private readonly rootCid: CID) {}

  /**
   * retrieves the merkle tree's metadata. The metadata must include the number of leaves in the tree
   * @returns promise for the metadata
   */
  async getMetadata(): Promise<Metadata> {
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
    const path = getPath(index, metadata.numEntries)

    const parent = await this.ipfsService.retrieveFromIPFS(
      this.rootCid,
      path.slice(0, -1).join('/')
    )
    const lastPathDirection = path[path.length - 1]
    const cid = parent[lastPathDirection].toString()

    return { cid, path }
  }
}
