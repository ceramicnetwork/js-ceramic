import { IpfsApi, PinningBackendStatic } from '@ceramicnetwork/common'
import { LevelStateStore } from './level-state-store'
import { PinningAggregation } from '@ceramicnetwork/pinning-aggregation'
import { PinStore } from './pin-store'
import { StateStore } from './state-store'
import type { CID } from 'multiformats/cid'
import path from 'path'
import os from 'os'
import { IpfsPinning } from '@ceramicnetwork/pinning-ipfs-backend'

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

  constructor(readonly ipfs: IpfsApi, props: Props) {
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
      this._stateStore = new LevelStateStore(this.localStateStoreDirectory)
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
    const pinStore = new PinStore(this._stateStore, pinning, retrieve, resolve)
    pinStore.open(this.networkName)
    return pinStore
  }
}
