import type { StreamID } from '@ceramicnetwork/streamid'

/**
 * Convert StreamID to table name for the indexing database.
 */
export function asTableName(model: StreamID | string): string {
  return model.toString()
}
