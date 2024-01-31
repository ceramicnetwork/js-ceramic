import { type Context, Type, type } from 'codeco'
import { commitIdAsString, CommitTypeAsNumber, StreamMetadata } from './stream.js'

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
  commitId: commitIdAsString,
  content: JsonAsString,
  metadata: StreamMetadata,
  eventType: CommitTypeAsNumber,
})
