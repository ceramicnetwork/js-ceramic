import { fromString, toString } from 'uint8arrays'
import { type Context, TrivialCodec, Type } from 'codeco'

/**
 * codeco codec for JS `Uint8Array`.
 */
export const uint8array = new TrivialCodec(
  'Uint8Array',
  (input: unknown): input is Uint8Array => input instanceof Uint8Array
)

/**
 * codeco codec for Uint8Array as base64-encoded string.
 */
export const uint8ArrayAsBase64 = new Type<Uint8Array, string, string>(
  'Uint8Array-as-base64',
  (input: unknown): input is Uint8Array => input instanceof Uint8Array,
  (input: string, context: Context) => {
    try {
      return context.success(fromString(input, 'base64'))
    } catch {
      return context.failure()
    }
  },
  (value: Uint8Array): string => toString(value, 'base64')
)
