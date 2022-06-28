import { StreamID } from '@ceramicnetwork/streamid'

export function typeStreamID(streamId: StreamID | string): StreamID {
  return typeof streamId === 'string' ? StreamID.fromString(streamId) : streamId
}
