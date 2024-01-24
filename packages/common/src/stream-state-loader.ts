import { StreamID } from '@ceramicnetwork/streamid'
import { StreamState } from './index.js'

export interface StreamStateLoader {
  /**
   * Loads Stream state
   * @param streamId - Stream ID
   */
  loadStreamState(streamId: StreamID): Promise<StreamState | undefined>
}
