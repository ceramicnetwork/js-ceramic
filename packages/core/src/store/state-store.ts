import { StreamState, StreamStateHolder } from '@ceramicnetwork/common'
import StreamID from '@ceramicnetwork/streamid'

export interface StateStore {
  open(networkName: string): void
  close(): Promise<void>
  save(streamStateHolder: StreamStateHolder): Promise<void>
  load(streamId: StreamID): Promise<StreamState | null>
  list(streamId?: StreamID): Promise<string[]>
  remove(streamId: StreamID): Promise<void>
}
