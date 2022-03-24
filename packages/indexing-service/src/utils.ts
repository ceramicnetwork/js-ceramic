const CERAMIC_PREFIX = 'ceramic://'

export function formatSchema(schema?: string): string | undefined {
  return schema?.startsWith(CERAMIC_PREFIX) ? schema.substring(CERAMIC_PREFIX.length) : schema
}
