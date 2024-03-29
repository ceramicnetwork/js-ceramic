import { ServiceMetrics as Metrics } from '@ceramicnetwork/observability'
import { DiagnosticsLogger, IpfsApi, PinningBackendStatic, toCID } from '@ceramicnetwork/common'
import { PinningAggregation } from '@ceramicnetwork/pinning-aggregation'
import { PinStore } from './pin-store.js'
import type { CID } from 'multiformats/cid'
import { IpfsPinning } from '@ceramicnetwork/pinning-ipfs-backend'
import { Repository } from '../state-management/repository.js'
import { StreamStateStore } from './stream-state-store.js'
import type { IPLDRecordsCache } from './ipld-records-cache.js'
import { IPFS_CACHE_HIT, IPFS_CACHE_MISS } from './ipld-records-cache.js'

const IPFS_GET_TIMEOUT = 60000 // 1 minute

export type Props = {
  pinningEndpoints?: string[]
  pinningBackends?: PinningBackendStatic[]
}

export class PinStoreFactory {
  readonly pinningEndpoints: string[]
  readonly pinningBackends: PinningBackendStatic[]
  private _stateStore: StreamStateStore

  constructor(
    readonly ipfs: IpfsApi,
    readonly ipldRecordsCache: IPLDRecordsCache,
    readonly repository: Repository,
    props: Props,
    readonly logger: DiagnosticsLogger
  ) {
    this.pinningEndpoints =
      props.pinningEndpoints && props.pinningEndpoints.length > 0
        ? props.pinningEndpoints
        : ['ipfs+context']
    this.pinningBackends =
      props.pinningBackends && props.pinningBackends.length > 0
        ? props.pinningBackends
        : [IpfsPinning]
    this._stateStore = new StreamStateStore()
  }

  public createPinStore(): PinStore {
    const ipfs = this.ipfs
    const pinning = PinningAggregation.build(ipfs, this.pinningEndpoints, this.pinningBackends)
    const retrieve = async (cid: CID): Promise<any> => {
      const fromCache = this.ipldRecordsCache.get(cid)
      if (fromCache) {
        Metrics.count(IPFS_CACHE_HIT, 1)
        return fromCache.record
      }
      Metrics.count(IPFS_CACHE_MISS, 1)
      const blob = await ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })
      if (blob && blob.value) {
        const record = blob.value
        this.ipldRecordsCache.setRecord(cid, record)
        return record
      }
      return undefined
    }
    const resolve = async (path: string): Promise<CID> => {
      return toCID((await ipfs.dag.resolve(path)).cid.toString()) // TODO(CORE-137) - Replace ipfs-core-types to get consistent multiformats version
    }
    const loadStream = this.repository.load.bind(this.repository)
    return new PinStore(this._stateStore, pinning, retrieve, resolve, loadStream)
  }
}
