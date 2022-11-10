import type { StreamState, StreamStateHolder } from '@ceramicnetwork/common'
import type { StreamID } from '@ceramicnetwork/streamid'
import { StoreForNetwork } from './store-for-network.js'
import { Stream } from '@ceramicnetwork/common'

export interface StateStoreInterface {
  networkName: string

  open(store: StoreForNetwork): Promise<void>
  close(): Promise<void>
  saveFromStream(stream: Stream): Promise<void>
  saveFromStreamStateHolder(streamStateHolder: StreamStateHolder): Promise<void>
  load(streamId: StreamID): Promise<StreamState>
  list(streamId?: StreamID | null, limit?: number): Promise<string[]>
  remove(streamId: StreamID): Promise<void>
}
