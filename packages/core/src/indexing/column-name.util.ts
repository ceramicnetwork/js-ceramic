const CUSTOM_COLUMN_PREFIX = 'custom_'

export function addColumnPrefix(name: string): string {
  return CUSTOM_COLUMN_PREFIX + name
}
