import type { StreamState, StreamStateHolder } from '@ceramicnetwork/common'
import type { StreamID } from '@ceramicnetwork/streamid'
import { StoreForNetwork } from './store-for-network.js'

export interface StateStore {
  open(store: StoreForNetwork): Promise<void>
  close(): Promise<void>
  save(streamStateHolder: StreamStateHolder): Promise<void>
  load(streamId: StreamID): Promise<StreamState | null>
  list(streamId?: StreamID | null, limit?: number): Promise<string[]>
  remove(streamId: StreamID): Promise<void>
}
