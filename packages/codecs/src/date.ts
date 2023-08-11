import { type Context, Type } from 'codeco'

/**
 * codeco codec for JS `Date` encoded as ISO8601 string, and decoded from string or `Date` instance.
 */
export const date = new Type<Date, string, unknown>(
  'Date-as-ISOString',
  (input: unknown): input is Date => input instanceof Date,
  function (this: Type<Date>, input: unknown, context: Context) {
    if (this.is(input)) return context.success(input)
    if (typeof input === 'string') {
      const parsed = new Date(input)
      const isParsingSuccessful = Number.isFinite(parsed.valueOf())
      if (isParsingSuccessful) return context.success(parsed)
    }
    return context.failure()
  },
  (input: Date) => input.toISOString()
)

export const dateAsUnix = new Type<Date, number, number>(
  'Date-as-UnixTimestamp',
  (input: unknown): input is Date => Boolean(input && input instanceof Date),
  (input: number, context: Context) => {
    try {
      return context.success(new Date(input))
    } catch {
      return context.failure()
    }
  },
  (date) => date.getTime()
)
