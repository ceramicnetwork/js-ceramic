import { DiagnosticsLogger, IpfsApi, PinningBackendStatic } from '@ceramicnetwork/common'
import { PinningAggregation } from '@ceramicnetwork/pinning-aggregation'
import { PinStore } from './pin-store.js'
import type { CID } from 'multiformats/cid'
import { IpfsPinning } from '@ceramicnetwork/pinning-ipfs-backend'
import { Repository } from '../state-management/repository.js'
import { StreamStateStore } from './stream-state-store.js'

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
    this._stateStore = new StreamStateStore(logger)
  }

  public createPinStore(): PinStore {
    const ipfs = this.ipfs
    const pinning = PinningAggregation.build(ipfs, this.pinningEndpoints, this.pinningBackends)
    const retrieve = async (cid: CID): Promise<any> => {
      const blob = await ipfs.dag.get(cid, { timeout: IPFS_GET_TIMEOUT })
      return blob?.value
    }
    const resolve = async (path: string): Promise<CID> => {
      return (await ipfs.dag.resolve(path)).cid
    }
    const loadStream = this.repository.load.bind(this.repository)
    return new PinStore(this._stateStore, pinning, retrieve, resolve, loadStream)
  }
}
