import { DiagnosticsLogger, IpfsApi, PinningBackendStatic } from '@ceramicnetwork/common'
import { LevelStateStore } from './level-state-store.js'
import { PinningAggregation } from '@ceramicnetwork/pinning-aggregation'
import { PinStore } from './pin-store.js'
import { StateStore } from './state-store.js'
import type { CID } from 'multiformats/cid'
import path from 'path'
import os from 'os'
import { IpfsPinning } from '@ceramicnetwork/pinning-ipfs-backend'
import { Repository } from '../state-management/repository.js'

export const DEFAULT_STATE_STORE_DIRECTORY = path.join(os.homedir(), '.ceramic', 'statestore')
const IPFS_GET_TIMEOUT = 60000 // 1 minute

export type Props = {
  networkName?: string
  stateStoreDirectory?: string
  pinningEndpoints?: string[]
  pinningBackends?: PinningBackendStatic[]
}

export class PinStoreFactory {
  readonly localStateStoreDirectory: string
  readonly pinningEndpoints: string[]
  readonly pinningBackends: PinningBackendStatic[]
  readonly networkName: string
  private _stateStore: StateStore

  constructor(
    readonly ipfs: IpfsApi,
    readonly repository: Repository,
    props: Props,
    readonly logger: DiagnosticsLogger
  ) {
    this.networkName = props.networkName
    this.localStateStoreDirectory = props.stateStoreDirectory || DEFAULT_STATE_STORE_DIRECTORY
    this.pinningEndpoints =
      props.pinningEndpoints && props.pinningEndpoints.length > 0
        ? props.pinningEndpoints
        : ['ipfs+context']
    this.pinningBackends =
      props.pinningBackends && props.pinningBackends.length > 0
        ? props.pinningBackends
        : [IpfsPinning]
  }

  public setStateStore(stateStore: StateStore): void {
    this._stateStore = stateStore
  }

  public createPinStore(): PinStore {
    if (!this._stateStore) {
      // Default to local leveldb backed state store if no other StateStore implementation is provided
      this._stateStore = new LevelStateStore(this.localStateStoreDirectory, this.logger)
    }
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
