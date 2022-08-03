import type { StreamID } from '@ceramicnetwork/streamid'

export class IndexQueryNotAvailableError extends Error {
  constructor(model: StreamID |  string) {
    super(`Index for historical data on ${model} is not available`)
  }
}
