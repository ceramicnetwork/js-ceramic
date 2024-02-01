import { type Context, Type, type } from 'codeco'
import { commitIdAsString } from './stream.js'

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
  (commitID) => JSON.stringify(commitID)
)

export const AggregationDocument = type({
  commitId: commitIdAsString,
})
