import { type TypeOf, strict, string } from 'codeco'

import { cidAsString } from './ipld.js'
import { streamIdAsString } from './stream.js'

export enum RequestStatusName {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  READY = 'READY',
  REPLACED = 'REPLACED',
}

export const RequestAnchorParams = strict(
  {
    streamID: streamIdAsString,
    tip: cidAsString,
    timestampISO: string, // a result of Date.toISOString()
  },
  'RequestAnchorParams'
)
export type RequestAnchorParams = TypeOf<typeof RequestAnchorParams>
