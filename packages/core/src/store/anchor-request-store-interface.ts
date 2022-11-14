import { StoreForNetwork } from './store-for-network.js'
import { CommitID } from '@ceramicnetwork/streamid'

export type AnchorRequestData = Record<string, any>

export interface AnchorRequestStoreInterface {
  networkName: string

  open(store: StoreForNetwork): Promise<void>
  close(): Promise<void>
  save(commitID: CommitID, data: AnchorRequestData): Promise<void>
  load(commitID: CommitID): Promise<AnchorRequestData>
  remove(commitID: CommitID): Promise<void>
}
