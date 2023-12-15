/**
 * Takes a query object and parses the values to give them proper types instead of having everything
 * as strings
 * @param opts
 */
export function parseQueryObject(
  opts: Record<string, any>
): Record<string, string | boolean | number> {
  const typedOpts = {}
  for (const [key, value] of Object.entries(opts)) {
    if (typeof value == 'string') {
      if (value[0] == '{') {
        // value is a sub-object
        typedOpts[key] = parseQueryObject(JSON.parse(value))
      } else if (value === 'true') {
        typedOpts[key] = true
      } else if (value === 'false') {
        typedOpts[key] = false
      } else if (!isNaN(parseInt(value))) {
        typedOpts[key] = parseInt(value)
      } else {
        typedOpts[key] = value
      }
    } else {
      typedOpts[key] = value
    }
  }
  return typedOpts
}
