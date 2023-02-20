import { Node, type MergeFunction, type TreeMetadata } from './merkle-elements.js'
import type { CIDHolder } from './cid-holder.type.js'
import type { AbortOptions, DiagnosticsLogger } from '@ceramicnetwork/common'
import type { CID } from 'multiformats/cid'

type IIpfsService = {
  storeRecord(record: any, options?: AbortOptions): Promise<CID>
}

/**
 * Implements IPFS merge CIDs
 */
export class IpfsMerge implements MergeFunction<CIDHolder, TreeMetadata> {
  constructor(
    private readonly ipfsService: IIpfsService,
    private readonly logger: DiagnosticsLogger
  ) {}

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
    this.logger.debug('Merkle node ' + mergedCid + ' created.')
    return new Node<CIDHolder>({ cid: mergedCid }, left, right)
  }
}
