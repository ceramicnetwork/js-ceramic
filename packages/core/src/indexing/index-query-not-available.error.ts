import type { StreamID } from '@ceramicnetwork/streamid'

export class IndexQueryNotAvailableError extends Error {
  constructor(model: StreamID | string) {
    super(
      `Queries on Model ${model} are not currently available because historical data for that model is still syncing`
    )
  }
}
