import { StreamID } from '@ceramicnetwork/streamid'

export function typeStreamID(streamId: StreamID | string): StreamID {
  return typeof streamId === 'string' ? StreamID.fromString(streamId) : streamId
}

/**
 * Takes an object and query URL and serialized the query object into the searchParams of the
 * queryUrl, so it can be sent as part of a GET query
 */
export function serializeObjectToSearchParams(
  queryURL: URL,
  queryObject: Record<string, any>
): URL {
  const resultURL = new URL(queryURL)
  for (const [key, value] of Object.entries(queryObject)) {
    if (StreamID.isInstance(value)) {
      resultURL.searchParams.set(key, value.toString())
    } else if (typeof value == 'object') {
      resultURL.searchParams.set(key, JSON.stringify(value))
    } else {
      resultURL.searchParams.set(key, value)
    }
  }
  return resultURL
}
