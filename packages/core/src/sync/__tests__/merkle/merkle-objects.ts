import { CID } from 'multiformats/cid'
import { CompareFunction, MergeFunction, MetadataFunction, Node, TreeMetadata } from './merkle.js'
import type { DiagnosticsLogger, StreamMetadata } from '@ceramicnetwork/common'
import type { StreamID } from '@ceramicnetwork/streamid'
import type { CIDHolder } from '@ceramicnetwork/anchor-utils'

interface AbortOptions {
  signal?: AbortSignal
}

interface IIpfsService {
  storeRecord(record: any, options?: AbortOptions): Promise<CID>
}

export interface Candidate {
  readonly cid: CID
  readonly metadata: StreamMetadata
  readonly streamId: StreamID
}

/**
 * Implements IPFS merge CIDs
 */
export class IpfsMerge implements MergeFunction<CIDHolder, TreeMetadata> {
  constructor(private readonly ipfsService: IIpfsService) {}

  async merge(
    left: Node<CIDHolder>,
    right: Node<CIDHolder> | null = null,
    metadata: TreeMetadata | null = null
  ): Promise<Node<CIDHolder>> {
    const merged = [left.data.cid, right?.data?.cid || null]

    if (metadata) {
      const metadataCid = await this.ipfsService.storeRecord(metadata)
      merged.push(metadataCid)
    }

    const mergedCid = await this.ipfsService.storeRecord(merged)
    return new Node<CIDHolder>({ cid: mergedCid }, left, right)
  }
}

/**
 * Implements IPFS merge CIDs
 */
export class IpfsLeafCompare implements CompareFunction<Candidate> {
  constructor(private readonly logger: DiagnosticsLogger) {}

  compare(left: Node<Candidate>, right: Node<Candidate>): number {
    try {
      // Sort by model first
      const leftModel = left.data.metadata.model?.toString()
      const rightModel = right.data.metadata.model?.toString()
      if (leftModel !== rightModel) {
        if (leftModel != null) {
          return rightModel == null
            ? -1 // null last
            : leftModel.localeCompare(rightModel)
        }
        return 1 // null last
      }

      // Sort by controller
      // If either value is an object for whatever reason it will
      // be sorted last because "[" < "d" ("[object Object]" vs "did:...")
      const leftController = String(left.data.metadata.controllers[0])
      const rightController = String(right.data.metadata.controllers[0])
      if (leftController !== rightController) {
        return leftController.localeCompare(rightController)
      }

      // Sort by stream ID
      return left.data.streamId.toString().localeCompare(right.data.streamId.toString())
    } catch (err) {
      this.logger.err(
        `Error while comparing stream ${left.data.streamId.toString()} to stream ${right.data.streamId.toString()}. Error: ${err}`
      )
      throw err
    }
  }
}

/**
 * Implements IPFS merge CIDs
 */
export class BloomMetadata implements MetadataFunction<Candidate, TreeMetadata> {
  generateMetadata(leaves: Array<Node<Candidate>>): TreeMetadata {
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
