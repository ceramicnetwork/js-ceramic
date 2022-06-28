import type { StreamID } from '@ceramicnetwork/streamid'

/**
 * Convert StreamID to table name `mid_%`
 */
export function asTableName(model: StreamID | string): string {
  return model.toString()
}
