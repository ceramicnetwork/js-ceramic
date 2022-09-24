import { StreamID } from '@ceramicnetwork/streamid'

export function typeStreamID(streamId: StreamID | string): StreamID {
  return typeof streamId === 'string' ? StreamID.fromString(streamId) : streamId
}

/**
 * Takes an object and query URL and serialized the query object into the searchParams of the
 * queryUrl so it can be sent as part of a GET query
 * @param queryURL
 * @param queryObject
 */
export function serializeObjectToSearchParams(
  queryURL: URL,
  queryObject: Record<string, any>
): void {
  for (const [key, value] of Object.entries(queryObject)) {
    if (typeof value == 'object') {
      queryURL.searchParams.set(key, JSON.stringify(value))
    } else {
      queryURL.searchParams.set(key, value)
    }
  }
}
