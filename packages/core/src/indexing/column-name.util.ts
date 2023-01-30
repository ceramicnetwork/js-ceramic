const CUSTOM_COLUMN_PREFIX = 'custom_'

export function addColumnPrefix(name: string): string {
  return name.startsWith(CUSTOM_COLUMN_PREFIX) ? name : CUSTOM_COLUMN_PREFIX + name
}
