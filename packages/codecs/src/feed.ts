import { type Context, Type, type, string } from 'codeco'
import { commitIdAsString, EventTypeAsNumber, StreamMetadata } from './stream.js'

export const JsonAsString = new Type<unknown, string, string>(
  'JSON-as-string',
  (_input: unknown): _input is unknown => true,
  (input: string, context: Context) => {
    try {
      return context.success(JSON.parse(input))
    } catch {
      return context.failure()
    }
  },
  (data) => JSON.stringify(data)
)

export const AggregationDocument = type({
  token: string,
  commitId: commitIdAsString,
  content: JsonAsString,
  metadata: StreamMetadata,
  eventType: EventTypeAsNumber,
})
